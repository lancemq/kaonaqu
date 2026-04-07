#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  DISTRICT_CATALOG,
  normalizeDistrictId,
  validateRequired
} = require('../shared/data-schema');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ROOT_DIR = path.join(__dirname, '..');
const VALID_DISTRICT_IDS = new Set(DISTRICT_CATALOG.map((district) => district.id));

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
}

function validateDistricts(districts) {
  const errors = [];
  const seenIds = new Set();

  districts.forEach((district, index) => {
    validateRequired(district, ['id', 'name']).forEach((message) => {
      errors.push(`districts[${index}]: ${message}`);
    });

    if (!VALID_DISTRICT_IDS.has(district.id)) {
      errors.push(`districts[${index}]: unknown district id ${district.id}`);
    }

    if (seenIds.has(district.id)) {
      errors.push(`districts[${index}]: duplicate district id ${district.id}`);
    }
    seenIds.add(district.id);
  });

  return errors;
}

function validateSchools(schools) {
  const errors = [];
  const seenKeys = new Set();

  schools.forEach((school, index) => {
    validateRequired(school, ['id', 'name', 'districtId', 'districtName', 'schoolStage', 'schoolStageLabel']).forEach((message) => {
      errors.push(`schools[${index}]: ${message}`);
    });

    if (!VALID_DISTRICT_IDS.has(school.districtId)) {
      errors.push(`schools[${index}]: invalid districtId ${school.districtId}`);
    }

    const normalizedDistrictId = normalizeDistrictId(school.districtName);
    if (normalizedDistrictId !== school.districtId) {
      errors.push(`schools[${index}]: district mismatch ${school.districtId} vs ${school.districtName}`);
    }

    const uniqueKey = `${school.districtId}:${school.name}`;
    if (seenKeys.has(uniqueKey)) {
      errors.push(`schools[${index}]: duplicate school ${uniqueKey}`);
    }
    seenKeys.add(uniqueKey);

    if (!['junior', 'senior_high'].includes(school.schoolStage)) {
      errors.push(`schools[${index}]: invalid schoolStage ${school.schoolStage}`);
    }
  });

  return errors;
}

function validatePolicies(policies) {
  const errors = [];
  const seenIds = new Set();

  policies.forEach((policy, index) => {
    validateRequired(policy, ['id', 'title', 'districtId', 'districtName', 'summary', 'contentFile']).forEach((message) => {
      errors.push(`policies[${index}]: ${message}`);
    });

    if (seenIds.has(policy.id)) {
      errors.push(`policies[${index}]: duplicate policy id ${policy.id}`);
    }
    seenIds.add(policy.id);

    if (policy.districtId !== 'all' && !VALID_DISTRICT_IDS.has(policy.districtId)) {
      errors.push(`policies[${index}]: invalid districtId ${policy.districtId}`);
    }

    if (policy.districtId !== 'all') {
      const normalizedDistrictId = normalizeDistrictId(policy.districtName);
      if (normalizedDistrictId !== policy.districtId) {
        errors.push(`policies[${index}]: district mismatch ${policy.districtId} vs ${policy.districtName}`);
      }
    }

    if (policy.contentFile) {
      const contentPath = path.join(ROOT_DIR, policy.contentFile);
      if (!fs.existsSync(contentPath)) {
        errors.push(`policies[${index}]: missing content file ${policy.contentFile}`);
      } else if (!fs.readFileSync(contentPath, 'utf8').trim()) {
        errors.push(`policies[${index}]: empty content file ${policy.contentFile}`);
      }
    }
  });

  return errors;
}

function validateNews(news) {
  const errors = [];
  const seenIds = new Set();

  news.forEach((item, index) => {
    validateRequired(item, ['id', 'title', 'category', 'examType', 'summary']).forEach((message) => {
      errors.push(`news[${index}]: ${message}`);
    });

    if (!['zhongkao', 'gaokao'].includes(item.examType)) {
      errors.push(`news[${index}]: invalid examType ${item.examType}`);
    }

    if (seenIds.has(item.id)) {
      errors.push(`news[${index}]: duplicate news id ${item.id}`);
    }
    seenIds.add(item.id);
  });

  return errors;
}

function main() {
  const districts = readJson('districts.json');
  const schools = readJson('schools.json');
  const policies = readJson('policies.json');
  const news = readJson('news.json');

  const errors = [
    ...validateDistricts(districts),
    ...validateSchools(schools),
    ...validatePolicies(policies),
    ...validateNews(news)
  ];

  if (errors.length) {
    console.error('数据校验失败:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`数据校验通过: districts=${districts.length}, schools=${schools.length}, policies=${policies.length}, news=${news.length}`);
}

if (require.main === module) {
  main();
}
