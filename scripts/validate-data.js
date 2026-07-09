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
const ALLOWED_NEWS_TYPES = new Set(['school', 'admission', 'exam', 'policy', 'guide']);
const ALLOWED_PROFILE_DEPTHS = new Set(['foundation', 'priority', 'enhanced']);
const DETAIL_FIELDS = ['schoolDescription', 'admissionRequirements', 'schoolHighlights', 'suitableStudents', 'applicationTips'];

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

    const profileDepth = cleanString(school.profileDepth || 'foundation');
    if (!ALLOWED_PROFILE_DEPTHS.has(profileDepth)) {
      errors.push(`schools[${index}]: invalid profileDepth ${school.profileDepth}`);
    }

    for (const field of DETAIL_FIELDS) {
      const value = school[field];
      if (Array.isArray(value) ? value.length : cleanString(value)) {
        errors.push(`schools[${index}]: ${field} must be stored in markdown, not schools.json`);
      }
    }
  });

  return errors;
}

function validateNews(news, validSchoolIds) {
  const errors = [];
  const seenIds = new Set();
  const NEWS_CONTENT_TYPES = new Set(['policy', 'guide', 'admission', 'exam', 'school']);

  function getNewsContentRelativePath(item) {
    const type = item.newsType && NEWS_CONTENT_TYPES.has(item.newsType)
      ? item.newsType
      : (NEWS_CONTENT_TYPES.has(String(item.id || '').split('-')[0]) ? String(item.id || '').split('-')[0] : 'uncategorized');
    return `content/news/${type}/${String(item.id || '').trim()}.md`;
  }

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

    // 校验 news 详情 markdown 文件存在（与 lib/news-content-files.mjs 路径推算一致）
    const contentRelativePath = item.contentFile || getNewsContentRelativePath(item);
    const contentAbsPath = path.join(ROOT_DIR, contentRelativePath);
    if (!fs.existsSync(contentAbsPath)) {
      errors.push(`news[${index}]: missing content file ${contentRelativePath}`);
    } else if (!fs.readFileSync(contentAbsPath, 'utf8').trim()) {
      errors.push(`news[${index}]: empty content file ${contentRelativePath}`);
    }
  });

  return errors;
}

function main() {
  const districts = readJson('districts.json');
  const schools = readJson('schools.json');
  const news = readJson('news.json');
  const validSchoolIds = new Set(schools.map((school) => cleanString(school.id)).filter(Boolean));

  const errors = [
    ...validateDistricts(districts),
    ...validateSchools(schools),
    ...validateNews(news, validSchoolIds)
  ];

  if (errors.length) {
    console.error('数据校验失败:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`数据校验通过: districts=${districts.length}, schools=${schools.length}, news=${news.length}`);
}

if (require.main === module) {
  main();
}
