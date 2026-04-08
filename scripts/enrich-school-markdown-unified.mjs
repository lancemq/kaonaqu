import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { getSchoolContentAbsolutePath } from '../lib/school-content-files.mjs';
import {
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolFeatures,
  getSchoolHighlights,
  getSchoolOwnershipLabel,
  getSchoolStage,
  getSchoolSuitableStudents,
  getSchoolTags,
  getSchoolTrainingDirections,
  getSchoolType
} from '../lib/site-utils.js';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../shared/data-store');

function parseArgs(argv) {
  const args = {
    districts: null,
    includePriority: false,
    limit: null,
    dryRun: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--districts') {
      const raw = String(argv[i + 1] || '').trim();
      args.districts = raw
        ? new Set(raw.split(',').map((x) => x.trim()).filter(Boolean))
        : null;
      i += 1;
      continue;
    }
    if (arg === '--include-priority') {
      args.includePriority = true;
      continue;
    }
    if (arg === '--limit') {
      const raw = Number(argv[i + 1]);
      if (Number.isFinite(raw) && raw > 0) args.limit = Math.floor(raw);
      i += 1;
      continue;
    }
    if (arg === '--dry-run') {
      args.dryRun = true;
    }
  }

  return args;
}

function unique(items = []) {
  return Array.from(new Set(items.filter(Boolean).map((x) => String(x).trim()).filter(Boolean)));
}

