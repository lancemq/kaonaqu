const { DISTRICT_NAME_TO_ID, DISTRICT_ID_TO_NAME } = require('./data-schema');
const { isSupabaseConfigured, getServiceClient, SCHOOLS_TABLE, NEWS_TABLE } = require('./supabase-client');



// === Supabase 读取 ===

// 从 school_stage_label 推断 school_stage（数据库已删 school_stage 列）
function inferSchoolStage(stageLabel) {
  if (!stageLabel) return '';
  if (stageLabel.includes('初中')) return 'junior';
  if (stageLabel.includes('完全')) return 'complete';
  return 'senior_high';
}

// rowToSchool：完全从数据库行映射，仅返回 DB 列对应的字段 + 运行时派生字段
function rowToSchool(row) {
  if (!row) return null;
  const slug = row.slug || '';
  return {
    id: slug,
    dbId: row.id,
    name: row.name,
    districtId: DISTRICT_NAME_TO_ID[row.district_name] || '',
    districtName: row.district_name,
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
      notes: row.admission_info?.notes || ''
    },
    // 兼容别名（全部派生自 admission_info）
    admissionCode: row.admission_info?.code || '',
    admissionMethods: Array.isArray(row.admission_info?.methods) ? row.admission_info.methods : [],
    admissionRoutes: Array.isArray(row.admission_info?.routes) ? row.admission_info.routes : [],
    contentFile: slug ? `content/schools/${slug}.md` : '',
    profileDepth: row.profile_depth || 'enhanced',
    features: row.features || [],
    scoreLines: Array.isArray(row.score_lines) ? row.score_lines : [],
    content: Array.isArray(row.content) ? row.content : [],
    infoVerified: !!row.info_verified
  };
}

// === 本地 JSON 与数据库表对齐 ===

// 学校排序：eliteCohort 非空优先 + schoolKeyLevel 重点优先
// ⚠️ 键必须与 DB 真实 school_key_level 词表严格对齐（带 (高中)/(初中) 后缀），
// 否则除"一般高中/一般初中"外所有层级都匹配不到、优先级落 0，层级排序实质失效。
// DB 词表（8 值）：市重点(高中)/区重点(高中)/顶级公办(初中)/顶级民办(初中)/
//   强公办(初中)/强民办(初中)/一般高中/一般初中。
const KEY_LEVEL_PRIORITY = {
  '市重点(高中)': 100,
  '顶级公办(初中)': 95,
  '顶级民办(初中)': 95,
  '区重点(高中)': 80,
  '强民办(初中)': 72,
  '强公办(初中)': 70,
  '一般高中': 60,
  '一般初中': 40
};

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

// 列表轻量查询：显式排除体积最大的 content / admission_info 两列，
// 使响应保持在 Next.js Data Cache 单条 2MB 上限内。实测（888 校）：
//   select *                      2.66MB -> 超限不可缓存
//   去 content                    1.61MB -> 2.33MB 仍超限（Next 缓存含响应开销）
//   去 content+admission_info（保留 score_lines）  0.44MB -> ~0.46MB 可缓存 ✅
// score_lines 单列极小（824 校为 []，仅 64 校含真实线约 300B/校，合计 ≈20KB），
// 故重新纳入列表列，供对比页"近年录取分/走势"直接消费真实线，无需二次按 id 取回；
// admission_info（notes 长文本，单列约 1MB）仍仅详情页需要，由 getSchoolById 取回。
// 列表筛选/搜索依赖的 features/address/labels 等均保留。
const SCHOOLS_LIST_COLUMNS = [
  'id', 'slug', 'name', 'district_name', 'school_stage_label', 'school_property_label',
  'school_key_level', 'elite_cohort', 'group', 'address', 'phone', 'website',
  'founding_year', 'is_boarding', 'is_international', 'image', 'profile_depth',
  'features', 'info_verified', 'score_lines'
].join(',');

