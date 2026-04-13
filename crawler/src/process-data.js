#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const {
  buildDistricts,
  normalizeNews,
  normalizePolicy,
  normalizeSchool
} = require('../../shared/data-schema');
const { RAW_DIR, PROCESSED_DIR, ROOT_DATA_DIR } = require('./utils/paths');

const RAW_OUTPUT_FILES = [
  'admission-discussions.json',
  'forum-schools.json',
  'junior-schools-tier.json',
  'official-news.json',
  'official-policies.json',
  'official-schools.json',
  'social-news.json',
  'social-policies.json',
  'social-schools.json'
];

async function readJson(filename) {
  const content = await fs.readFile(path.join(RAW_DIR, filename), 'utf8');
  return JSON.parse(content);
}

async function readOptionalJson(filename) {
  try {
    return await readJson(filename);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function hasRawOutputFiles() {
  const checks = await Promise.all(RAW_OUTPUT_FILES.map(async (filename) => {
    try {
      await fs.access(path.join(RAW_DIR, filename));
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }));
  return checks.some(Boolean);
}

async function writeJson(dir, filename, payload) {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), JSON.stringify(payload, null, 2));
}

function dedupeById(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (seen.has(record.id)) {
      return false;
    }
    seen.add(record.id);
    return true;
  });
}

function countFilledSchoolFields(school) {
  return [
    school.name,
    school.address,
    school.phone,
    school.website,
    school.admissionNotes,
    ...(school.features || [])
  ].filter((value) => Array.isArray(value) ? value.length > 0 : Boolean(value)).length;
}

function mergeSchoolRecords(records) {
  const byId = new Map();

  records.forEach((record) => {
    const existing = byId.get(record.id);
    if (!existing) {
      byId.set(record.id, record);
      return;
    }

    const currentScore = countFilledSchoolFields(record);
    const existingScore = countFilledSchoolFields(existing);
    const primary = currentScore > existingScore ? record : existing;
    const secondary = primary === record ? existing : record;

    byId.set(record.id, {
      ...secondary,
      ...primary,
      features: primary.features.length ? primary.features : secondary.features,
      tags: primary.tags.length ? primary.tags : secondary.tags,
      source: (primary.source?.confidence || 0) >= (secondary.source?.confidence || 0) ? primary.source : secondary.source,
      updatedAt: primary.updatedAt || secondary.updatedAt || null
    });
  });

  return Array.from(byId.values()).sort((left, right) => {
    if (left.districtId !== right.districtId) {
      return left.districtId.localeCompare(right.districtId);
    }
    return left.name.localeCompare(right.name, 'zh-CN');
  });
}

async function processSchoolData() {
  const [forumSchools, officialSchools, juniorSchools, socialSchools] = await Promise.all([
    readOptionalJson('forum-schools.json'),
    readOptionalJson('official-schools.json'),
    readOptionalJson('junior-schools-tier.json'),
    readOptionalJson('social-schools.json')
  ]);
  const normalized = [...forumSchools, ...officialSchools, ...juniorSchools, ...socialSchools].map((school) => normalizeSchool({
    ...school,
    features: [],
    source: school.source,
    sourceUrl: school.sourceUrl,
    crawledAt: school.crawledAt
  }));
  const schools = mergeSchoolRecords(normalized);

  await writeJson(PROCESSED_DIR, 'schools.json', schools);
  return schools;
}

async function processPolicyData() {
  const [communityPolicies, officialPolicies, socialPolicies] = await Promise.all([
    readOptionalJson('admission-discussions.json'),
    readOptionalJson('official-policies.json'),
    readOptionalJson('social-policies.json')
  ]);
  const normalizedCommunityPolicies = communityPolicies.map((discussion, index) => normalizePolicy({
    id: `policy-${index + 1}`,
    title: discussion.title,
    districtId: 'all',
    summary: discussion.content,
    content: discussion.content,
    year: new Date(discussion.date).getUTCFullYear(),
    source: discussion.source,
    sourceUrl: discussion.url,
    crawledAt: discussion.crawledAt,
    publishedAt: discussion.date
  }, index));
  const normalizedOfficialPolicies = officialPolicies.map((policy, index) => normalizePolicy({
    ...policy,
    source: policy.source,
    sourceUrl: policy.sourceUrl,
    crawledAt: policy.crawledAt
  }, index));
  const normalizedSocialPolicies = socialPolicies.map((policy, index) => normalizePolicy({
    ...policy,
    source: policy.source,
    sourceUrl: policy.sourceUrl,
    crawledAt: policy.crawledAt
  }, index + normalizedOfficialPolicies.length + normalizedCommunityPolicies.length));
  const policies = dedupeById([...normalizedOfficialPolicies, ...normalizedSocialPolicies, ...normalizedCommunityPolicies]).sort((left, right) => {
    return String(right.publishedAt || '').localeCompare(String(left.publishedAt || ''));
  });

  await writeJson(PROCESSED_DIR, 'policies.json', policies);
  return policies;
}

async function processNewsData() {
  const [officialNews, socialNews] = await Promise.all([
    readOptionalJson('official-news.json'),
    readOptionalJson('social-news.json')
  ]);
  const normalizedOfficialNews = officialNews.map((item, index) => normalizeNews({
    ...item,
    source: item.source,
    sourceUrl: item.sourceUrl,
    crawledAt: item.crawledAt
  }, index));
  const normalizedSocialNews = socialNews.map((item, index) => normalizeNews({
    ...item,
    source: item.source,
    sourceUrl: item.sourceUrl,
    crawledAt: item.crawledAt
  }, index + normalizedOfficialNews.length));
  const news = dedupeById([...normalizedOfficialNews, ...normalizedSocialNews]).sort((left, right) => {
    return String(right.publishedAt || '').localeCompare(String(left.publishedAt || ''));
  });

  await writeJson(PROCESSED_DIR, 'news.json', news);
  return news;
}

async function publishData({ districts, schools, policies, news }) {
  await writeJson(ROOT_DATA_DIR, 'districts.json', districts);
  await writeJson(ROOT_DATA_DIR, 'schools.json', schools);
  await writeJson(ROOT_DATA_DIR, 'policies.json', policies);
  await writeJson(ROOT_DATA_DIR, 'news.json', news);
}

async function processAllData() {
  if (!await hasRawOutputFiles()) {
    throw new Error('未发现 raw 抓取输出，已停止处理以避免生成空的 processed 数据或覆盖 data/*.json');
  }

  const [schools, policies, news] = await Promise.all([
    processSchoolData(),
    processPolicyData(),
    processNewsData()
  ]);

  if (!schools.length && !policies.length && !news.length) {
    throw new Error('raw 抓取输出为空，已停止处理以避免用空数据覆盖 data/*.json');
  }

  const districts = buildDistricts(schools, policies);
  await writeJson(PROCESSED_DIR, 'districts.json', districts);
  await publishData({ districts, schools, policies, news });

  return { districts, schools, policies, news };
}

async function main() {
  const result = await processAllData();
  console.log('数据处理完成');
  console.log(`districts=${result.districts.length}, schools=${result.schools.length}, policies=${result.policies.length}, news=${result.news.length}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('数据处理失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  processAllData,
  processNewsData,
  processPolicyData,
  processSchoolData
};
