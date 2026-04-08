import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const schools = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'schools.json'), 'utf8'));

const TARGETS = new Set([
  '上海市浦东新区泥城中学',
  '上海市青浦区华徐学校',
  '上海市青浦区香花学校',
  '上海市奉贤区弘文学校',
  '上海市黄浦区新闸路中学',
  '上海市建平临港中学',
  '上海市浦东模范中学',
  '上海市浦东新区万祥学校',
  '上海市松江区洞泾学校',
  '上海市松江区佘山学校'
]);

const OVERRIDES = {
  '上海市浦东新区泥城中学': {
    overview: '上海市浦东新区泥城中学位于浦东新区，按公办初中路径整理。该校公开信息以基础条目为主，适合通过“政策可达性 + 学习节奏适配”做稳健判断。',
    focus: ['先核验对口/统筹与报名节点，确保入学流程可达。', '重点看课堂节奏、作业负荷与班级管理是否匹配孩子状态。', '建议补充核验学校特色课程和学生支持机制的持续性。'],
    history: '当前历史信息主要来自公开目录型来源，校史细节公开有限。建议将历史维度转化为“近年办学连续性与治理稳定性”的实操判断。',
    feature: '学校画像偏“常规公办初中 + 区域稳定路径”。优势是可预期性强，挑战是特色资源信息公开不多，需要家长主动补齐。',
    pathway: '建议按“政策流程—学校节奏—家庭执行”三步并行评估，避免只凭单次口碑做决定。'
  },
  '上海市青浦区华徐学校': {
    overview: '上海市青浦区华徐学校位于青浦区，属完全中学。评估这类学校时，关键在于初高衔接机制是否真实可执行。',
    focus: ['初中与高中政策口径必须分开核验。', '如考虑校内连续培养，建议提前确认转段规则与课程衔接。', '重点评估三年到六年的学习节奏是否与家庭规划一致。'],
    history: '公开历史信息以目录与基础条目为主，细节公开不多。建议优先判断学校近年办学路径是否连续稳定。',
    feature: '学校更偏“连续培养框架”路线，优势是路径连贯；挑战是需要家庭更早明确发展方向并持续跟进。',
    pathway: '建议先分学段做政策核验，再看校内衔接与支持系统，最后结合通勤与家庭执行力做最终决策。'
  },
  '上海市青浦区香花学校': {
    overview: '上海市青浦区香花学校位于青浦区，按完全中学口径整理。对家庭而言，这类学校的核心价值在于学段衔接与路径稳定。',
    focus: ['先确认初高中两段政策边界，避免信息混读。', '重点核验校内衔接课程与分层机制是否清晰。', '建议关注学校日常管理强度与家庭支持能力的匹配度。'],
    history: '当前历史资料主要依托公开目录，校史细节仍待官方补充。建议将历史判断落到“办学连续性和执行稳定性”。',
    feature: '学校特色更偏连续培养组织能力，若家庭重视长期规划，可重点关注其阶段衔接效率与支持体系。',
    pathway: '建议把“政策可达、学习可持续、家庭可执行”设为三条硬约束，三项都达标再决定。'
  },
  '上海市奉贤区弘文学校': {
    overview: '上海市奉贤区弘文学校位于奉贤区，为完全中学。公开信息可支撑基础判断，但深层细节建议通过校方渠道补齐。',
    focus: ['建议分学段核验政策，不建议把初高路径混为一体。', '关注衔接阶段的课程节奏与转段支持。', '建议实地核验作息管理与家校沟通效率。'],
    history: '历史信息目前以公开目录型来源为主，细粒度校史公开有限。可先以“近年连续办学表现”作为历史判断核心。',
    feature: '学校当前画像偏“连续培养 + 规范管理”路径，适合重视稳定推进和长期规划的家庭。',
    pathway: '建议先确认初中端入学规则，再确认高中端招生与培养方向，最后回到家庭执行条件做匹配。'
  },
  '上海市黄浦区新闸路中学': {
    overview: '上海市黄浦区新闸路中学位于黄浦区，是公办初中。学校公开信息偏基础，适合在区内同梯队学校中做流程化比较。',
    focus: ['优先核验区级入学规则与材料节点。', '重点看学校管理节奏与学业负荷是否适配孩子。', '建议补看家校沟通机制和学生支持安排。'],
    history: '现有历史信息主要来自公开目录，细节需后续补充。建议先判断学校近年办学是否连续稳定。',
    feature: '学校画像偏常规公办初中路径，优势在于制度清晰、执行可预期。',
    pathway: '建议将流程可达性、学习可持续性、家庭支持度三项并列评估，避免单维决策。'
  },
  '上海市建平临港中学': {
    overview: '上海市建平临港中学位于浦东新区，是公办初中。学校名称具备一定辨识度，但仍需回到具体办学信息做实证判断。',
    focus: ['先核验入学口径与时间节点，明确路径。', '重点看课程节奏与班型组织是否适配孩子。', '建议核验学校在学业支持与特色项目上的实际供给。'],
    history: '目前历史资料主要来自公开目录和基础条目，细节公开有限。建议优先看近年办学连续性与组织稳定性。',
    feature: '从当前标签看，学校更偏稳健公办初中路径。若家庭期待高密度特色资源，需额外做二次核验。',
    pathway: '建议通过开放日或校方咨询补齐关键信息，再与浦东同梯队学校做并行比较。'
  },
  '上海市浦东模范中学': {
    overview: '上海市浦东模范中学位于浦东新区，按公办初中口径整理。该校适合纳入区域公办初中横向池，以“稳定性优先”框架评估。',
    focus: ['先确认政策流程，确保入学可达。', '再看学校节奏与孩子学习习惯匹配度。', '如重视升学结果，建议补看近年公开教学组织信息。'],
    history: '当前历史信息以公开目录为主，细节仍待校方公开材料补充。建议先看近年办学连续性。',
    feature: '学校画像偏常规公办初中路径，适合希望稳步推进初中三年的家庭。',
    pathway: '建议将“流程、节奏、通勤、家庭支持”四项做打分比较，避免被单一信息牵引。'
  },
  '上海市浦东新区万祥学校': {
    overview: '上海市浦东新区万祥学校位于浦东新区，属完全中学。评估时需重点关注衔接质量与路径连续性。',
    focus: ['先分开核验初中与高中政策口径。', '重点核验校内衔接机制、课程连续性与转段支持。', '建议结合通勤与作息可执行性做长期判断。'],
    history: '现有历史资料多为基础公开条目，细节仍待补充。建议将历史判断聚焦在“办学连续性和管理稳定性”。',
    feature: '学校价值主要体现在连续培养框架。优势是路径连贯，挑战是家庭需更早规划并持续跟踪。',
    pathway: '建议先做分学段政策核验，再做校内衔接评估，最后结合家庭执行条件确定是否走一体化路径。'
  },
  '上海市松江区洞泾学校': {
    overview: '上海市松江区洞泾学校位于松江区，为完全中学。对家庭而言，该类学校应重点看“衔接是否落地”而非概念标签。',
    focus: ['建议先分学段核验政策边界。', '重点确认校内衔接课程与阶段转轨机制。', '结合家庭规划判断是否适配长期连续培养。'],
    history: '当前历史信息以公开目录型来源为主，细节公开不足。建议先以近年办学连续性作为实操判断。',
    feature: '学校画像偏连续培养与规范管理路线，适合重视路径稳定性的家庭。',
    pathway: '建议把政策可达性、课程衔接清晰度、家庭支持可执行性三项并行评估后再决策。'
  },
  '上海市松江区佘山学校': {
    overview: '上海市松江区佘山学校位于松江区，按完全中学路径整理。该校更适合放在“长期衔接候选”中比较。',
    focus: ['先核验初高中两套政策口径。', '重点看衔接机制是否明确且执行稳定。', '建议核验作息节奏与家庭支持能力是否匹配。'],
    history: '目前历史资料主要来自公开目录，细节有待学校官方补充。建议先关注近年发展连续性。',
    feature: '学校特色偏“连续培养框架”，核心在于路径连贯与执行稳定，而非单点亮点。',
    pathway: '建议以“政策—学校—家庭”三层框架评估，特别关注阶段转轨节点的可执行性。'
  }
};