// 新闻列表轻量查询：排除体积最大的 content 列。
// 列表页只展示标题/摘要等元数据，content 仅详情页需要（由 getNewsById 取完整行）。
const NEWS_LIST_COLUMNS = 'id,title,news_type,category,exam_type,summary,published_at,updated_at,source,district_id,district_name,primary_school_id,related_school_ids,school_link_reason,school_link_confidence';

// 单校完整查询（详情页 / 列表 ≤10 张卡 / API）。仅一所，响应极小，
// 经 Next.js Data Cache 按 id 缓存（revalidate 见 supabase-client.cachedFetch）。
// 兼容 Next 动态路由 params：可能是数组或编码后的 slug。
async function getSchoolById(rawId) {
  if (rawId == null) return null;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const normalizedId = String(id || '');
  let decodedId = normalizedId;
  try {
    decodedId = decodeURIComponent(normalizedId);
  } catch {
    // 已解码则保持原值
  }
  const client = getServiceClient();
  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .select('*')
    .eq('slug', decodedId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data ? rowToSchool(data) : null;
}

// 批量完整查询（列表页当前页 ≤10 所卡片用，需 content 概览）。
// 仅这几所取完整，避免 888 所全量 content 拉回。
async function getSchoolsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const client = getServiceClient();
  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .select('*')
    .in('slug', ids);

  if (error) {
    throw error;
  }
  const byId = new Map((data || []).map((row) => [row.slug, rowToSchool(row)]));
  return ids.map((id) => byId.get(id) || null).filter(Boolean);
}

// 单条新闻完整查询（详情页 / API 用，需 content）。
// 经 Next.js Data Cache 按 id 缓存。兼容 Next 动态路由 params：数组或编码后的 id。
// 与 resolveNewsById 对齐：先用原始 id 匹配，再用 decodeURIComponent 后匹配。
async function getNewsById(rawId) {
  if (rawId == null) return null;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const normalizedId = String(id || '');
  let decodedId = normalizedId;
  try {
    decodedId = decodeURIComponent(normalizedId);
  } catch {
    // 已解码则保持原值
  }
  const client = getServiceClient();
  const { data, error } = await client
    .from(NEWS_TABLE)
    .select('*')
    .in('id', [normalizedId, decodedId])
    .limit(1);

  if (error) {
    throw error;
  }
  return data && data.length ? rowToNews(data[0]) : null;
}

// news content 支持 JSON block 数组（新）与 Markdown 字符串（旧）两种格式。
// JSON 字符串解析为数组；旧 Markdown 包装为 [{type:'markdown', text}] 由渲染器兼容。
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
    primarySchoolId: row.primary_school_id || '',
    relatedSchoolIds: Array.isArray(row.related_school_ids) ? row.related_school_ids : [],
    schoolLinkReason: row.school_link_reason || '',
    schoolLinkConfidence: row.school_link_confidence !== undefined && row.school_link_confidence !== null
      ? Number(row.school_link_confidence)
      : null
  };
}

// === 按页面需求拆分的查询函数（取代 loadDataStore 一把梭） ===
// 每个函数仅查该页面所需字段，减小 Supabase 响应体积与 Data Cache 占用。

// 全量学校列表（轻量，排除 content/admission_info/score_lines）。供学校列表页、
// 教育集团页、对比页、区域列表页等需全量学校的页面使用。0.44MB。
async function loadSchoolsList() {
  if (!isSupabaseConfigured()) return [];
  const client = getServiceClient();
  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .select(SCHOOLS_LIST_COLUMNS)
    .order('id', { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => rowToSchool(row)).filter(Boolean);
}

// 全量新闻列表（轻量，排除 content）。供新闻列表页、首页、专题页等使用。0.1MB。
async function loadNewsList() {
  if (!isSupabaseConfigured()) return [];
  const client = getServiceClient();
  const { data, error } = await client
    .from(NEWS_TABLE)
    .select(NEWS_LIST_COLUMNS)
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => rowToNews(row)).filter(Boolean);
}

