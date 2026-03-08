const axios = require('axios');
const path = require('path');
const { readJson, writeJson } = require('../utils/io');
const { RAW_DIR } = require('../utils/paths');

const OUTPUT_FILE = path.join(RAW_DIR, 'official-schools.json');
const WIKI_RAW_BASE = 'https://zh.wikipedia.org/w/index.php';
const WIKI_API_BASE = 'https://zh.wikipedia.org/w/api.php';
const DISTRICTS = [
  '黄浦区',
  '徐汇区',
  '长宁区',
  '静安区',
  '普陀区',
  '虹口区',
  '杨浦区',
  '闵行区',
  '宝山区',
  '嘉定区',
  '浦东新区',
  '金山区',
  '松江区',
  '青浦区',
  '奉贤区',
  '崇明区'
];
const EXCLUDED_KEYWORDS = /(招生全国统一考试|上海卷)/;
const SCHOOL_KEYWORDS = /(中学|中學|附中|附属中学|附屬中學|学校|學校|高级中学|高級中學|实验学校|實驗學校|双语学校|雙語學校|外国语学校|外國語學校)/;
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; KaonaquBot/1.0; +https://kaonaqu.local)'
};

function wikiUrl(title) {
  return `https://zh.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}

function cleanSchoolName(name) {
  return String(name || '')
    .replace(/^上海市/, '')
    .replace(/\s+/g, '')
    .trim();
}

function inferStage(name, raw) {
  const text = `${name}\n${raw}`;
  if (/初级中学|初級中學|初中/.test(text)) {
    return 'junior';
  }
  if (/高级中学|高級中學|高中|实验性示范性高中|特色普通高中/.test(text)) {
    return 'senior_high';
  }
  return 'junior';
}

function inferDistrict(raw) {
  const normalized = raw.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '[[$1]]');
  return DISTRICTS.find((district) => normalized.includes(`[[${district}]]`) || normalized.includes(district)) || '';
}

async function fetchText(url, params = {}) {
  const response = await axios.get(url, {
    params,
    timeout: 20000,
    headers: HEADERS
  });
  return response.data;
}

function parseDistrictGroupedList(raw, schoolTypeLabel, sourceUrl) {
  const lines = raw.split('\n');
  const records = [];
  let currentDistrict = '';

  for (const line of lines) {
    const districtMatch = line.match(/^\*\[\[([^\]]+区|浦东新区)\b/);
    if (districtMatch) {
      const districtText = districtMatch[1].replace(/\s+/g, '');
      currentDistrict = DISTRICTS.find((item) => districtText.includes(item)) || '';
      continue;
    }

    const schoolMatch = line.match(/^\*\*\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    if (!schoolMatch || !currentDistrict) {
      continue;
    }

    const title = schoolMatch[2] || schoolMatch[1];
    records.push({
      id: `${currentDistrict}-${cleanSchoolName(title)}`,
      name: cleanSchoolName(title),
      district: currentDistrict,
      schoolStage: 'senior_high',
      type: schoolTypeLabel,
      admissionInfo: `${schoolTypeLabel}，根据公开名单整理。`,
      source: '维基百科',
      sourceUrl,
      crawledAt: new Date().toISOString()
    });
  }

  return records;
}

async function fetchShanghaiSchoolCategoryMembers() {
  const categories = [
    'Category:上海中等学校',
    'Category:上海普通高级中学',
    'Category:上海九年一贯制学校'
  ];
  const categoryResults = await Promise.all(categories.map((cmtitle) => fetchText(WIKI_API_BASE, {
    action: 'query',
    list: 'categorymembers',
    cmtitle,
    cmlimit: '500',
    format: 'json'
  })));

  return Array.from(new Set(categoryResults.flatMap((data) => (data.query?.categorymembers || [])
    .filter((item) => item.ns === 0)
    .map((item) => item.title))))
    .filter((title) => SCHOOL_KEYWORDS.test(title))
    .filter((title) => !EXCLUDED_KEYWORDS.test(title));
}

async function fetchSchoolEntryFromWiki(title) {
  const raw = await fetchText(WIKI_RAW_BASE, {
    title,
    action: 'raw'
  });
  const district = inferDistrict(raw);
  if (!district) {
    return null;
  }

  return {
    id: `${district}-${cleanSchoolName(title)}`,
    name: cleanSchoolName(title),
    district,
    schoolStage: inferStage(title, raw),
    type: '学校公开条目',
    admissionInfo: '根据维基百科上海学校公开条目整理。',
    source: '维基百科',
    sourceUrl: wikiUrl(title),
    crawledAt: new Date().toISOString()
  };
}

async function fetchCategorySchools() {
  const titles = await fetchShanghaiSchoolCategoryMembers();
  const results = [];
  const concurrency = 8;

  for (let index = 0; index < titles.length; index += concurrency) {
    const batch = titles.slice(index, index + concurrency);
    const records = await Promise.all(batch.map(async (title) => {
      try {
        return await fetchSchoolEntryFromWiki(title);
      } catch (error) {
        return null;
      }
    }));
    results.push(...records.filter(Boolean));
  }

  return results;
}

function dedupeSchools(records) {
  const map = new Map();

  for (const record of records) {
    if (!record || !record.id || !record.district || !record.name) {
      continue;
    }

    const existing = map.get(record.id);
    if (!existing) {
      map.set(record.id, record);
      continue;
    }

    const existingSourceUrlLength = String(existing.sourceUrl || '').length;
    const currentSourceUrlLength = String(record.sourceUrl || '').length;
    map.set(record.id, currentSourceUrlLength >= existingSourceUrlLength ? record : existing);
  }

  return Array.from(map.values()).sort((left, right) => {
    if (left.district !== right.district) {
      return left.district.localeCompare(right.district, 'zh-CN');
    }
    return left.name.localeCompare(right.name, 'zh-CN');
  });
}

async function crawlOfficialSchools() {
  try {
    const [municipalRaw, featuredRaw, categorySchools] = await Promise.all([
      fetchText(WIKI_RAW_BASE, {
        title: '上海市实验性示范性高中',
        action: 'raw'
      }),
      fetchText(WIKI_RAW_BASE, {
        title: '上海市特色普通高中',
        action: 'raw'
      }),
      fetchCategorySchools()
    ]);

    const municipalSchools = parseDistrictGroupedList(
      municipalRaw,
      '市实验性示范性高中',
      wikiUrl('上海市实验性示范性高中')
    );
    const featuredSchools = parseDistrictGroupedList(
      featuredRaw,
      '市特色普通高中',
      wikiUrl('上海市特色普通高中')
    );
    const merged = dedupeSchools([
      ...municipalSchools,
      ...featuredSchools,
      ...categorySchools
    ]);

    await writeJson(OUTPUT_FILE, merged);
    return merged;
  } catch (error) {
    const existing = await readJson(OUTPUT_FILE, []);
    await writeJson(OUTPUT_FILE, existing);
    return existing;
  }
}

if (require.main === module) {
  crawlOfficialSchools()
    .then((items) => {
      console.log(`official-schools=${items.length}`);
    })
    .catch((error) => {
      console.error('crawl official schools failed:', error.message);
      process.exit(1);
    });
}

module.exports = crawlOfficialSchools;
