const DISTRICT_CATALOG = [
  { id: 'huangpu', name: '黄浦区', description: '上海市中心城区，教育资源丰富' },
  { id: 'xuhui', name: '徐汇区', description: '教育强区，名校集中' },
  { id: 'changning', name: '长宁区', description: '国际化程度高，教育质量优秀' },
  { id: 'jingan', name: '静安区', description: '市中心区域，优质教育资源集中' },
  { id: 'putuo', name: '普陀区', description: '教育资源均衡发展' },
  { id: 'hongkou', name: '虹口区', description: '历史悠久，教育传统深厚' },
  { id: 'yangpu', name: '杨浦区', description: '高校聚集，教育资源丰富' },
  { id: 'minhang', name: '闵行区', description: '新兴教育区域，发展迅速' },
  { id: 'baoshan', name: '宝山区', description: '教育资源不断完善' },
  { id: 'jiading', name: '嘉定区', description: '历史文化名城，教育发展良好' },
  { id: 'pudong', name: '浦东新区', description: '经济发达，教育资源丰富' },
  { id: 'jinshan', name: '金山区', description: '教育资源稳步提升' },
  { id: 'songjiang', name: '松江区', description: '大学城区域，教育氛围浓厚' },
  { id: 'qingpu', name: '青浦区', description: '教育资源快速发展' },
  { id: 'fengxian', name: '奉贤区', description: '教育资源持续改善' },
  { id: 'chongming', name: '崇明区', description: '生态岛，教育资源特色发展' }
];

const DISTRICT_NAME_TO_ID = Object.fromEntries(DISTRICT_CATALOG.map((item) => [item.name, item.id]));
const DISTRICT_ID_TO_NAME = Object.fromEntries(DISTRICT_CATALOG.map((item) => [item.id, item.name]));

const SCHOOL_TYPE_MAP = {
  '市实验性示范性高中': 'municipal_model',
  '市特色普通高中': 'featured_high_school',
  '市重点': 'municipal_key',
  '区重点': 'district_key',
  '普通': 'general',
  '普通中学': 'general'
};

const SCHOOL_STAGE_MAP = {
  junior: '初中',
  senior_high: '高中',
  complete: '完全中学'
};

const SOURCE_TYPE_MAP = {
  '上海市教育委员会': 'official',
  '上海市教育考试院': 'official',
  'shanghai-education': 'official',
  'shanghai-education-news': 'official',
  '家长帮': 'community',
  '家长帮论坛': 'community',
  '升学帮': 'third_party',
  '学而思社区': 'third_party',
  '双子学爸数据社（搜狐）': 'third_party',
  '上海本地宝': 'third_party',
  '上海校讯中心': 'third_party',
  '本地宝': 'third_party',
  '维基百科': 'third_party',
  '小红书': 'social',
  '抖音': 'social',
  '哔哩哔哩': 'social',
  '微信公众号': 'social'
};