function hashText(text = '') {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick(text, arr) {
  if (!arr.length) return '';
  return arr[hashText(text) % arr.length];
}

function hasKeyword(school, keyword) {
  return [
    school.name,
    school.admissionNotes,
    ...(school.features || []),
    ...(school.tags || [])
  ].join(' ').includes(keyword);
}

function buildOverview(school) {
  const district = getSchoolDistrictName(school);
  const stage = getSchoolStage(school);
  const ownership = getSchoolOwnershipLabel(school);
  const type = getSchoolType(school);
  const features = unique([...getSchoolFeatures(school), ...getSchoolTags(school)])
    .filter((x) => !['初中', '高中', '完全中学', '公办', '民办'].includes(x))
    .slice(0, 3);

  const pattern = pick(school.name, [
    `${school.name}位于${district}，当前归类为${stage}${ownership ? `，常见公开口径多标注为${ownership}` : ''}${type ? `（${type}）` : ''}。`,
    `${school.name}位于${district}，是一所${stage}学校，公开条目多归入${ownership || '本区公办'}体系${type ? `（${type}）` : ''}。`,
    `${school.name}位于${district}，现阶段按${stage}${ownership ? `、${ownership}` : ''}${type ? `（${type}）` : ''}口径整理。`
  ]);

  if (!features.length) return `${pattern}当前已补齐基础招生与办学信息，可用于第一轮择校比较。`;
  return `${pattern}从公开资料看，学校较常被提及的方向包括${features.join('、')}。`;
}

function buildHistory(school) {
  const sourceName = String(school?.source?.name || '').trim() || '公开学校资料';
  const district = getSchoolDistrictName(school);
  const stage = getSchoolStage(school);
  const historyTail = pick(`${school.name}-history`, [
    '整体呈现为“稳定办学、持续迭代”的发展特征。',
    '现有资料更偏向近年办学画像，细粒度校史仍建议按学校官方栏目继续补充。',
    '在区内教育体系中，学校信息沉淀以基础条目和招生口径为主。'
  ]);
  return `${school.name}位于${district}，目前按${stage}学校进行信息整理。现有历史信息主要依据${sourceName}等公开来源归纳，${historyTail}`;
}

function buildFeature(school) {
  const features = unique([...getSchoolFeatures(school), ...getSchoolTags(school)]).slice(0, 6);
  const directions = unique(getSchoolTrainingDirections(school)).slice(0, 3);
  const highlights = unique(getSchoolHighlights(school)).slice(0, 2);
  const parts = [];
  if (features.length) parts.push(`公开信息中高频出现的办学关键词包括：${features.join('、')}。`);
  if (directions.length) parts.push(`当前更值得关注的培养方向包括：${directions.join('、')}。`);
  if (highlights.length) parts.push(`从现有资料看，学校更突出的关注点包括：${highlights.join('；')}。`);
  if (!parts.length) parts.push('当前公开信息以基础条目为主，建议进一步补充课程、活动、师资与校史信息。');
  return parts.join('');
}

function buildPathway(school) {
  const stageRaw = school.schoolStage;
  const type = getSchoolType(school);
  if (stageRaw === 'junior') {
    if (type.includes('民办') || hasKeyword(school, '民办')) {
      return '初中阶段建议重点关注民办报名口径、招生计划、录取规则与家庭通勤安排。建议把学校管理风格、课程节奏和孩子学习习惯一起评估。';
    }
    return '初中阶段建议重点核对对口/统筹口径、入学材料要求与区级时间节点。除招生路径外，也要同步关注学校课程节奏、作业负荷与家校沟通机制。';
  }
  if (stageRaw === 'complete') {
    return '完全中学建议分开看两条路径：初中入学按区级义务教育细则执行，高中录取按当年中招政策与学校简章执行。若目标是长期衔接，建议提前了解校内贯通培养逻辑。';
  }
  return '高中阶段建议同时核对统一招生、自主招生与名额分配等路径，并结合学校课程结构、学科优势和学生支持体系进行比较。最终要求以上海当年政策与学校官方简章为准。';
}

function buildDecisionTips(school) {
  const tips = [
    '先确认招生口径：区级入学细则、当年中招政策与学校简章三者要对齐看。',
    '再确认学习匹配：课程强度、作业节奏、活动占比是否匹配孩子当前状态。'
  ];
  if (hasKeyword(school, '寄宿')) {
    tips.push('寄宿学校需额外核对作息管理、周末安排与生活支持体系。');
  } else if (hasKeyword(school, '国际') || hasKeyword(school, '双语')) {
    tips.push('国际化方向建议同步比较课程体系、升学路径与家庭预算承受能力。');
  } else if (hasKeyword(school, '科创') || hasKeyword(school, '实验')) {
    tips.push('科创导向学校建议重点看项目资源、竞赛支持和学生时间管理要求。');
  } else {
    tips.push('最后看长期可持续性：通勤成本、家庭支持能力和孩子心理状态同样关键。');
  }
  return tips;
}

function buildFocusFallback(school) {
  const stageRaw = school.schoolStage;
  const district = getSchoolDistrictName(school);
  const type = getSchoolType(school);
  const directions = unique(getSchoolTrainingDirections(school)).slice(0, 2);
  const features = unique([...getSchoolFeatures(school), ...getSchoolTags(school)])
    .filter((x) => !['初中', '高中', '完全中学', '公办', '民办'].includes(x))
    .slice(0, 2);

  const first = stageRaw === 'junior'
    ? `${school.name}按${district}初中入学口径整理，建议优先核对对口/统筹与区级时间节点。`
    : stageRaw === 'complete'
      ? `${school.name}为完全中学，建议分开查看初中入学与高中录取两条路径。`
      : `${school.name}按高中口径整理，建议结合统招、自招与名额分配路径综合判断。`;

  const second = directions.length
    ? `学校当前更值得关注的培养方向包括：${directions.join('、')}。`
    : `学校类型为${type || '综合类型'}，可结合课程节奏与管理风格做匹配判断。`;

  const third = features.length
    ? `公开资料中较常被提及的特色点包括：${features.join('、')}。`
    : '建议把通勤成本、学习负荷与家校沟通机制放在同一框架里比较。';

  return [first, second, third];
}

function buildFocusPoints(school) {
  const highlights = unique(getSchoolHighlights(school)).slice(0, 4);
  const cleaned = highlights.filter((item) => !item.includes('当前已整理基础学校画像'));
  if (cleaned.length >= 2) return cleaned;
  return buildFocusFallback(school);
}

function buildMarkdown(school) {
  const districtName = getSchoolDistrictName(school);
  const stage = getSchoolStage(school);
  const ownership = getSchoolOwnershipLabel(school);
  const schoolType = getSchoolType(school);
  const overview = buildOverview(school);
  const focusPoints = buildFocusPoints(school);
  const admissionInfo = getSchoolAdmissionInfo(school) || '当前已收录基础招生信息，建议结合学校简章和区县政策继续判断。';
  const directions = unique(getSchoolTrainingDirections(school)).slice(0, 3);
  const features = unique([...getSchoolFeatures(school), ...getSchoolTags(school)]).slice(0, 6);
  const suitableStudents = getSchoolSuitableStudents(school) || '适合希望结合学校节奏、课程体系和培养方向做长期规划的家庭。';
  const website = String(school?.website || '').trim();
  const sourceUrl = String(school?.source?.url || '').trim();
  const sourceName = String(school?.source?.name || '').trim() || '公开来源';

  const blocks = [
    '## 学校概览',
    overview,
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
    ...focusPoints.map((item) => `- ${item}`),
    '',
    '## 历史沿革（公开资料）',
    buildHistory(school),
    '',
    '## 办学特色（公开资料）',
    buildFeature(school),
    '',
    '## 课程与培养路径解读',
    buildPathway(school),
    '',
    '## 招生与路径',
    admissionInfo,
    '具体招生要求请以上海当年政策、区级细则与学校官方发布的招生简章为准。',
    '',
    '## 培养方向',
    directions.length
      ? `学校当前更值得关注的培养方向包括：${directions.join('、')}。`
      : '当前暂未提炼出更明确的培养方向，建议结合课程与活动信息继续判断。',
    features.length
      ? `公开信息里更常出现的关键词包括：${features.join('、')}。`
      : '当前公开信息中可直接提炼的标签仍较少，后续可继续补学校官网、开放日和课程介绍。',
    '',
    '## 适合谁',
    suitableStudents,
    '',
    '## 阅读提示',
    ...buildDecisionTips(school).map((item) => `- ${item}`),
    '',
    '## 公开信息入口',
    website
      ? `[学校官网](${website})`
      : sourceUrl
        ? `[${sourceName}](${sourceUrl})`
        : '学校官网链接暂未补充，可先结合站内区县专题和学校详情继续判断。'
  ].filter(Boolean);

  return `${blocks.join('\n').trim()}\n`;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const { schools } = await loadDataStore();

  let candidates = schools.filter((school) => args.includePriority || school.profileDepth !== 'priority');
  if (args.districts) {
    candidates = candidates.filter((school) => args.districts.has(school.districtId));
  }
  if (args.limit && candidates.length > args.limit) {
    candidates = candidates.slice(0, args.limit);
  }

  let updated = 0;
  const sample = [];
  for (const school of candidates) {
    if (!args.dryRun) {
      const filePath = getSchoolContentAbsolutePath(school);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, buildMarkdown(school), 'utf8');
    }
    updated += 1;
    if (sample.length < 12) sample.push(`${school.districtId}:${school.name}`);
  }

  console.log(JSON.stringify({
    dryRun: args.dryRun,
    includePriority: args.includePriority,
    districts: args.districts ? Array.from(args.districts) : 'all',
    updated,
    sample
  }, null, 2));
}

run();