function buildMarkdown(school, override) {
  const district = school.districtName;
  const stageLabel = school.schoolStageLabel || school.schoolStage;
  const ownership = school.schoolTypeLabel || school.schoolType || '学校公开条目';
  const schoolType = school.schoolTypeLabel || school.schoolType || '学校公开条目';
  const directions = (school.trainingDirections || []).filter(Boolean);
  const features = [...new Set([...(school.features || []), ...(school.tags || [])])].filter(Boolean).slice(0, 6);
  const website = String(school.website || '').trim();
  const sourceName = String(school?.source?.name || '公开来源');
  const sourceUrl = String(school?.source?.url || '').trim();

  const tips = [
    '- 先看政策是否可达，再看学校是否匹配，最后看家庭是否可执行。',
    '- 重点核验作息、作业负荷、班型分层与家校沟通，避免只看名气。',
    '- 建议至少参加一次开放日或电话咨询，补齐公开信息盲区。'
  ];

  const blocks = [
    '## 学校概览',
    override.overview,
    '',
    '## 基础信息',
    `- 所在区域：${district}`,
    `- 学段：${stageLabel}`,
    `- 办学性质：${ownership}`,
    `- 学校类型：${schoolType}`,
    school?.tier ? `- 学校属性：${school.tier}` : null,
    school?.updatedAt ? `- 最近更新时间：${school.updatedAt}` : null,
    '',
    '## 关注重点',
    ...override.focus.map((item) => `- ${item}`),
    '',
    '## 历史沿革（公开资料）',
    override.history,
    '',
    '## 办学特色（公开资料）',
    override.feature,
    '',
    '## 课程与培养路径解读',
    override.pathway,
    '',
    '## 招生与路径',
    school.admissionNotes || '建议结合上海当年政策、区级细则和学校招生简章综合判断。',
    '具体招生要求请以上海当年政策、区级细则与学校官方发布的招生简章为准。',
    '',
    '## 培养方向',
    directions.length
      ? `学校当前更值得关注的培养方向包括：${directions.join('、')}。`
      : '当前公开信息尚未形成明确培养方向标签，建议通过课程设置与活动项目继续核验。',
    features.length
      ? `公开信息里更常出现的关键词包括：${features.join('、')}。`
      : '当前公开信息关键词较少，后续建议补充官网与开放日材料。',
    '',
    '## 适合谁',
    '适合愿意做“政策核验 + 学校匹配 + 家庭执行”三步判断的家庭，尤其适合重视长期稳定学习节奏与实际可执行性的家长。',
    '',
    '## 阅读提示',
    ...tips,
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

let updated = 0;
const sample = [];
for (const school of schools) {
  if (!TARGETS.has(school.name)) continue;
  const override = OVERRIDES[school.name];
  if (!override) continue;
  const relative = school.contentFile || `content/schools/${school.id}.md`;
  const absolute = path.join(ROOT, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, buildMarkdown(school, override), 'utf8');
  updated += 1;
  sample.push(school.name);
}

console.log(JSON.stringify({ updated, sample }, null, 2));
