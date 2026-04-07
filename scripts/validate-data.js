#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  DISTRICT_CATALOG,
  cleanString,
  normalizeDistrictId,
  validateRequired
} = require('../shared/data-schema');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ROOT_DIR = path.join(__dirname, '..');
const VALID_DISTRICT_IDS = new Set(DISTRICT_CATALOG.map((district) => district.id));
const ALLOWED_EXAM_TYPES = new Set(['zhongkao', 'gaokao']);
const ALLOWED_NEWS_TYPES = new Set(['school', 'admission', 'exam']);

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

    if (!['junior', 'senior_high', 'complete'].includes(school.schoolStage)) {
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

function validateNews(news, validSchoolIds) {
  const errors = [];
  const seenIds = new Set();

  news.forEach((item, index) => {
    const newsTypeRaw = cleanString(item.newsType);
    const newsTypeNormalized = newsTypeRaw.toLowerCase();
    const examTypeRaw = cleanString(item.examType);
    const examTypeNormalized = examTypeRaw.toLowerCase();
    const needsExamType = newsTypeNormalized === 'exam';
    const hasExamType = examTypeNormalized !== '';
    const requiredFields = ['id', 'title', 'category', 'summary'];
    if (needsExamType) {
      requiredFields.push('examType');
    }
    requiredFields.push('newsType');

    validateRequired(item, requiredFields).forEach((message) => {
      errors.push(`news[${index}]: ${message}`);
    });

    if (!ALLOWED_NEWS_TYPES.has(newsTypeNormalized)) {
      errors.push(`news[${index}]: invalid newsType ${newsTypeRaw}`);
    }

    if (needsExamType && !ALLOWED_EXAM_TYPES.has(examTypeNormalized)) {
      errors.push(`news[${index}]: invalid examType ${examTypeRaw}`);
    } else if (hasExamType && !ALLOWED_EXAM_TYPES.has(examTypeNormalized)) {
      errors.push(`news[${index}]: invalid examType ${examTypeRaw}`);
    }

    const primarySchoolId = cleanString(item.primarySchoolId);
    if (primarySchoolId) {
      if (!validSchoolIds.has(primarySchoolId)) {
        errors.push(`news[${index}]: invalid primarySchoolId ${primarySchoolId}`);
      }
    }

    const relatedSchoolIdsRaw = item.relatedSchoolIds;
    const hasRelatedArray = Array.isArray(relatedSchoolIdsRaw);
    const normalizedRelatedSchoolIds = [];

    if (hasRelatedArray) {
      relatedSchoolIdsRaw.forEach((relatedId) => {
        const normalizedRelatedId = cleanString(relatedId);
        if (!normalizedRelatedId) {
          errors.push(`news[${index}]: invalid relatedSchoolId ${relatedId}`);
          return;
        }
        normalizedRelatedSchoolIds.push(normalizedRelatedId);
        if (!validSchoolIds.has(normalizedRelatedId)) {
          errors.push(`news[${index}]: invalid relatedSchoolId ${normalizedRelatedId}`);
        }
      });
    }

    if (primarySchoolId) {
      if (!hasRelatedArray) {
        errors.push(`news[${index}]: relatedSchoolIds must be an array when primarySchoolId is set`);
      } else if (!normalizedRelatedSchoolIds.includes(primarySchoolId)) {
        errors.push(`news[${index}]: relatedSchoolIds must include primarySchoolId ${primarySchoolId}`);
      }
    }

    const confidence = item.schoolLinkConfidence;
    if (confidence !== undefined && confidence !== null) {
      if (typeof confidence !== 'number' || Number.isNaN(confidence) || confidence < 0 || confidence > 1) {
        errors.push(`news[${index}]: invalid schoolLinkConfidence ${confidence}`);
      }
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
  const validSchoolIds = new Set(schools.map((school) => cleanString(school.id)).filter(Boolean));

  const errors = [
    ...validateDistricts(districts),
    ...validateSchools(schools),
    ...validatePolicies(policies),
    ...validateNews(news, validSchoolIds)
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
