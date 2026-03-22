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

let descriptionFilled = 0;
let requirementsFilled = 0;

const nextSchools = schools.map((school) => {
  const schoolDescription = buildDescription(school);
  const admissionRequirements = buildAdmissionRequirements(school);
  if (schoolDescription) descriptionFilled += 1;
  if (admissionRequirements) requirementsFilled += 1;
  return {
    ...school,
    schoolDescription,
    admissionRequirements
  };
});

fs.writeFileSync(filePath, `${JSON.stringify(nextSchools, null, 2)}\n`);

console.log(JSON.stringify({
  total: nextSchools.length,
  descriptionFilled,
  requirementsFilled
}, null, 2));
