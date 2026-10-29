// 高校数据层：Supabase universities 表 CRUD + 缓存瘦身列 + 出口清洗。
// 独立于 schools（data-store.js）——高校为全局频道，无 region 概念。
// 设计见 docs/高校知识库详细设计.md。
//
// - 列表查询排除 content/score_lines/disciplines 大字段（缓存瘦身，SCHOOLS_LIST_COLUMNS 同纪律）
// - 详情 getUniversityBySlug 返回全行，但剔除 audit_notes（出口清洗单源）
// - 写操作仅供研究流水线（service_role，node 脚本直跑）

const { getServiceClient } = require('./supabase-client');

const UNIVERSITIES_TABLE = process.env.SUPABASE_UNIVERSITIES_TABLE || 'universities';

// 列表页/对比页所需的瘦列集合（大 jsonb 一律排除）
const UNIVERSITIES_LIST_COLUMNS = [
  'id', 'slug', 'moe_code', 'name', 'aliases', 'province', 'city',
  'is_undergrad', 'nature', 'affiliation', 'tags', 'founding_year',
  'profile_depth', 'info_verified'
].join(',');

// 受控词表（tests/universities-schema.mjs 同步校验）
const VOCAB = {
  nature: ['公办', '民办', '中外合作'],
  affiliation: ['教育部', '工信部', '其他部委', '省级', '市级', '军队'],
  tags: ['双一流', '985', '211', '强基计划'],
  rating: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'],
  track: ['物理类', '历史类', '综合改革(3+3)', '综合改革(3+1+2)', '不分科'],
  batch: ['本科批', '专科批', '提前批', '特殊类型招生']
};

// DB 行 → 页面对象（camelCase，audit_notes 剔除——出口清洗唯一入口）
function normalizeUniversity(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    moeCode: row.moe_code,
    name: row.name,
    aliases: Array.isArray(row.aliases) ? row.aliases : [],
    province: row.province,
    city: row.city,
    isUndergrad: row.is_undergrad,
    nature: row.nature,
    affiliation: row.affiliation,
    tags: Array.isArray(row.tags) ? row.tags : [],
    disciplines: Array.isArray(row.disciplines) ? row.disciplines : [],
    foundingYear: row.founding_year,
    address: row.address,
    website: row.website,
    content: Array.isArray(row.content) ? row.content : [],
    scoreLines: Array.isArray(row.score_lines) ? row.score_lines : [],
    outcomeStats: Array.isArray(row.outcome_stats) ? row.outcome_stats : [],
    profileDepth: row.profile_depth,
    infoVerified: row.info_verified
    // audit_notes 有意不映射——对外出口永不出该字段
  };
}

function publicUniversityColumns() {
  // 详情查询列（全行减 audit_notes；不 SELECT * 是为了把清洗做在查询层）
  return [
    'id', 'slug', 'moe_code', 'name', 'aliases', 'province', 'city',
    'is_undergrad', 'nature', 'affiliation', 'tags', 'disciplines',
    'founding_year', 'address', 'website', 'content', 'score_lines',
    'outcome_stats', 'profile_depth', 'info_verified'
  ].join(',');
}

async function loadUniversitiesList() {
  const client = getServiceClient();
  const pageSize = 1000;
  let from = 0;
  const rows = [];
  for (;;) {
    const { data, error } = await client
      .from(UNIVERSITIES_TABLE)
      .select(UNIVERSITIES_LIST_COLUMNS)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`universities 列表加载失败: ${error.message}`);
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows.map((r) => normalizeUniversity(r));
}

async function getUniversityBySlug(slug) {
  const client = getServiceClient();
  const { data, error } = await client
    .from(UNIVERSITIES_TABLE)
    .select(publicUniversityColumns())
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`universities 详情加载失败: ${error.message}`);
  return normalizeUniversity(data);
}

async function getUniversitiesBySlugs(slugs) {
  if (!slugs.length) return [];
  const client = getServiceClient();
  const out = [];
  const chunk = 50; // PostgREST in 过滤器 URL 长度安全分片
  for (let i = 0; i < slugs.length; i += chunk) {
    const part = slugs.slice(i, i + chunk);
    const { data, error } = await client
      .from(UNIVERSITIES_TABLE)
      .select(publicUniversityColumns())
      .in('slug', part);
    if (error) throw new Error(`universities 批量加载失败: ${error.message}`);
    out.push(...data);
  }
  return out.map((r) => normalizeUniversity(r));
}

// ============ 写操作（研究流水线专用，service_role） ============

// 内部字段：写库时允许带 audit_notes（内部审计链），不出现在读出口
function buildUniversityRecord(input) {
  return {
    slug: input.slug,
    moe_code: input.moeCode || null,
    name: input.name,
    aliases: Array.isArray(input.aliases) ? input.aliases : [],
    province: input.province || '',
    city: input.city || '',
    is_undergrad: input.isUndergrad !== false,
    nature: input.nature || '',
    affiliation: input.affiliation || '',
    tags: Array.isArray(input.tags) ? input.tags : [],
    disciplines: Array.isArray(input.disciplines) ? input.disciplines : [],
    founding_year: input.foundingYear ? Number(input.foundingYear) || null : null,
    address: input.address || '',
    website: input.website || '',
    content: Array.isArray(input.content) ? input.content : [],
    score_lines: Array.isArray(input.scoreLines) ? input.scoreLines : [],
    outcome_stats: Array.isArray(input.outcomeStats) ? input.outcomeStats : [],
    profile_depth: input.profileDepth || 'basic',
    info_verified: Boolean(input.infoVerified),
    audit_notes: input.auditNotes || ''
  };
}

async function createUniversityInSupabase(input) {
  const client = getServiceClient();
  const record = buildUniversityRecord(input);
  const { data, error } = await client
    .from(UNIVERSITIES_TABLE)
    .insert(record)
    .select('slug,name,moe_code')
    .single();
  if (error) {
    if (error.code === '23505') {
      return { skipped: true, reason: 'duplicate', slug: record.slug };
    }
    throw new Error(`universities 创建失败: ${error.message}`);
  }
  return data;
}

// 全量更新（seed 阶段骨架回填；slug 为锚不可改）
async function updateUniversityInSupabase(slug, input) {
  const client = getServiceClient();
  const record = buildUniversityRecord(input);
  delete record.slug;
  const { data, error } = await client
    .from(UNIVERSITIES_TABLE)
    .update(record)
    .eq('slug', slug)
    .select('slug,name')
    .single();
  if (error) throw new Error(`universities 更新失败: ${error.message}`);
  return data;
}

module.exports = {
  UNIVERSITIES_TABLE,
  UNIVERSITIES_LIST_COLUMNS,
  VOCAB,
  loadUniversitiesList,
  getUniversityBySlug,
  getUniversitiesBySlugs,
  createUniversityInSupabase,
  updateUniversityInSupabase
};