// 按区域 ID 查学校（区域详情页）。仅该区 ~50 所，而非全量 888 所。~0.02MB。
async function loadSchoolsByDistrict(districtId) {
  if (!isSupabaseConfigured()) return [];
  const districtName = DISTRICT_ID_TO_NAME[districtId];
  if (!districtName) return [];
  const client = getServiceClient();
  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .select(SCHOOLS_LIST_COLUMNS)
    .eq('district_name', districtName)
    .order('id', { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => rowToSchool(row)).filter(Boolean);
}

// 仅取新闻 id 列表（sitemap 用）。~5KB。
async function loadNewsIds() {
  if (!isSupabaseConfigured()) return [];
  const client = getServiceClient();
  const { data, error } = await client
    .from(NEWS_TABLE)
    .select('id')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => row.id).filter(Boolean);
}

// 分数匹配页所需最小字段集。~0.15MB（比全量 0.44MB 少 66%）。
async function loadSchoolsMinimal() {
  if (!isSupabaseConfigured()) return [];
  const client = getServiceClient();
  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .select('slug,name,district_name,school_stage_label,school_key_level,elite_cohort,group,is_international')
    .order('id', { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.slug || '',
    name: row.name || '',
    districtId: DISTRICT_NAME_TO_ID[row.district_name] || '',
    districtName: row.district_name || '',
    schoolStage: inferSchoolStage(row.school_stage_label),
    eliteCohort: row.elite_cohort || '',
    schoolKeyLevel: row.school_key_level || '',
    group: row.group || '',
    isInternational: row.is_international === true
  }));
}

// 按 id 批量取学校名映射（新闻列表页 schoolNameMap 用）。~3KB。
async function loadSchoolNamesByIds(ids) {
  if (!isSupabaseConfigured()) return {};
  if (!Array.isArray(ids) || ids.length === 0) return {};
  const client = getServiceClient();
  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .select('slug,name')
    .in('slug', ids);
  if (error) throw error;
  const map = {};
  for (const row of data || []) {
    map[row.slug] = row.name;
  }
  return map;
}

// 新闻详情页相关学校：主校 + 按优先级填充。~2KB。
async function loadSchoolsForRelated(primarySchoolId, limit = 4) {
  if (!isSupabaseConfigured()) return [];
  const client = getServiceClient();

  const primaryPromise = primarySchoolId
    ? client.from(SCHOOLS_TABLE)
        .select(SCHOOLS_LIST_COLUMNS)
        .eq('slug', primarySchoolId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) throw error;
          return data ? rowToSchool(data) : null;
        })
    : Promise.resolve(null);

  // 填充：排除主校，多取以便排序后裁剪
  const fillerPromise = client.from(SCHOOLS_TABLE)
    .select(SCHOOLS_LIST_COLUMNS)
    .neq('slug', primarySchoolId || '')
    .limit(limit + 4)
    .then(({ data, error }) => {
      if (error) throw error;
      return sortBySchoolPriority((data || []).map((row) => rowToSchool(row)).filter(Boolean));
    });

  const [primary, fillers] = await Promise.all([primaryPromise, fillerPromise]);
  const result = [];
  if (primary) result.push(primary);
  for (const s of fillers) {
    if (result.length >= limit) break;
    result.push(s);
  }
  return result;
}

// 按区域统计学校数（区域详情页侧栏排序用）。~15KB。
async function loadSchoolCountsByDistrict() {
  if (!isSupabaseConfigured()) return {};
  const client = getServiceClient();
  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .select('district_name');
  if (error) throw error;
  const counts = {};
  for (const row of data || []) {
    const name = row.district_name;
    if (name) counts[name] = (counts[name] || 0) + 1;
  }
  return counts;
}

