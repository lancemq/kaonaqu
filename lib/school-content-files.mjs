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
  const description = school?.schoolDescription || `${school?.name || '这所学校'}位于${districtName}，当前已整理学校定位、招生路径和基础择校提示。`;
  const highlights = getSchoolHighlights(school);
  const features = [...new Set([...getSchoolFeatures(school), ...getSchoolTags(school)])].filter(Boolean).slice(0, 6);
  const directions = getSchoolTrainingDirections(school).filter(Boolean);
  const admissionInfo = getSchoolAdmissionInfo(school) || '当前已收录基础招生信息，建议结合学校简章和区县政策继续判断。';
  const admissionRequirements = school?.admissionRequirements || '';
  const suitableStudents = getSchoolSuitableStudents(school) || '适合希望结合学校节奏、课程体系和培养方向做长期规划的家庭。';
  const applicationTips = getSchoolApplicationTips(school) || '建议把通勤距离、孩子适应节奏、学校培养方向和同伴环境放在一起看，不要只看名气。';

  const blocks = [
    '## 学校概览',
    description,
    '',
    '## 基础信息',
    `- 所在区域：${districtName}`,
    `- 学段：${stage}`,
    `- 办学性质：${ownership}`,
    `- 学校类型：${schoolType}`,
    school?.tier ? `- 学校属性：${school.tier}` : null,
    school?.updatedAt ? `- 最近更新时间：${school.updatedAt}` : null,
    '',
    '## 关注重点',
    ...(highlights.length ? highlights.map((item) => `- ${item}`) : ['- 当前已整理基础学校画像，适合先做第一轮判断。']),
    '',
    '## 招生与路径',
    admissionInfo,
    admissionRequirements || '这所学校的具体招生口径，需要继续结合上海当年政策、区级细则和学校简章一起看。',
    '',
    '## 培养方向',
    directions.length ? `学校当前更值得关注的培养方向包括：${directions.join('、')}。` : '当前暂未提炼出更明确的培养方向，建议结合课程与活动信息继续判断。',
    features.length ? `公开信息里更常出现的关键词包括：${features.join('、')}。` : '当前公开信息中可直接提炼的标签仍较少，后续可继续补学校官网、开放日和课程介绍。',
    '',
    '## 适合谁',
    suitableStudents,
    '',
    '## 阅读提示',
    applicationTips,
    '',
    '## 公开信息入口',
    school?.website ? `[学校官网](${school.website})` : '学校官网链接暂未补充，可先结合站内区县专题和学校详情继续判断。'
  ].filter(Boolean);

  return blocks.join('\n').trim();
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
