import fs from 'fs';
import path from 'path';
import {
  getSchoolAdmissionInfo,
  getSchoolApplicationTips,
  getSchoolDistrictName,
  getSchoolFeatures,
  getSchoolHighlights,
  getSchoolOwnershipLabel,
  getSchoolStage,
  getSchoolSuitableStudents,
  getSchoolTags,
  getSchoolTrainingDirections,
  getSchoolType
} from './site-utils.js';

const SCHOOL_CONTENT_DIR = path.join(process.cwd(), 'content', 'schools');

export function getSchoolContentRelativePath(id) {
  return `content/schools/${String(id || '').trim()}.md`;
}

export function getSchoolContentAbsolutePath(itemOrId) {
  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
  const explicitPath = typeof itemOrId === 'object' && itemOrId?.contentFile
    ? itemOrId.contentFile
    : getSchoolContentRelativePath(id);
  return path.join(process.cwd(), explicitPath);
}

export function buildSchoolMarkdown(school) {
  const districtName = getSchoolDistrictName(school);
  const stage = getSchoolStage(school);
  const ownership = getSchoolOwnershipLabel(school);
  const schoolType = getSchoolType(school);
  const description = school?.schoolDescription || '';
  const highlights = getSchoolHighlights(school);
  const features = [...new Set([...getSchoolFeatures(school), ...getSchoolTags(school)])].filter(Boolean).slice(0, 6);
  const directions = getSchoolTrainingDirections(school).filter(Boolean);
  const admissionInfo = getSchoolAdmissionInfo(school);
  const admissionRequirements = school?.admissionRequirements || '';
  const suitableStudents = getSchoolSuitableStudents(school);
  const applicationTips = getSchoolApplicationTips(school);

  // 仅保留有事实内容的段；空字段不再套用"建议结合…判断"这类空话，整段不输出。
  const blocks = [];

  if (description) {
    blocks.push('## 学校概览', description, '');
  }

  blocks.push(
    '## 基础信息',
    `- 所在区域：${districtName}`,
    `- 学段：${stage}`,
    `- 办学性质：${ownership}`,
    `- 学校类型：${schoolType}`,
    school?.tier ? `- 学校属性：${school.tier}` : null,
    school?.updatedAt ? `- 最近更新时间：${school.updatedAt}` : null,
    ''
  );

  if (highlights.length) {
    blocks.push('## 关注重点', ...highlights.map((item) => `- ${item}`), '');
  }

  if (admissionInfo || admissionRequirements) {
    blocks.push('## 招生与路径');
    if (admissionInfo) blocks.push(admissionInfo);
    if (admissionRequirements) blocks.push(admissionRequirements);
    blocks.push('');
  }

  if (directions.length || features.length) {
    blocks.push('## 培养方向');
    if (directions.length) blocks.push(`培养方向包括：${directions.join('、')}。`);
    if (features.length) blocks.push(`关键词包括：${features.join('、')}。`);
    blocks.push('');
  }

  if (suitableStudents) {
    blocks.push('## 适合谁', suitableStudents, '');
  }

  if (applicationTips) {
    blocks.push('## 阅读提示', applicationTips, '');
  }

  if (school?.website) {
    blocks.push('## 公开信息入口', `[学校官网](${school.website})`, '');
  }

  return blocks.filter(Boolean).join('\n').trim();
}

export function writeSchoolMarkdownFiles(schools = []) {
  fs.mkdirSync(SCHOOL_CONTENT_DIR, { recursive: true });
  const expected = new Set();

  for (const item of schools) {
    if (!item?.id) continue;
    const markdown = buildSchoolMarkdown(item);
    if (!markdown) continue;
    const filePath = getSchoolContentAbsolutePath(item);
    expected.add(path.basename(filePath));
    fs.writeFileSync(filePath, `${markdown}\n`, 'utf8');
  }

  for (const fileName of fs.readdirSync(SCHOOL_CONTENT_DIR)) {
    if (!fileName.endsWith('.md')) continue;
    if (!expected.has(fileName)) {
      fs.unlinkSync(path.join(SCHOOL_CONTENT_DIR, fileName));
    }
  }
}

export function readSchoolMarkdownFile(itemOrId) {
  const filePath = getSchoolContentAbsolutePath(itemOrId);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

export function validateSchoolMarkdownFiles(schools = []) {
  const missing = [];

  for (const item of schools) {
    if (!item?.id) continue;
    const filePath = getSchoolContentAbsolutePath(item);
    if (!fs.existsSync(filePath)) {
      missing.push({ id: item.id, filePath });
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) {
      missing.push({ id: item.id, filePath });
    }
  }

  if (missing.length) {
    const details = missing.map((item) => `${item.id} -> ${item.filePath}`).join('\n');
    throw new Error(`Missing school markdown files:\n${details}`);
  }

  return true;
}
