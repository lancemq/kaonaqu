import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function isMeaningful(text) {
  return String(text || '').trim().length >= 12;
}

function unique(items) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

function getOwnershipLabel(school) {
  const label = String(school.schoolTypeLabel || '').trim();
  if (label) return label;
  return '学校公开条目';
}

function getStageLabel(school) {
  return school.schoolStageLabel || (school.schoolStage === 'junior' ? '初中' : school.schoolStage === 'complete' ? '完全中学' : '高中');
}

function summarizeNote(note, maxSentences = 2) {
  const text = String(note || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const genericPattern = /^(上海|上海市)?[^，。；]{0,20}(区|新区)?\s*(初中|高中|完全中学)\s*(公办|民办|区重点|市重点|学校公开条目|一般高中|优质初中|市实验性示范性高中|市重点分校)?$/;
  if (genericPattern.test(text)) return '';
  const parts = text.split(/[。！？；]/).map((item) => item.trim()).filter(Boolean);
  if (!parts.length) return '';
  return parts.slice(0, maxSentences).join('；');
}

function buildDescription(school) {
  if (isMeaningful(school.schoolDescription)) return school.schoolDescription.trim();

  const stage = getStageLabel(school);
  const type = getOwnershipLabel(school);
  const features = unique(school.features).slice(0, 3);
  const tags = unique(school.tags).filter((tag) => !['初中', '高中', '完全中学', '公办', '民办'].includes(tag)).slice(0, 3);
  const noteSummary = summarizeNote(school.admissionNotes, 1);
  const sourceName = school.source?.name && school.source.name !== '[object Object]' ? school.source.name : '';

  const parts = [];
  parts.push(`${school.name}位于${school.districtName}，当前归类为${stage}${type ? `，常见公开口径多标注为${type}` : ''}。`);
  if (features.length) {
    parts.push(`现有线上资料中较突出的办学关键词包括${features.join('、')}。`);
  } else if (tags.length) {
    parts.push(`现有条目中较常出现的关注点包括${tags.join('、')}。`);
  }
  if (noteSummary) {
    parts.push(`当前收集到的公开说明提到：${noteSummary}。`);
  } else if (sourceName) {
    parts.push(`本页信息主要依据${sourceName}等公开资料整理。`);
  }
  return parts.join('');
}

function buildAdmissionRequirements(school) {
  if (isMeaningful(school.admissionRequirements)) return school.admissionRequirements.trim();

  const noteSummary = summarizeNote(school.admissionNotes, 2);
  if (noteSummary && /(招生|报名|录取|走读|住宿|寄宿|统招|计划|开放日|咨询|对口|学费|对象)/.test(noteSummary)) {
    return `当前公开资料提到：${noteSummary}。实际要求仍以上海当年招生政策、学校简章和区级入学安排为准。`;
  }

  const stage = school.schoolStage;
  const type = String(school.schoolTypeLabel || '');

  if (stage === 'junior') {
    if (type.includes('民办') || unique(school.tags).includes('民办')) {
      return '民办初中通常需符合上海当年义务教育入学条件，并按“一网通办”及民办学校报名系统要求完成报名。招生计划、走读住宿安排和录取方式以学校当年招生简章为准。';
    }
    return '公办初中通常按照上海各区义务教育入学政策执行，重点关注对口、统筹、学籍材料和报名确认时间。具体要求以学校所在区当年入学细则为准。';
  }

  if (stage === 'complete') {
    return '完全中学通常同时涉及义务教育入学和高中阶段招生两类口径。初中入学部分以区级义务教育政策为准，高中录取部分以上海当年中招、自招和学校简章为准。';
  }

  if (type.includes('民办') || unique(school.tags).includes('国际化') || unique(school.tags).includes('双语')) {
    return '民办或国际化高中通常需要结合学校自主招生安排、课程路径、学费和开放日信息综合判断，实际要求以学校当年招生简章和咨询说明为准。';
  }

  return '高中阶段通常按上海当年中招政策执行，重点关注统一招生、自主招生、名额分配、中本贯通等录取路径，以及学校当年的分数要求和招生简章。';
}

function hasTag(school, keyword) {
  return unique([...(school.tags || []), ...(school.features || [])]).some((item) => String(item).includes(keyword));
}

function buildHighlights(school) {
  if (Array.isArray(school.schoolHighlights) && school.schoolHighlights.length >= 3) {
    return unique(school.schoolHighlights.map((item) => String(item).trim()).filter(Boolean)).slice(0, 4);
  }

  const stage = getStageLabel(school);
  const ownership = getOwnershipLabel(school);
  const features = unique(school.features).slice(0, 3);
  const tags = unique(school.tags).filter((tag) => !['初中', '高中', '完全中学', '公办', '民办'].includes(tag));
  const highlights = [];

  highlights.push(`${school.name}当前按${stage}学校整理，常见公开口径多标注为${ownership}。`);

  if (features.length) {
    highlights.push(`当前条目里最突出的办学看点包括${features.join('、')}。`);
  } else if (tags.length) {
    highlights.push(`从现有标签看，这所学校更容易被关注的方向包括${tags.slice(0, 3).join('、')}。`);
  }

  if (school.schoolStage === 'junior') {
    highlights.push('更适合和对口、统筹、民办报名、九年一贯通道一起看，不建议只看学校名称判断。');
  } else if (school.schoolStage === 'complete') {
    highlights.push('这类学校同时覆盖初中和高中信息，查看时要区分义务教育入学和中招录取两套口径。');
  } else {
    highlights.push('高中阶段更适合结合统一招生、自主招生、名额分配和学校简章一起判断报考价值。');
  }

  if (hasTag(school, '国际化') || hasTag(school, '双语')) {
    highlights.push('如果你同时关注课程路径、升学方向和学费成本，这类学校通常值得单独再做一轮比较。');
  } else if (hasTag(school, '寄宿')) {
    highlights.push('寄宿安排、作息管理和走读选择通常会直接影响实际就读体验，建议额外核对。');
  } else if (hasTag(school, '科技') || hasTag(school, '创新') || hasTag(school, '竞赛')) {
    highlights.push('如果更看重科创、竞赛或研究性学习，这类学校通常会更值得优先深看。');
  }

  return unique(highlights).slice(0, 4);
}

function buildSuitableStudents(school) {
  if (isMeaningful(school.suitableStudents)) return school.suitableStudents.trim();

  if (hasTag(school, '国际化') || hasTag(school, '双语')) {
    return '适合同时关注课程路径、英语环境、升学方向和学校开放日信息的家庭；如果你会把学费、课程体系和未来升学去向放在一起评估，这类学校通常更值得重点看。';
  }
  if (hasTag(school, '寄宿')) {
    return '适合希望系统管理作息、能接受寄宿或半寄宿安排，并愿意同时比较校园管理和生活支持条件的家庭。';
  }
  if (hasTag(school, '科技') || hasTag(school, '创新') || hasTag(school, '竞赛')) {
    return '适合更关注科创活动、研究性学习、竞赛氛围和学科拓展资源的学生与家庭。';
  }
  if (school.schoolStage === 'junior') {
    return '适合当前正在做小升初或初中阶段择校比较的家庭，重点看入学路径、办学稳定性和学校特色是否匹配。';
  }
  if (school.schoolStage === 'complete') {
    return '适合希望连续了解初高中培养路径、重视校内衔接和长期规划的家庭。';
  }
  return '适合正在比较高中录取路径、办学特色、课程资源和学校整体气质的学生与家庭。';
}

function buildApplicationTips(school) {
  if (isMeaningful(school.applicationTips)) return school.applicationTips.trim();

  const tips = [];
  if (school.schoolStage === 'junior') {
    tips.push('先确认学校对应的是公办入学、民办报名还是九年一贯路径。');
    tips.push('再核对所在区当年义务教育入学政策、报名时间和材料要求。');
  } else if (school.schoolStage === 'complete') {
    tips.push('先分清你关注的是初中入学还是高中录取，两者口径不同。');
    tips.push('初中部分看区级入学细则，高中部分再看中招和学校简章。');
  } else {
    tips.push('建议同时看统一招生、自主招生、名额分配和学校当年简章。');
    tips.push('不要只凭学校名气判断，分数线、招生计划和区位都要一起看。');
  }

  if (school.website) {
    tips.push('这所学校已有官网入口，适合继续核对课程、活动和最新通知。');
  } else if (school.phone) {
    tips.push('当前已有电话信息，可以优先通过咨询电话确认最新招生安排。');
  } else {
    tips.push('如果准备进一步比较，建议优先补学校官网、开放日和咨询方式。');
  }

  return tips.join('');
}

let descriptionFilled = 0;
let requirementsFilled = 0;
let highlightsFilled = 0;
let suitableFilled = 0;
let tipsFilled = 0;

const nextSchools = schools.map((school) => {
  const schoolDescription = buildDescription(school);
  const admissionRequirements = buildAdmissionRequirements(school);
  const schoolHighlights = buildHighlights(school);
  const suitableStudents = buildSuitableStudents(school);
  const applicationTips = buildApplicationTips(school);
  if (schoolDescription) descriptionFilled += 1;
  if (admissionRequirements) requirementsFilled += 1;
  if (schoolHighlights.length) highlightsFilled += 1;
  if (suitableStudents) suitableFilled += 1;
  if (applicationTips) tipsFilled += 1;
  return {
    ...school,
    schoolDescription,
    admissionRequirements,
    schoolHighlights,
    suitableStudents,
    applicationTips
  };
});

fs.writeFileSync(filePath, `${JSON.stringify(nextSchools, null, 2)}\n`);

console.log(JSON.stringify({
  total: nextSchools.length,
  descriptionFilled,
  requirementsFilled,
  highlightsFilled,
  suitableFilled,
  tipsFilled
}, null, 2));
