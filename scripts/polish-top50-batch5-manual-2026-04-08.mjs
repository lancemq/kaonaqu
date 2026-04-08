import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const schools = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'schools.json'), 'utf8'));

const TARGETS = new Set([
  '上海市徐汇区建襄小学',
  '上海市长宁区适存小学',
  '上海市长宁区江苏路第五小学',
  '上海理工大学附属初级中学',
  '上海市闵行区浦江第二中学',
  '上海英国学校',
  '上海市静安区新中初级中学',
  '上海市浦东新区老港中学',
  '上海市浦东新区陆家嘴中学',
  '上海师范大学附属浦东临港中学'
]);

const OVERRIDES = {
  '上海市徐汇区建襄小学': {
    overview: '上海市徐汇区建襄小学当前按完全中学口径收录（含衔接信息）。在公开资料有限的情况下，建议把它作为“连续培养候选”并结合区内政策做实操评估。',
    focus: ['先确认学段政策边界，避免初高中口径混读。', '重点核验校内衔接机制是否明确可执行。', '建议结合家庭长期规划评估路径稳定性。'],
    history: '历史资料目前主要来自公开目录与基础条目，细节有限。建议优先判断近年办学连续性和管理稳定性。',
    feature: '该条目价值更可能体现在“路径衔接”而非单点特色。决策时更应关注阶段转轨清晰度与支持体系。',
    pathway: '建议分学段核验政策后，再评估校内衔接和家庭可执行性，三项对齐后再做决定。'
  },
  '上海市长宁区适存小学': {
    overview: '上海市长宁区适存小学目前按完全中学口径收录。该类条目建议作为“政策与衔接导航”使用，并结合具体学校信息做深度判断。',
    focus: ['先看政策可达性，再看学校匹配度。', '关注衔接课程与阶段管理规则是否清晰。', '建议补充核验校方公开材料，避免信息误读。'],
    history: '当前历史信息主要依托公开目录，细节公开度有限。建议把历史判断聚焦在“近年办学连续性”。',
    feature: '从现有信息看，条目侧重基础教育路径信息。应通过补充来源提高具体办学画像颗粒度。',
    pathway: '建议按“政策核验—校方核验—家庭执行”三步法推进，减少决策偏差。'
  },
  '上海市长宁区江苏路第五小学': {
    overview: '上海市长宁区江苏路第五小学当前按完全中学口径收录。现有信息偏基础，建议在区内同类条目中做并行比较。',
    focus: ['先确认政策口径和时间节点。', '再确认衔接路径和课程节奏。', '最后评估家庭是否具备长期执行能力。'],
    history: '历史信息目前以公开目录为主，校史细节仍待官方补充。建议先用近年稳定性做判断。',
    feature: '条目当前更偏政策与路径信息。若要做高置信决策，需追加学校官方公开材料。',
    pathway: '建议分学段核验并建立对照表，避免单一信息来源导致结论偏差。'
  },
  '上海理工大学附属初级中学': {
    overview: '上海理工大学附属初级中学位于杨浦区，是公办初中。公开资料可支持第一轮筛选，关键细节建议通过校方渠道核实。',
    focus: ['先核验入学流程与材料要求。', '重点关注课程节奏和管理风格与孩子适配度。', '建议补看学校特色项目和师资支持安排。'],
    history: '当前历史资料以公开目录为主，校史细节公开有限。建议优先判断办学连续性与执行稳定性。',
    feature: '学校画像偏“常规公办初中 + 区域稳健路径”，优势在于可预期，需补充核验特色资源深度。',
    pathway: '建议以“流程可达、学习可持续、家庭可执行”三项打分后再决策。'
  },
  '上海市闵行区浦江第二中学': {
    overview: '上海市闵行区浦江第二中学位于闵行区，按公办初中口径整理。适合在区域公办初中中做稳健型横向比较。',
    focus: ['先确认片区入学口径与时间节点。', '重点看课堂节奏与班级管理是否适配。', '建议补充核验家校沟通与学生支持机制。'],
    history: '目前历史信息主要来自公开目录，细节不足。建议先看近年办学是否连续稳定。',
    feature: '学校画像偏常规公办初中路径，适合重视秩序与稳定推进的家庭。',
    pathway: '建议流程、节奏、通勤、家庭支持四维并行评估，避免单维判断。'
  },
  '上海英国学校': {
    overview: '上海英国学校位于浦东新区，按完全中学路径整理。该类国际化学校决策应重点看课程体系、身份要求与升学路径匹配。',
    focus: ['先核验入学资格与课程体系（如国际课程路径）。', '重点评估费用结构与家庭预算可承受性。', '建议确认升学出口与学段衔接的真实可执行性。'],
    history: '公开历史信息以基础条目为主，建议通过学校官方发布补齐更细校史与办学沿革信息。',
    feature: '学校画像偏国际化连续培养路径，优势是课程体系清晰；挑战是成本与路径选择需更早规划。',
    pathway: '建议按“资格与政策—课程与费用—升学与执行”三步评估，形成可落地决策。'
  },
  '上海市静安区新中初级中学': {
    overview: '上海市静安区新中初级中学位于静安区，是公办初中。公开资料可用于基础比较，建议结合区内同类学校并行判断。',
    focus: ['先核验区级入学流程，确保路径可达。', '重点看学校教学节奏与孩子学习状态匹配度。', '建议补看家校沟通效率与学生支持安排。'],
    history: '当前历史信息多来自公开目录，细节仍待补充。建议先判断学校近年办学连续性。',
    feature: '学校画像偏“常规公办初中 + 稳定管理”。对多数家庭，匹配度比外部标签更重要。',
    pathway: '建议按政策、节奏、家庭执行三条线同步评估，再做最终择校决定。'
  },
  '上海市浦东新区老港中学': {
    overview: '上海市浦东新区老港中学位于浦东新区，按公办初中路径整理。学校信息公开度中等偏低，建议采用务实核验方式。',
    focus: ['优先确认入学政策口径和关键节点。', '重点核验课堂节奏、作业负荷与管理风格。', '建议通过开放日或咨询补齐公开信息盲区。'],
    history: '历史资料目前以公开目录和基础条目为主。实操上可先看近年办学稳定性与管理连续性。',
    feature: '学校画像偏常规公办初中路径，优势在于可预期；特色信息需通过校方渠道进一步核验。',
    pathway: '建议建立区内备选清单，按流程可达、节奏适配、家庭支持三项做对照评分。'
  },
  '上海市浦东新区陆家嘴中学': {
    overview: '上海市浦东新区陆家嘴中学位于浦东新区，是公办初中。当前公开资料可做第一轮筛选，最终决策建议补齐校方一手信息。',
    focus: ['先核验政策流程，避免程序性风险。', '重点看课程节奏与班型组织是否匹配孩子。', '建议补看学校近年公开教学组织与活动信息。'],
    history: '现有历史资料主要来源于公开目录，细节公开有限。建议先以近年办学连续性做判断。',
    feature: '学校画像偏“区域公办初中常规路径”，优势是管理框架稳定，适合做稳健型选择。',
    pathway: '建议将政策可达性与学习可持续性并行评估，再结合家庭执行条件做最终决策。'
  },
  '上海师范大学附属浦东临港中学': {
    overview: '上海师范大学附属浦东临港中学位于浦东新区，属于完全中学。该类学校的评估重点应放在学段衔接与路径连续性。',
    focus: ['先分开核验初中与高中政策口径。', '重点看校内衔接课程与转段机制是否明确。', '建议评估家庭长期执行能力与通勤可持续性。'],
    history: '当前历史信息以公开目录型来源为主，细节仍需学校官方公开补充。建议优先看近年连续办学表现。',
    feature: '学校画像偏“连续培养 + 规范管理”路线，优势是路径连贯，挑战是需要更早做中长期规划。',
    pathway: '建议按“分学段政策核验—衔接机制评估—家庭执行校验”三步法推进，确保决策可落地。'
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