function slugify(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function cleanString(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim().replace(/\s+/g, ' ');
}

function cleanPhone(value) {
  return cleanString(value).replace(/[^\d\-+]/g, '');
}

function cleanUrl(value) {
  const text = cleanString(value);
  if (!text) {
    return '';
  }

  try {
    return new URL(text).href;
  } catch {
    return text;
  }
}

function normalizeDistrictId(value) {
  const text = cleanString(value);
  return DISTRICT_NAME_TO_ID[text] || text;
}

function normalizeDistrictName(value) {
  const districtId = normalizeDistrictId(value);
  return DISTRICT_ID_TO_NAME[districtId] || cleanString(value);
}

function normalizeSchoolType(value) {
  const text = cleanString(value);
  return SCHOOL_TYPE_MAP[text] || 'unknown';
}

function normalizeSchoolStage(value) {
  const text = cleanString(value);
  if (text === '初中' || text === 'junior') {
    return 'junior';
  }
  if (text === '高中' || text === 'senior_high') {
    return 'senior_high';
  }
  if (text === '完全中学' || text === 'complete') {
    return 'complete';
  }
  return 'senior_high';
}

function normalizeTier(value) {
  const text = cleanString(value).toUpperCase();
  return text || '';
}

function buildSchoolTags(raw, schoolStage, tier) {
  const tags = new Set(Array.isArray(raw.tags) ? raw.tags.map(cleanString).filter(Boolean) : []);
  const name = cleanString(raw.name);

  tags.add(SCHOOL_STAGE_MAP[schoolStage] || schoolStage);
  if (tier) {
    tags.add(`${tier}梯队`);
  }
  if (name.includes('民办')) {
    tags.add('民办');
  }
  if (name.includes('双语')) {
    tags.add('双语');
  }
  if (name.includes('实验')) {
    tags.add('实验');
  }
  if (name.includes('外国语') || name.includes('上外')) {
    tags.add('外语特色');
  }
  if (name.includes('附中') || name.includes('附校')) {
    tags.add('附属学校');
  }
  if (name.includes('九年')) {
    tags.add('九年一贯');
  }

  return Array.from(tags);
}

function inferSourceType(value) {
  const name = cleanString(value);
  if (!name) {
    return 'unknown';
  }

  if (SOURCE_TYPE_MAP[name]) {
    return SOURCE_TYPE_MAP[name];
  }

  if (name.includes('官网') || name.includes('教育考试院') || name.includes('教育委员会')) {
    return 'official';
  }

  if (name.includes('小红书') || name.includes('抖音') || name.includes('哔哩') || name.includes('微信')) {
    return 'social';
  }

  return 'unknown';
}

function normalizeSource(raw) {
  const name = cleanString(raw?.source || raw?.name || raw);
  return {
    name,
    type: inferSourceType(name),
    url: cleanUrl(raw?.url || raw?.sourceUrl || ''),
    crawledAt: raw?.crawledAt || raw?.publishDate || null,
    confidence: typeof raw?.confidence === 'number' ? raw.confidence : inferConfidence(name)
  };
}

function inferConfidence(sourceName) {
  const sourceType = inferSourceType(sourceName);
  if (sourceType === 'official') {
    return 0.95;
  }
  if (sourceType === 'third_party') {
    return 0.75;
  }
  if (sourceType === 'community') {
    return 0.6;
  }
  if (sourceType === 'social') {
    return 0.62;
  }
  return 0.5;
}

function normalizeSchool(raw) {
  const districtId = normalizeDistrictId(raw.districtId || raw.district);
  const districtName = normalizeDistrictName(raw.districtName || raw.district);
  const source = normalizeSource(raw);
  const name = cleanString(raw.name);
  const schoolStage = normalizeSchoolStage(raw.schoolStage || raw.stage);
  const tier = normalizeTier(raw.tier);

  return {
    id: cleanString(raw.id) || slugify(`${districtId}-${name}`),
    name,
    districtId,
    districtName,
    schoolStage,
    schoolStageLabel: SCHOOL_STAGE_MAP[schoolStage] || schoolStage,
    schoolType: normalizeSchoolType(raw.schoolType || raw.type),
    schoolTypeLabel: cleanString(raw.schoolTypeLabel || raw.type || '未知'),
    tier,
    address: cleanString(raw.address),
    phone: cleanPhone(raw.phone),
    website: cleanUrl(raw.website),
    schoolDescription: cleanString(raw.schoolDescription || raw.description),
    admissionNotes: cleanString(raw.admissionNotes || raw.admissionInfo),
    admissionRequirements: cleanString(raw.admissionRequirements || raw.enrollmentRequirements),
    schoolHighlights: Array.isArray(raw.schoolHighlights) ? raw.schoolHighlights.map(cleanString).filter(Boolean) : [],
    suitableStudents: cleanString(raw.suitableStudents),
    applicationTips: cleanString(raw.applicationTips),
    features: Array.isArray(raw.features) ? raw.features.map(cleanString).filter(Boolean) : [],
    tags: buildSchoolTags(raw, schoolStage, tier),
    source,
    updatedAt: raw.updatedAt || source.crawledAt || null
  };
}

function normalizePolicy(raw, index = 0) {
  const districtId = raw.districtId ? normalizeDistrictId(raw.districtId) : raw.district ? normalizeDistrictId(raw.district) : 'all';
  const districtName = districtId === 'all' ? '全市' : normalizeDistrictName(raw.districtName || raw.district);
  const source = normalizeSource(raw);
  const year = Number(raw.year || new Date().getUTCFullYear());
  const title = cleanString(raw.title);

  return {
    id: cleanString(raw.id) || slugify(`${year}-${districtId}-${title || index}`),
    title,
    districtId,
    districtName,
    year,
    summary: cleanString(raw.summary || raw.content),
    content: cleanString(raw.content),
    source,
    publishedAt: raw.publishedAt || raw.publishDate || raw.date || null,
    updatedAt: raw.updatedAt || source.crawledAt || raw.publishDate || raw.date || null
  };
}

function normalizeNews(raw, index = 0) {
  const source = normalizeSource(raw);
  const title = cleanString(raw.title);
  const newsType = cleanString(raw.newsType || raw.news_type || inferNewsSection(raw));
  const inferredExamType = inferNewsExamType(title, raw.content || raw.summary);
  const examType = cleanString(raw.examType || raw.exam_type || inferredExamType);
  const category = cleanString(raw.category || inferNewsCategory(newsType, examType));

  return {
    id: cleanString(raw.id) || slugify(`${category}-${title || index}`),
    title,
    newsType,
    category,
    examType: examType === 'gaokao' ? 'gaokao' : examType === 'zhongkao' ? 'zhongkao' : '',
    summary: cleanString(raw.summary || raw.content),
    content: cleanString(raw.content),
    contentMd: cleanString(raw.contentMd || raw.content_md),
    contentFile: cleanString(raw.contentFile || raw.content_file),
    publishedAt: raw.publishedAt || raw.publishDate || raw.date || null,
    updatedAt: raw.updatedAt || source.crawledAt || raw.publishDate || raw.date || null,
    source
  };
}

function inferNewsSection(raw) {
  const marker = cleanString(raw.newsType || raw.news_type).toLowerCase();
  if (marker === 'admission' || marker === 'school' || marker === 'exam') {
    return marker;
  }

  const category = cleanString(raw.category);
  if (category.includes('招生')) {
    return 'admission';
  }
  if (category.includes('学校') || category.includes('校园')) {
    return 'school';
  }

  return 'exam';
}

function inferNewsCategory(newsType, examType) {
  if (newsType === 'admission') {
    return '招生新闻';
  }
  if (newsType === 'school') {
    return '学校动态';
  }
  return examType === 'gaokao' ? '高考' : '中考';
}

function inferNewsExamType(title, content) {
  const text = cleanString(`${title} ${content}`).toLowerCase();
  if (text.includes('高考') || text.includes('春考') || text.includes('志愿') || text.includes('高校')) {
    return 'gaokao';
  }
  return 'zhongkao';
}

function buildDistricts(schools, policies) {
  return DISTRICT_CATALOG.map((district) => {
    const districtSchools = schools.filter((school) => school.districtId === district.id);
    const districtPolicies = policies.filter((policy) => policy.districtId === district.id);
    const latestPolicy = districtPolicies
      .slice()
      .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')))[0];

    return {
      id: district.id,
      name: district.name,
      description: district.description,
      schoolCount: districtSchools.length,
      policyCount: districtPolicies.length,
      latestPolicyTitle: latestPolicy ? latestPolicy.title : ''
    };
  });
}

function validateRequired(record, requiredFields) {
  return requiredFields
    .filter((field) => {
      const value = record[field];
      return value === undefined || value === null || value === '';
    })
    .map((field) => `missing ${field}`);
}

module.exports = {
  DISTRICT_CATALOG,
  DISTRICT_ID_TO_NAME,
  DISTRICT_NAME_TO_ID,
  buildDistricts,
  cleanString,
  cleanUrl,
  normalizeDistrictId,
  normalizeDistrictName,
  normalizePolicy,
  normalizeNews,
  normalizeSchool,
  normalizeSource,
  slugify,
  validateRequired
};
