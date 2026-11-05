// 数据层：自建 PostgreSQL（pg 驱动直连）读取 + 写入。
// 2026-11-05 从 Supabase PostgREST 迁移（shared/supabase-client.js 保留但不再被本文件引用）。
// 连接：shared/pg-client.js（DATABASE_URL / POSTGRES_URL_NON_POOLING / POSTGRES_URL）。
//
// 迁移纪律：
// - 每个函数的返回形态与 PostgREST 版本严格一致（jsonb 由 pg 驱动直接对象化，
//   rowToSchool/rowToNews 无需改动；字段缺省用 COALESCE 或 row 侧兜底）。
// - 缓存层级不变：列表 memoizedList（实例内存 1800s）+ 详情 memoizedDetail（LRU）。
//   原 Next Data Cache（fetch 缓存）随 PostgREST 一起移除——pg 查询不经 fetch，
//   实例内存 memo 即可覆盖单实例部署场景；服务器部署为单实例，无跨实例失效问题。
// - 列表瘦列纪律保留：SQL 显式列出列名（原 SCHOOLS_LIST_COLUMNS 同一集合）。

const { query, isPgConfigured } = require('./pg-client');
const {
  DEFAULT_REGION,
  getKeyLevelPriority,
  getDistrictNameToId,
  getDistrictIdToName
} = require('./region-config');

// === 读取 ===

// 从 school_stage_label 推断 school_stage（数据库已删 school_stage 列）
function inferSchoolStage(stageLabel) {
  if (!stageLabel) return '';
  if (stageLabel.includes('初中')) return 'junior';
  if (stageLabel.includes('完全')) return 'complete';
  return 'senior_high';
}

// region 未在 region-config 注册时容错兜底 DEFAULT_REGION：
// DB 可能有未配置地区的数据，映射层不应因此抛错；districtId 兜底空字符串。
function districtNameToIdSafe(region, name) {
  try {
    return getDistrictNameToId(region || DEFAULT_REGION)[name] || '';
  } catch {
    return getDistrictNameToId(DEFAULT_REGION)[name] || '';
  }
}

// rowToSchool：完全从数据库行映射，仅返回 DB 列对应的字段 + 运行时派生字段
function rowToSchool(row) {
  if (!row) return null;
  const slug = row.slug || '';
  return {
    id: slug,
    dbId: row.id,
    name: row.name,
    districtId: districtNameToIdSafe(row.region, row.district_name),
    districtName: row.district_name,
    region: row.region || DEFAULT_REGION,
    schoolStage: inferSchoolStage(row.school_stage_label),
    schoolStageLabel: row.school_stage_label,
    schoolPropertyLabel: row.school_property_label,
    schoolKeyLevel: row.school_key_level,
    eliteCohort: row.elite_cohort,
    group: row.group,
    address: row.address,
    phone: row.phone,
    website: row.website,
    foundingYear: row.founding_year,
    isBoarding: row.is_boarding,
    isInternational: row.is_international,
    image: row.image,
    // 统一招生信息源：所有招生字段都来自 admission_info
    admissionInfo: {
      code: row.admission_info?.code || '',
      methods: Array.isArray(row.admission_info?.methods) ? row.admission_info.methods : [],
      routes: Array.isArray(row.admission_info?.routes) ? row.admission_info.routes : [],
      notes: row.admission_info?.notes || '',
      // 内部审计原文（独立列 admission_audit，仅库内使用：apply 幂等去重、enrichment 消费）
      auditNotes: row.admission_audit || ''
    },
    // 兼容别名（全部派生自 admission_info）
    admissionCode: row.admission_info?.code || '',
    admissionMethods: Array.isArray(row.admission_info?.methods) ? row.admission_info.methods : [],
    admissionRoutes: Array.isArray(row.admission_info?.routes) ? row.admission_info.routes : [],
    contentFile: slug ? `content/schools/${slug}.md` : '',
    profileDepth: row.profile_depth || 'enhanced',
    features: row.features || [],
    scoreLines: Array.isArray(row.score_lines) ? row.score_lines : [],
    outcomeStats: Array.isArray(row.outcome_stats) ? row.outcome_stats : [],
    content: Array.isArray(row.content) ? row.content : [],
    infoVerified: !!row.info_verified
  };
}