// === Supabase 写入 ===
// 应用层 camelCase -> DB snake_case 行（与 rowToSchool/rowToNews 严格对称）。
// schools 表 id 为 BIGSERIAL 自增主键，应用 id 即 DB slug（UNIQUE）；写入不带 id 列。
function schoolToRow(school = {}) {
  return {
    slug: school.id || '',
    name: school.name || '',
    district_name: school.districtName || '',
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
    content: Array.isArray(school.content) ? school.content : [],
    admission_info: {
      code: school.admissionInfo?.code || school.admissionCode || '',
      methods: Array.isArray(school.admissionInfo?.methods) ? school.admissionInfo.methods
        : (Array.isArray(school.admissionMethods) ? school.admissionMethods : []),
      routes: Array.isArray(school.admissionInfo?.routes) ? school.admissionInfo.routes
        : (Array.isArray(school.admissionRoutes) ? school.admissionRoutes : []),
      notes: school.admissionInfo?.notes || ''
    },
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
    primary_school_id: news.primarySchoolId || '',
    related_school_ids: Array.isArray(news.relatedSchoolIds) ? news.relatedSchoolIds : [],
    school_link_reason: news.schoolLinkReason || '',
    school_link_confidence: news.schoolLinkConfidence !== undefined && news.schoolLinkConfidence !== null
      ? Number(news.schoolLinkConfidence)
      : null
  };
}

// CRUD 写入：操作 DB，不写本地缓存。写操作后由 route.js 调 revalidateTag 失效 Data Cache。

async function createSchoolInSupabase(school) {
  const client = getServiceClient();
  const row = schoolToRow(school);

  const { data: existing } = await client
    .from(SCHOOLS_TABLE)
    .select('slug')
    .eq('slug', row.slug)
    .maybeSingle();
  if (existing) {
    const error = new Error('学校已存在');
    error.statusCode = 409;
    throw error;
  }

  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .insert(row)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return rowToSchool(data);
}

async function updateSchoolInSupabase(slug, school) {
  const client = getServiceClient();
  const row = schoolToRow({ ...school, id: slug });

  const { data: existing } = await client
    .from(SCHOOLS_TABLE)
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();
  if (!existing) {
    const error = new Error('学校不存在');
    error.statusCode = 404;
    throw error;
  }

  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .update(row)
    .eq('slug', slug)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return rowToSchool(data);
}

async function deleteSchoolFromSupabase(slug) {
  const client = getServiceClient();

  const { data: existing } = await client
    .from(SCHOOLS_TABLE)
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();
  if (!existing) {
    const error = new Error('学校不存在');
    error.statusCode = 404;
    throw error;
  }

  const { error } = await client
    .from(SCHOOLS_TABLE)
    .delete()
    .eq('slug', slug);
  if (error) {
    throw error;
  }
  return { ok: true, id: slug };
}

async function createNewsInSupabase(news) {
  const client = getServiceClient();
  const row = newsToRow(news);

  const { data: existing } = await client
    .from(NEWS_TABLE)
    .select('id')
    .eq('id', row.id)
    .maybeSingle();
  if (existing) {
    const error = new Error('新闻已存在');
    error.statusCode = 409;
    throw error;
  }

  const { data, error } = await client
    .from(NEWS_TABLE)
    .insert(row)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return rowToNews(data);
}

async function updateNewsInSupabase(id, news) {
  const client = getServiceClient();
  const row = newsToRow({ ...news, id });

  const { data: existing } = await client
    .from(NEWS_TABLE)
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!existing) {
    const error = new Error('新闻不存在');
    error.statusCode = 404;
    throw error;
  }

  const { data, error } = await client
    .from(NEWS_TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return rowToNews(data);
}

async function deleteNewsFromSupabase(id) {
  const client = getServiceClient();

  const { data: existing } = await client
    .from(NEWS_TABLE)
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!existing) {
    const error = new Error('新闻不存在');
    error.statusCode = 404;
    throw error;
  }

  const { error } = await client
    .from(NEWS_TABLE)
    .delete()
    .eq('id', id);
  if (error) {
    throw error;
  }
  return { ok: true, id };
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
  loadNewsList,
  loadSchoolsByDistrict,
  loadNewsIds,
  loadSchoolsMinimal,
  loadSchoolNamesByIds,
  loadSchoolsForRelated,
  loadSchoolCountsByDistrict
};
