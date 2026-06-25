import { getNewsSection as canonicalGetNewsSection } from './news-section-utils.mjs';

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
    return `${getSchoolObservationTag(item)} 相关动态。`;
  }
  if (shouldShowNewsSchoolCta(item) && getNewsSection(item) === 'admission') {
    return '招生信息，关联具体学校。';
  }
  if (getNewsSection(item) === 'exam') {
    return '确认时间、资格与后续安排。';
  }
  return '查看详情。';
}

export function getNewsCardActionLabel(item) {
  if (getNewsSection(item) === 'school') return '查看学校线索';
  if (shouldShowNewsSchoolCta(item) && getNewsSection(item) === 'admission') return '查看完整安排';
  return '查看详情';
}

export function getNewsSchoolCtaCopy(item) {
  if (!shouldShowNewsSchoolCta(item)) {
    return null;
  }
  if (getNewsSection(item) === 'school') {
    return {
      title: '这条新闻与这所学校',
      body: `${getSchoolObservationTag(item)} 相关学校线索。`,
      action: '查看学校详情'
    };
  }
  if (getNewsSection(item) === 'admission') {
    return {
      title: '这条招生安排与这所学校',
      body: '新闻已明确提到具体学校。',
      action: '查看学校招生与定位'
    };
  }
  return null;
}
