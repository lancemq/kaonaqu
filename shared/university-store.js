// 高校数据层：PostgreSQL universities 表 CRUD + 缓存瘦身列 + 出口清洗。
// 2026-11-05 从 Supabase PostgREST 迁移为 pg 直连（shared/pg-client.js）。
// 独立于 schools（data-store.js）——高校为全局频道，无 region 概念。
// 设计见 docs/高校知识库详细设计.md。
//
// - 列表查询排除 content/score_lines/disciplines 大字段（缓存瘦身）
// - 详情 getUniversityBySlug 返回全行，但剔除 audit_notes（出口清洗单源）
// - 写操作仅供研究流水线（node 脚本直跑）

const { query, isPgConfigured } = require('./pg-client');

const UNIVERSITIES_TABLE = 'universities';

// 列表页/对比页所需的瘦列集合（大 jsonb 一律排除）
const UNIVERSITIES_LIST_COLUMNS_SQL = [
  'id', 'slug', 'moe_code', 'name', 'aliases', 'province', 'city',
  'is_undergrad', 'nature', 'affiliation', 'tags', 'founding_year',
  'profile_depth', 'info_verified'
].join(', ');

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

// 详情查询列（全行减 audit_notes；清洗做在查询层）
const PUBLIC_UNIVERSITY_COLUMNS_SQL = [
  'id', 'slug', 'moe_code', 'name', 'aliases', 'province', 'city',
  'is_undergrad', 'nature', 'affiliation', 'tags', 'disciplines',
  'founding_year', 'address', 'website', 'content', 'score_lines',
  'outcome_stats', 'profile_depth', 'info_verified'
].join(', ');

// 列表查询实例内存缓存（2952 行瘦列，映射成本可观；TTL 1800s 与 schools 同纪律）
let _listCache = null;
let _listCacheTs = 0;
const LIST_TTL = 1800;

async function loadUniversitiesList() {
  if (!isPgConfigured()) return [];
  const now = Date.now();
  if (_listCache && now - _listCacheTs < LIST_TTL) return _listCache;
  const rows = await query(
    `SELECT ${UNIVERSITIES_LIST_COLUMNS_SQL} FROM universities ORDER BY id ASC`
  );
  _listCache = rows.map((r) => normalizeUniversity(r));
  _listCacheTs = now;
  return _listCache;
}

async function getUniversityBySlug(slug) {
  const rows = await query(
    `SELECT ${PUBLIC_UNIVERSITY_COLUMNS_SQL} FROM universities WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return normalizeUniversity(rows[0]);
}

async function getUniversitiesBySlugs(slugs) {
  if (!slugs.length) return [];
  const rows = await query(
    `SELECT ${PUBLIC_UNIVERSITY_COLUMNS_SQL} FROM universities WHERE slug = ANY($1)`,
    [slugs]
  );
  return rows.map((r) => normalizeUniversity(r));
}

// ============ 写操作（研究流水线专用） ============

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

const UNIVERSITY_WRITE_COLUMNS = [
  'slug', 'moe_code', 'name', 'aliases', 'province', 'city', 'is_undergrad',
  'nature', 'affiliation', 'tags', 'disciplines', 'founding_year', 'address',
  'website', 'content', 'score_lines', 'outcome_stats', 'profile_depth',
  'info_verified', 'audit_notes'
];

// jsonb 列打包为 JSON 字符串（pg 参数化传对象会走 json 转换，这里显式 stringify 更稳）
function universityRowToParams(row) {
  return [
    row.slug, row.moe_code, row.name,
    JSON.stringify(row.aliases),
    row.province, row.city, row.is_undergrad, row.nature, row.affiliation,
    JSON.stringify(row.tags), JSON.stringify(row.disciplines),
    row.founding_year, row.address, row.website,
    JSON.stringify(row.content), JSON.stringify(row.score_lines),
    JSON.stringify(row.outcome_stats), row.profile_depth,
    row.info_verified, row.audit_notes
  ];
}

function isDuplicateKeyError(err) {
  return err && err.code === '23505';
}

// 写侧清列表缓存：研究流水线写库后立即可见
function invalidateListCache() {
  _listCache = null;
  _listCacheTs = 0;
}

async function createUniversityInSupabase(input) {
  const record = buildUniversityRecord(input);
  const cols = UNIVERSITY_WRITE_COLUMNS.join(', ');
  const placeholders = UNIVERSITY_WRITE_COLUMNS.map((_, i) => `$${i + 1}`).join(', ');
  try {
    const rows = await query(
      `INSERT INTO universities (${cols}) VALUES (${placeholders})
       RETURNING slug, name, moe_code`,
      universityRowToParams(record)
    );
    invalidateListCache();
    return rows[0];
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return { skipped: true, reason: 'duplicate', slug: record.slug };
    }
    throw new Error(`universities 创建失败: ${err.message}`);
  }
}

// 全量更新（seed 阶段骨架回填；slug 为锚不可改）。
// 与 PostgREST 版本语义一致：本函数为「全量更新」，调用方（apply 脚本）负责
// 先读库合并再传完整 input——不在这里做读改合并，避免并发写竞态。
async function updateUniversityInSupabase(slug, input) {
  const record = buildUniversityRecord({ name: input.name, ...input });
  if (!record.name) {
    throw new Error('universities 更新失败: 缺 name（全量更新必须传完整行）');
  }
  const params = universityRowToParams(record).slice(1); // 去 slug：$1..$19 = 写入列
  const sets = UNIVERSITY_WRITE_COLUMNS.slice(1).map((col, i) => `${col} = $${i + 1}`);
  params.push(slug); // $20 = WHERE slug
  try {
    const rows = await query(
      `UPDATE universities SET ${sets.join(', ')} WHERE slug = $${params.length}
       RETURNING slug, name`,
      params
    );
    invalidateListCache();
    return rows[0];
  } catch (err) {
    throw new Error(`universities 更新失败: ${err.message}`);
  }
}

module.exports = {
  UNIVERSITIES_TABLE,
  UNIVERSITIES_LIST_COLUMNS_SQL,
  VOCAB,
  loadUniversitiesList,
  getUniversityBySlug,
  getUniversitiesBySlugs,
  createUniversityInSupabase,
  updateUniversityInSupabase,
  invalidateListCache
};
