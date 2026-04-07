import { getNewsSection as canonicalGetNewsSection } from './site-utils.js';

export function getNewsSection(item) {
  return canonicalGetNewsSection(item);
}

export function shouldShowNewsSchoolCta(item) {
  const section = getNewsSection(item);
  if (section !== 'school' && section !== 'admission') {
    return false;
  }
  return Boolean(item?.primarySchoolId) && typeof item?.schoolLinkConfidence === 'number' && item.schoolLinkConfidence >= 0.85;
}

export function getSchoolObservationTag(item) {
  const text = `${item?.title || ''} ${item?.summary || ''}`.toLowerCase();
  if (/(教研|课程|学科|课堂)/.test(text)) return '教研与课程';
  if (/(机器人|科创|实验|论坛|科研)/.test(text)) return '科创实践';
  if (/(德育|志愿|红领巾|成长)/.test(text)) return '德育活动';
  if (/(竞赛|获奖|金牌|奖项)/.test(text)) return '竞赛培养';
  if (/(健康|体检|管理|寄宿)/.test(text)) return '校园管理';
  if (/(外语|国际|联合国)/.test(text)) return '国际化表达';
  return '学校观察';
}

export function getNewsCardValueLine(item) {
  if (getNewsSection(item) === 'school') {
    return `这条动态更像学校观察线索，重点看 ${getSchoolObservationTag(item)} 对择校判断的帮助。`;
  }
  if (shouldShowNewsSchoolCta(item) && getNewsSection(item) === 'admission') {
    return '这条不只是招生信息，还明确关联到具体学校，适合点进去继续看学校承接。';
  }
  if (getNewsSection(item) === 'exam') {
    return '这条更适合先点进去确认时间、资格或后续安排，避免错过关键节点。';
  }
  return '先点进去看重点，再决定要不要继续跟进专题或学校信息。';
}

export function getNewsCardActionLabel(item) {
  if (getNewsSection(item) === 'school') return '继续看这条的学校线索';
  if (shouldShowNewsSchoolCta(item) && getNewsSection(item) === 'admission') return '进去看完整安排';
  return '点进去看重点';
}

export function getNewsSchoolCtaCopy(item) {
  if (!shouldShowNewsSchoolCta(item)) {
    return null;
  }
  if (getNewsSection(item) === 'school') {
    return {
      title: '这条新闻说明了这所学校什么',
      body: `这条动态更适合当作 ${getSchoolObservationTag(item)} 的学校线索，再结合学校页里的办学定位、招生信息和公开特征一起判断。`,
      action: '查看学校详情'
    };
  }
  if (getNewsSection(item) === 'admission') {
    return {
      title: '这条招生安排和这所学校有什么关系',
      body: '这条新闻已经明确提到具体学校，继续看学校页可以补齐办学定位、招生口径和公开特征。',
      action: '查看这所学校的招生与定位'
    };
  }
  return null;
}