// 学校排序：eliteCohort 非空优先 + schoolKeyLevel 重点优先。
// ⚠️ 键必须与 DB 真实 school_key_level 词表严格对齐（带 (高中)/(初中) 后缀）。
const KEY_LEVEL_PRIORITY = getKeyLevelPriority(DEFAULT_REGION);

function sortBySchoolPriority(items) {
  return items.slice().sort((a, b) => {
    const aCohort = String(a?.eliteCohort || '').trim() ? 1 : 0;
    const bCohort = String(b?.eliteCohort || '').trim() ? 1 : 0;
    if (aCohort !== bCohort) return bCohort - aCohort;
    const aLevel = KEY_LEVEL_PRIORITY[String(a?.schoolKeyLevel || '').trim()] || 0;
    const bLevel = KEY_LEVEL_PRIORITY[String(b?.schoolKeyLevel || '').trim()] || 0;
    if (bLevel !== aLevel) return bLevel - aLevel;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

// 列表轻量列集（瘦列纪律：排除 content / admission_info / admission_audit 三个大字段）。
const SCHOOLS_LIST_COLUMNS_SQL = [
  'id', 'slug', 'name', 'region', 'district_name', 'school_stage_label', 'school_property_label',
  'school_key_level', 'elite_cohort', '"group"', 'address', 'phone', 'website',
  'founding_year', 'is_boarding', 'is_international', 'image', 'profile_depth',
  'features', 'info_verified', 'score_lines', 'outcome_stats'
].join(', ');

// 新闻列表轻量列集（排除 content）。
const NEWS_LIST_COLUMNS_SQL = [
  'id', 'title', 'news_type', 'category', 'exam_type', 'summary', 'published_at', 'updated_at',
  'source', 'district_id', 'district_name', 'primary_school_id', 'related_school_ids',
  'school_link_reason', 'school_link_confidence'
].join(', ');

// 单校完整查询（详情页 / 列表 ≤10 张卡 / API）。
// 兼容 Next 动态路由 params：可能是数组或编码后的 slug；limit 1 对重复 slug 鲁棒。
async function fetchSchoolById(rawId) {
  if (rawId == null) return null;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  let decodedId = String(id || '');
  try {
    decodedId = decodeURIComponent(String(id || ''));
  } catch {
    // 已解码则保持原值
  }
  const rows = await query(
    `SELECT * FROM schools WHERE slug = $1 LIMIT 1`,
    [decodedId]
  );
  return rows.length ? rowToSchool(rows[0]) : null;
}

// 单条新闻完整查询（详情页 / API 用，需 content）。
async function fetchNewsById(rawId) {
  if (rawId == null) return null;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const normalizedId = String(id || '');
  let decodedId = normalizedId;
  try {
    decodedId = decodeURIComponent(normalizedId);
  } catch {
    // 已解码则保持原值
  }
  const rows = await query(
    `SELECT * FROM news WHERE id = ANY($1) LIMIT 1`,
    [[normalizedId, decodedId]]
  );
  return rows.length ? rowToNews(rows[0]) : null;
}

// news content 支持 JSON block 数组（新）与 Markdown 字符串（旧）两种格式。
function parseNewsContent(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [{ type: 'markdown', text: raw }];
  }
  return [];
}

// rowToNews：DB snake_case 列 -> 应用 camelCase 字段
function rowToNews(row) {
  if (!row) return null;
  const source = row.source || {};
  return {
    id: row.id,
    title: row.title || '',
    newsType: row.news_type || '',
    category: row.category || '',
    examType: row.exam_type || '',
    summary: row.summary || '',
    content: parseNewsContent(row.content),
    publishedAt: row.published_at || '',
    updatedAt: row.updated_at || '',
    source: {
      type: source.type || '',
      name: source.name || '',
      url: source.url || '',
      crawledAt: source.crawledAt || null,
      confidence: source.confidence !== undefined ? source.confidence : null
    },
    districtId: row.district_id || '',
    districtName: row.district_name || '',
    region: row.region || DEFAULT_REGION,
    primarySchoolId: row.primary_school_id || '',
    relatedSchoolIds: Array.isArray(row.related_school_ids) ? row.related_school_ids : [],
    schoolLinkReason: row.school_link_reason || '',
    schoolLinkConfidence: row.school_link_confidence !== undefined && row.school_link_confidence !== null
      ? Number(row.school_link_confidence)
      : null
  };
}

// ===== 实例级列表缓存（原 Fluid CPU 优化，单实例下继续生效）=====
const LIST_MEMO_TTL = 1800;
const listMemo = new Map();

async function memoizedList(key, loader) {
  const hit = listMemo.get(key);
  if (hit && Date.now() - hit.ts < LIST_MEMO_TTL) return hit.promise;
  const promise = loader().catch((err) => {
    listMemo.delete(key);
    throw err;
  });
  listMemo.set(key, { ts: Date.now(), promise });
  return promise;
}

// 详情级 LRU 内存缓存（单条学校/新闻 + 列表页当前页批量取整校）。
const DETAIL_MEMO_TTL = 1800;
const DETAIL_MEMO_MAX = 2000;
const detailMemo = new Map();

async function memoizedDetail(key, loader) {
  const hit = detailMemo.get(key);
  if (hit && Date.now() - hit.ts < DETAIL_MEMO_TTL) {
    detailMemo.delete(key); detailMemo.set(key, hit); // LRU 触碰
    return hit.promise;
  }
  const promise = loader().then((v) => {
    if (v == null) return v;
    if (detailMemo.size >= DETAIL_MEMO_MAX) {
      detailMemo.delete(detailMemo.keys().next().value);
    }
    return v;
  }).catch((err) => {
    detailMemo.delete(key);
    throw err;
  });
  detailMemo.set(key, { ts: Date.now(), promise });
  return promise;
}

// 全量学校列表（轻量，排除 content/admission_info/score_lines 以外大字段）。
async function loadSchoolsList(region = DEFAULT_REGION) {
  return memoizedList(`schools:${region}`, async () => {
    if (!isPgConfigured()) return [];
    const rows = await query(
      `SELECT ${SCHOOLS_LIST_COLUMNS_SQL} FROM schools WHERE region = $1 ORDER BY id ASC`,
      [region]
    );
    return rows.map((row) => rowToSchool(row)).filter(Boolean);
  });
}

// 全量新闻列表（轻量，排除 content）。published_at 并列时按 id 倒序次级排序。
// 新闻详情页相关数据专用：按 exam_type/category 过滤取最近 N 条（SQL 下推）。
async function loadNewsForRelated(region, { examType = '', category = '', excludeId = '', limit = 12 } = {}) {
  if (!isPgConfigured()) return [];
  const conditions = ['region = $1'];
  const params = [region];
  let idx = 2;
  if (excludeId) {
    conditions.push(`id <> $${idx++}`);
    params.push(excludeId);
  }
  if (examType) {
    conditions.push(`exam_type = $${idx++}`);
    params.push(examType);
  } else if (category) {
    conditions.push(`category = $${idx++}`);
    params.push(category);
  }
  conditions.push('content IS NOT NULL'); // no-op 条件占位避免空串（保持参数从 $2 起稳定）
  const rows = await query(
    `SELECT ${NEWS_LIST_COLUMNS_SQL} FROM news WHERE ${conditions.join(' AND ')}
     ORDER BY published_at DESC, id DESC LIMIT ${Number(limit) || 12}`,
    params
  );
  return rows.map((row) => rowToNews(row)).filter(Boolean);
}

async function loadNewsList(region = DEFAULT_REGION) {
  return memoizedList(`news:${region}`, async () => {
    if (!isPgConfigured()) return [];
    const rows = await query(
      `SELECT ${NEWS_LIST_COLUMNS_SQL} FROM news WHERE region = $1 ORDER BY published_at DESC, id DESC`,
      [region]
    );
    return rows.map((row) => rowToNews(row)).filter(Boolean);
  });
}

// 按区域 ID 查学校（区域详情页）。
async function loadSchoolsByDistrict(districtId, region = DEFAULT_REGION) {
  if (!isPgConfigured()) return [];
  const districtName = getDistrictIdToName(region)[districtId];
  if (!districtName) return [];
  const rows = await query(
    `SELECT ${SCHOOLS_LIST_COLUMNS_SQL} FROM schools WHERE region = $1 AND district_name = $2 ORDER BY id ASC`,
    [region, districtName]
  );
  return rows.map((row) => rowToSchool(row)).filter(Boolean);
}

// === 条件查询（API 列表/搜索路径）===
// 过滤条件下推到 SQL（region/district/stage/propertyLabel/q）。

// ilike 转义：这些字符在 LIKE 模式中有语法含义。
function escapeIlike(value) {
  return String(value).replace(/([%_\\])/g, '\\$1');
}

// stage（junior/complete/senior_high）反推 school_stage_label。
const STAGE_TO_LABEL = { junior: '初中', complete: '完全中学', senior_high: '高中' };

// 学校条件查询（轻量列集）。filters:
//   region / districtId / stage / propertyLabel / q（模糊匹配
//   name/address/district_name/stage/property/keyLevel/eliteCohort 标签文本）
async function querySchoolsList(filters = {}) {
  if (!isPgConfigured()) return [];
  const region = filters.region || DEFAULT_REGION;
  const conditions = ['region = $1'];
  const params = [region];
  let idx = 2;

  if (filters.districtId && filters.districtId !== 'all') {
    const districtName = getDistrictIdToName(region)[filters.districtId];
    if (!districtName) return [];
    conditions.push(`district_name = $${idx++}`);
    params.push(districtName);
  }
  if (filters.stage) {
    const stageLabel = STAGE_TO_LABEL[filters.stage];
    if (!stageLabel) return [];
    conditions.push(`school_stage_label = $${idx++}`);
    params.push(stageLabel);
  }
  if (filters.propertyLabel) {
    conditions.push(`school_property_label = $${idx++}`);
    params.push(filters.propertyLabel);
  }
  if (filters.q) {
    const like = `%${escapeIlike(filters.q)}%`;
    conditions.push(
      `(name ILIKE $${idx} OR address ILIKE $${idx} OR district_name ILIKE $${idx}
        OR school_stage_label ILIKE $${idx} OR school_property_label ILIKE $${idx}
        OR school_key_level ILIKE $${idx} OR elite_cohort ILIKE $${idx})`
    );
    idx += 1;
    params.push(like);
  }

  const rows = await query(
    `SELECT ${SCHOOLS_LIST_COLUMNS_SQL} FROM schools WHERE ${conditions.join(' AND ')} ORDER BY id ASC`,
    params
  );
  return rows.map((row) => rowToSchool(row)).filter(Boolean);
}

// 新闻条件查询（轻量列集）。filters:
//   region / districtId / examType / newsType / category / q（模糊匹配 title/summary/category）
async function queryNewsList(filters = {}) {
  if (!isPgConfigured()) return [];
  const region = filters.region || DEFAULT_REGION;
  const conditions = ['region = $1'];
  const params = [region];
  let idx = 2;

  if (filters.districtId && filters.districtId !== 'all') {
    conditions.push(`district_id = $${idx++}`);
    params.push(filters.districtId);
  }
  if (filters.examType) {
    conditions.push(`exam_type = $${idx++}`);
    params.push(filters.examType);
  }
  if (filters.newsType) {
    conditions.push(`news_type = $${idx++}`);
    params.push(filters.newsType);
  }
  if (filters.category) {
    conditions.push(`category = $${idx++}`);
    params.push(filters.category);
  }
  if (filters.q) {
    const like = `%${escapeIlike(filters.q)}%`;
    conditions.push(`(title ILIKE $${idx} OR summary ILIKE $${idx} OR category ILIKE $${idx})`);
    idx += 1;
    params.push(like);
  }

  const rows = await query(
    `SELECT ${NEWS_LIST_COLUMNS_SQL} FROM news WHERE ${conditions.join(' AND ')}
     ORDER BY published_at DESC, id DESC`,
    params
  );
  return rows.map((row) => rowToNews(row)).filter(Boolean);
}

// 仅取新闻 id 列表（sitemap 用）。
async function loadNewsIds(region = DEFAULT_REGION) {
  if (!isPgConfigured()) return [];
  const rows = await query(
    `SELECT id FROM news WHERE region = $1 ORDER BY published_at DESC`,
    [region]
  );
  return rows.map((row) => row.id).filter(Boolean);
}

// 仅取学校 slug（= 详情路由 id）列表（sitemap 用）。
async function loadSchoolIds(region = DEFAULT_REGION) {
  if (!isPgConfigured()) return [];
  const rows = await query(
    `SELECT slug FROM schools WHERE region = $1 ORDER BY id ASC`,
    [region]
  );
  return rows.map((row) => row.slug).filter(Boolean);
}

// 分数匹配页所需最小字段集。
async function loadSchoolsMinimal(region = DEFAULT_REGION) {
  if (!isPgConfigured()) return [];
  const nameToId = getDistrictNameToId(region);
  const rows = await query(
    `SELECT slug, name, district_name, school_stage_label, school_key_level, elite_cohort, "group", is_international, score_lines
     FROM schools WHERE region = $1 ORDER BY id ASC`,
    [region]
  );
  return rows.map((row) => ({
    id: row.slug || '',
    name: row.name || '',
    districtId: nameToId[row.district_name] || '',
    districtName: row.district_name || '',
    region: row.region || region,
    schoolStage: inferSchoolStage(row.school_stage_label),
    eliteCohort: row.elite_cohort || '',
    schoolKeyLevel: row.school_key_level || '',
    group: row.group || '',
    isInternational: row.is_international === true,
    scoreLines: Array.isArray(row.score_lines) ? row.score_lines : []
  }));
}

// 按 id 批量取学校名映射（新闻列表页 schoolNameMap 用）。
async function loadSchoolNamesByIds(ids) {
  if (!isPgConfigured()) return {};
  if (!Array.isArray(ids) || ids.length === 0) return {};
  const rows = await query(
    `SELECT slug, name FROM schools WHERE slug = ANY($1)`,
    [ids]
  );
  const map = {};
  for (const row of rows) {
    map[row.slug] = row.name;
  }
  return map;
}

// 新闻详情页相关学校：主校 + 按优先级填充。
async function loadSchoolsForRelated(primarySchoolId, limit = 4, region = DEFAULT_REGION) {
  if (!isPgConfigured()) return [];

  const [primaryRows, fillerRows] = await Promise.all([
    primarySchoolId
      ? query(`SELECT ${SCHOOLS_LIST_COLUMNS_SQL} FROM schools WHERE slug = $1 LIMIT 1`, [primarySchoolId])
      : Promise.resolve([]),
    query(
      `SELECT ${SCHOOLS_LIST_COLUMNS_SQL} FROM schools WHERE region = $1 AND slug <> $2 LIMIT $3`,
      [region, primarySchoolId || '', limit + 4]
    )
  ]);

  const primary = primaryRows.length ? rowToSchool(primaryRows[0]) : null;
  const fillers = sortBySchoolPriority(fillerRows.map((row) => rowToSchool(row)).filter(Boolean));
  const result = [];
  if (primary) result.push(primary);
  for (const s of fillers) {
    if (result.length >= limit) break;
    result.push(s);
  }
  return result;
}

// 按区域统计学校数（区域详情页侧栏排序用）。
async function loadSchoolCountsByDistrict(region = DEFAULT_REGION) {
  if (!isPgConfigured()) return {};
  const rows = await query(
    `SELECT district_name, count(*)::int AS n FROM schools WHERE region = $1 GROUP BY district_name`,
    [region]
  );
  const counts = {};
  for (const row of rows) {
    if (row.district_name) counts[row.district_name] = row.n;
  }
  return counts;
}

// === 写入 ===
// 应用层 camelCase -> DB snake_case 行（与 rowToSchool/rowToNews 严格对称）。

function schoolToRow(school = {}) {
  return {
    slug: school.id || '',
    name: school.name || '',
    district_name: school.districtName || '',
    region: school.region || DEFAULT_REGION,
    school_stage_label: school.schoolStageLabel || '',
    school_property_label: school.schoolPropertyLabel || '',
    school_key_level: school.schoolKeyLevel || '',
    elite_cohort: school.eliteCohort || '',
    group: school.group || '',
    address: school.address || '',
    phone: school.phone || '',
    website: school.website || '',
    founding_year: school.foundingYear ? Number(school.foundingYear) || null : null,
    is_boarding: !!school.isBoarding,
    is_international: !!school.isInternational,
    image: school.image || '',
    profile_depth: school.profileDepth || 'enhanced',
    features: Array.isArray(school.features) ? school.features : [],
    score_lines: Array.isArray(school.scoreLines) ? school.scoreLines : [],
    outcome_stats: Array.isArray(school.outcomeStats) ? school.outcomeStats : [],
    content: Array.isArray(school.content) ? school.content : [],
    admission_info: {
      code: school.admissionInfo?.code || school.admissionCode || '',
      methods: Array.isArray(school.admissionInfo?.methods) ? school.admissionInfo.methods
        : (Array.isArray(school.admissionMethods) ? school.admissionMethods : []),
      routes: Array.isArray(school.admissionInfo?.routes) ? school.admissionInfo.routes
        : (Array.isArray(school.admissionRoutes) ? school.admissionRoutes : []),
      notes: school.admissionInfo?.notes || ''
    },
    // 审计列：仅当调用方显式提供时写（admissionInfo.auditNotes 或 admissionAudit），
    // 否则不包含该键——update 不触碰列，历史脚本误传整对象也不会清掉审计原文
    ...(school.admissionInfo?.auditNotes !== undefined || school.admissionAudit !== undefined
      ? { admission_audit: school.admissionInfo?.auditNotes ?? school.admissionAudit ?? null }
      : {}),
    info_verified: !!school.infoVerified
  };
}

// news 表 id 为 TEXT 主键，直接写入。
function newsToRow(news = {}) {
  const source = news.source || {};
  return {
    id: news.id || '',
    title: news.title || '',
    news_type: news.newsType || '',
    category: news.category || '',
    exam_type: news.examType || '',
    summary: news.summary || '',
    content: typeof news.content === 'string' ? news.content : JSON.stringify(news.content || []),
    published_at: news.publishedAt || '',
    updated_at: news.updatedAt || '',
    source: {
      type: source.type || '',
      name: source.name || '',
      url: source.url || '',
      crawledAt: source.crawledAt || null,
      confidence: source.confidence !== undefined ? source.confidence : null
    },
    district_id: news.districtId || '',
    district_name: news.districtName || '',
    region: news.region || DEFAULT_REGION,
    primary_school_id: news.primarySchoolId || '',
    related_school_ids: Array.isArray(news.relatedSchoolIds) ? news.relatedSchoolIds : [],
    school_link_reason: news.schoolLinkReason || '',
    school_link_confidence: news.schoolLinkConfidence !== undefined && news.schoolLinkConfidence !== null
      ? Number(news.schoolLinkConfidence)
      : null
  };
}

// schools 表列清单（写入用；id 自增不入列）。group 是保留字，带引号。
const SCHOOL_COLUMNS = [
  'slug', 'name', 'district_name', 'region', 'school_stage_label', 'school_property_label',
  'school_key_level', 'elite_cohort', '"group"', 'address', 'phone', 'website',
  'founding_year', 'is_boarding', 'is_international', 'image', 'profile_depth',
  'features', 'score_lines', 'outcome_stats', 'content', 'admission_info',
  'info_verified'
];

function schoolRowToSqlParams(row) {
  // 列顺序与 SCHOOL_COLUMNS 严格一致（"group" 去引号取 row.group）。
  // ⚠️ jsonb 列必须显式 JSON.stringify：node-postgres 会把 JS 数组序列化为
  // Postgres array 字面量 {a,b}，写入 jsonb 列报 invalid input syntax for type json。
  const j = (v) => JSON.stringify(v == null ? (Array.isArray(v) ? [] : {}) : v);
  return [
    row.slug, row.name, row.district_name, row.region, row.school_stage_label,
    row.school_property_label, row.school_key_level, row.elite_cohort, row.group,
    row.address, row.phone, row.website, row.founding_year, row.is_boarding,
    row.is_international, row.image, row.profile_depth, j(row.features),
    j(row.score_lines), j(row.outcome_stats), j(row.content),
    j(row.admission_info), row.info_verified
  ];
}

async function createSchoolInSupabase(school) {
  const row = schoolToRow(school);
  const existing = await query(`SELECT slug FROM schools WHERE slug = $1 LIMIT 1`, [row.slug]);
  if (existing.length) {
    const error = new Error('学校已存在');
    error.statusCode = 409;
    throw error;
  }
  const cols = SCHOOL_COLUMNS.join(', ');
  const placeholders = SCHOOL_COLUMNS.map((_, i) => `$${i + 1}`).join(', ');
  // admission_audit 仅当显式提供时写
  if (row.admission_audit !== undefined) {
    const colsA = cols + ', admission_audit';
    const phA = placeholders + `, $${SCHOOL_COLUMNS.length + 1}`;
    const paramsA = [...schoolRowToSqlParams(row), row.admission_audit];
    const rows = await query(
      `INSERT INTO schools (${colsA}) VALUES (${phA}) RETURNING *`,
      paramsA
    );
    return rowToSchool(rows[0]);
  }
  const rows = await query(
    `INSERT INTO schools (${cols}) VALUES (${placeholders}) RETURNING *`,
    schoolRowToSqlParams(row)
  );
  return rowToSchool(rows[0]);
}

async function updateSchoolInSupabase(slug, school) {
  const row = schoolToRow({ ...school, id: slug });

  const existing = await query(`SELECT slug FROM schools WHERE slug = $1 LIMIT 1`, [slug]);
  if (!existing.length) {
    const error = new Error('学校不存在');
    error.statusCode = 404;
    throw error;
  }

  // 动态 SET：只更新 schoolToRow 产出的键；admission_audit 显式提供时追加
  const params = schoolRowToSqlParams(row);
  const sets = SCHOOL_COLUMNS.map((col, i) => `${col} = $${i + 1}`);
  if (row.admission_audit !== undefined) {
    sets.push(`admission_audit = $${SCHOOL_COLUMNS.length + 1}`);
    params.push(row.admission_audit);
  }
  params.push(slug);
  const rows = await query(
    `UPDATE schools SET ${sets.join(', ')} WHERE slug = $${params.length} RETURNING *`,
    params
  );
  return rowToSchool(rows[0]);
}

async function deleteSchoolFromSupabase(slug) {
  const existing = await query(`SELECT slug FROM schools WHERE slug = $1 LIMIT 1`, [slug]);
  if (!existing.length) {
    const error = new Error('学校不存在');
    error.statusCode = 404;
    throw error;
  }
  await query(`DELETE FROM schools WHERE slug = $1`, [slug]);
  return { ok: true, id: slug };
}

const NEWS_COLUMNS = [
  'id', 'title', 'news_type', 'category', 'exam_type', 'summary', 'content',
  'published_at', 'updated_at', 'source', 'district_id', 'district_name', 'region',
  'primary_school_id', 'related_school_ids', 'school_link_reason', 'school_link_confidence'
];

function newsRowToSqlParams(row) {
  // jsonb 列（source / related_school_ids）显式 stringify，理由同 schoolRowToSqlParams
  const j = (v) => JSON.stringify(v == null ? {} : v);
  return [
    row.id, row.title, row.news_type, row.category, row.exam_type, row.summary,
    typeof row.content === 'string' ? row.content : JSON.stringify(row.content || []),
    row.published_at, row.updated_at,
    j(row.source),
    row.district_id, row.district_name, row.region,
    row.primary_school_id,
    JSON.stringify(Array.isArray(row.related_school_ids) ? row.related_school_ids : []),
    row.school_link_reason, row.school_link_confidence
  ];
}

async function createNewsInSupabase(news) {
  const row = newsToRow(news);
  const existing = await query(`SELECT id FROM news WHERE id = $1 LIMIT 1`, [row.id]);
  if (existing.length) {
    const error = new Error('新闻已存在');
    error.statusCode = 409;
    throw error;
  }
  const cols = NEWS_COLUMNS.join(', ');
  const placeholders = NEWS_COLUMNS.map((_, i) => `$${i + 1}`).join(', ');
  const rows = await query(
    `INSERT INTO news (${cols}) VALUES (${placeholders}) RETURNING *`,
    newsRowToSqlParams(row)
  );
  return rowToNews(rows[0]);
}

async function updateNewsInSupabase(id, news) {
  const row = newsToRow({ ...news, id });
  const existing = await query(`SELECT id FROM news WHERE id = $1 LIMIT 1`, [id]);
  if (!existing.length) {
    const error = new Error('新闻不存在');
    error.statusCode = 404;
    throw error;
  }
  const params = newsRowToSqlParams(row);
  const sets = NEWS_COLUMNS.map((col, i) => `${col} = $${i + 1}`);
  params.push(id);
  const rows = await query(
    `UPDATE news SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rowToNews(rows[0]);
}

async function deleteNewsFromSupabase(id) {
  const existing = await query(`SELECT id FROM news WHERE id = $1 LIMIT 1`, [id]);
  if (!existing.length) {
    const error = new Error('新闻不存在');
    error.statusCode = 404;
    throw error;
  }
  await query(`DELETE FROM news WHERE id = $1`, [id]);
  return { ok: true, id };
}

// ===== 详情级缓存包装 =====
async function getSchoolById(rawId) {
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  return memoizedDetail(`school:${String(id || '')}`, () => fetchSchoolById(rawId));
}

async function getNewsById(rawId) {
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  return memoizedDetail(`news:${String(id || '')}`, () => fetchNewsById(rawId));
}

// 列表页当前页批量取整校：按 id 复用单条缓存。
async function getSchoolsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const schools = await Promise.all(ids.map((id) => getSchoolById(id)));
  return schools.filter(Boolean);
}

module.exports = {
  getSchoolById,
  getSchoolsByIds,
  getNewsById,
  rowToSchool,
  rowToNews,
  schoolToRow,
  newsToRow,
  createSchoolInSupabase,
  updateSchoolInSupabase,
  deleteSchoolFromSupabase,
  createNewsInSupabase,
  updateNewsInSupabase,
  deleteNewsFromSupabase,
  sortBySchoolPriority,
  loadSchoolsList,
  loadNewsForRelated,
  loadNewsList,
  loadSchoolsByDistrict,
  loadNewsIds,
  loadSchoolsMinimal,
  loadSchoolNamesByIds,
  loadSchoolsForRelated,
  loadSchoolCountsByDistrict,
  loadSchoolIds,
  querySchoolsList,
  queryNewsList
};
