const path = require('path');
const registry = require('../sources/registry.json');
const { readJson, writeJson } = require('../utils/io');
const { RAW_DIR, DEFAULT_RAW_DIR } = require('../utils/paths');

const INPUT_FILE = path.join(RAW_DIR, 'shanghai-social-platform-input.json');
const DEFAULT_INPUT_FILE = path.join(DEFAULT_RAW_DIR, 'shanghai-social-platform-input.json');
const NEWS_FILE = path.join(RAW_DIR, 'social-news.json');
const POLICIES_FILE = path.join(RAW_DIR, 'social-policies.json');
const SCHOOLS_FILE = path.join(RAW_DIR, 'social-schools.json');

const SHANGHAI_DISTRICTS = [
  '黄浦', '徐汇', '长宁', '静安', '普陀', '虹口', '杨浦', '闵行',
  '宝山', '嘉定', '浦东', '金山', '松江', '青浦', '奉贤', '崇明'
];

function cleanText(value) {
  return String(value || '').trim();
}

function isShanghaiRecord(item) {
  const region = cleanText(item.region || item.city || item.area);
  const district = cleanText(item.district || item.districtName);
  const text = `${region} ${district} ${cleanText(item.title)} ${cleanText(item.summary)}`;

  if (region.includes('上海')) {
    return true;
  }

  return SHANGHAI_DISTRICTS.some((name) => text.includes(name));
}

function inferRecordType(item) {
  const explicit = cleanText(item.recordType || item.type).toLowerCase();
  if (['news', 'policy', 'school'].includes(explicit)) {
    return explicit;
  }

  const text = `${cleanText(item.title)} ${cleanText(item.summary)} ${cleanText(item.content)}`;

  if (/(政策|通知|办法|实施意见|报名|志愿填报|录取)/.test(text)) {
    return 'policy';
  }

  if (/(学校|中学|高中|初中|校园|开放日|探校|招生简章)/.test(text)) {
    return 'school';
  }

  return 'news';
}

function inferExamType(item) {
  const text = `${cleanText(item.title)} ${cleanText(item.summary)} ${cleanText(item.content)}`;
  if (/(高考|春考|综评|本科|高校|志愿)/.test(text)) {
    return 'gaokao';
  }
  return 'zhongkao';
}

function inferSourceName(item) {
  const platform = cleanText(item.platform).toLowerCase();
  if (platform === 'xiaohongshu') {
    return '小红书';
  }
  if (platform === 'douyin') {
    return '抖音';
  }
  if (platform === 'bilibili') {
    return '哔哩哔哩';
  }
  if (platform === 'wechat') {
    return '微信公众号';
  }
  return cleanText(item.source) || '社交平台';
}

function normalizeBaseRecord(item) {
  const sourceName = inferSourceName(item);
  return {
    title: cleanText(item.title),
    summary: cleanText(item.summary || item.content),
    content: cleanText(item.content || item.summary),
    source: sourceName,
    sourceUrl: cleanText(item.sourceUrl || item.url),
    publishedAt: item.publishedAt || item.publishDate || item.date || null,
    crawledAt: item.crawledAt || new Date().toISOString(),
    confidence: typeof item.confidence === 'number' ? item.confidence : 0.62,
    platform: cleanText(item.platform),
    region: 'shanghai'
  };
}

async function crawlSocialPlatforms() {
  const socialSources = registry.filter((item) => item.authority === 'social' && item.region === 'shanghai');
  const allowedPlatforms = new Set(socialSources.map((item) => cleanText(item.platform).toLowerCase()));
  const input = await readJson(INPUT_FILE, await readJson(DEFAULT_INPUT_FILE, []));

  const filtered = input.filter((item) => {
    const platform = cleanText(item.platform).toLowerCase();
    return allowedPlatforms.has(platform) && isShanghaiRecord(item);
  });

  const news = [];
  const policies = [];
  const schools = [];

  filtered.forEach((item, index) => {
    const recordType = inferRecordType(item);
    const base = normalizeBaseRecord(item);

    if (!base.title) {
      return;
    }

    if (recordType === 'policy') {
      policies.push({
        id: item.id || `social-policy-${index + 1}`,
        districtId: cleanText(item.districtId || item.district) || 'all',
        districtName: cleanText(item.districtName || item.district) || '全市',
        year: Number(item.year || new Date(base.publishedAt || Date.now()).getUTCFullYear()),
        ...base
      });
      return;
    }

    if (recordType === 'school') {
      schools.push({
        id: item.id || '',
        name: cleanText(item.name || item.schoolName || base.title),
        districtId: cleanText(item.districtId || item.district),
        districtName: cleanText(item.districtName || item.district),
        schoolStage: cleanText(item.schoolStage || item.stage),
        type: cleanText(item.type || item.schoolType),
        schoolTypeLabel: cleanText(item.schoolTypeLabel || item.type || item.schoolType),
        tier: cleanText(item.tier),
        address: cleanText(item.address),
        phone: cleanText(item.phone),
        website: cleanText(item.website),
        admissionInfo: cleanText(item.admissionInfo || item.admissionNotes || base.summary),
        features: Array.isArray(item.features) ? item.features : [],
        tags: Array.isArray(item.tags) ? item.tags : [],
        ...base
      });
      return;
    }

    news.push({
      id: item.id || `social-news-${index + 1}`,
      category: cleanText(item.category || (inferExamType(item) === 'gaokao' ? '高考' : '中考')),
      examType: inferExamType(item),
      ...base
    });
  });

  await Promise.all([
    writeJson(NEWS_FILE, news),
    writeJson(POLICIES_FILE, policies),
    writeJson(SCHOOLS_FILE, schools)
  ]);

  return { news, policies, schools };
}

if (require.main === module) {
  crawlSocialPlatforms()
    .then((result) => {
      console.log(`social-news=${result.news.length}, social-policies=${result.policies.length}, social-schools=${result.schools.length}`);
    })
    .catch((error) => {
      console.error('crawl social platforms failed:', error.message);
      process.exit(1);
    });
}

module.exports = crawlSocialPlatforms;
