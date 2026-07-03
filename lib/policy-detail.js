const POLICY_NEWS_DETAIL_MAP = {
  '2026-zhongzhao-opinion': 'exam-2026-zhongzhao-opinion',
  '2026-zhongzhao-implementation': 'exam-2026-zhongzhao-implementation-rules',
  '2026-zhongzhi-zizhao': 'admission-2026-secondary-vocational-self',
  '2026-tiyu-zhaosheng': 'admission-2026-outstanding-sports-students',
  '2026-tisheng-zhaosheng': 'admission-2026-special-education-high-school',
  '2026-xuekao-7-subjects': 'exam-2026-xuekao-seven-subject-requirements',
  '2026-zonghe-evaluation': 'policy-2026-zonghepingjia-guide',
  '2026-zhongkao-reform': 'policy-2026-zhongkao-reform-review',
  '2026-kecheng-gaige': 'policy-2026-shuangxin-curriculum-deepening'
};

export function getPolicyMappedNewsId(policyOrId) {
  const id = typeof policyOrId === 'string' ? policyOrId : policyOrId?.id;
  return POLICY_NEWS_DETAIL_MAP[id] || null;
}

export function getPolicyDetailHref(policyOrId) {
  const id = typeof policyOrId === 'string' ? policyOrId : policyOrId?.id;
  return `/news/${encodeURIComponent(String(id || ''))}`;
}
