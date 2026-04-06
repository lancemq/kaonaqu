const POLICY_NEWS_DETAIL_MAP = {
  '2026-all-上海市教育委员会关于2026年上海市高中阶段学校招生工作的若干意见': 'exam-2026-zhongzhao-opinion',
  '2026-all-上海市教育委员会关于做好2026年上海市中等职业学校自主招生工作的通知': 'admission-2026-secondary-vocational-self',
  '2026-all-上海市教育委员会 上海市体育局关于做好2026年上海市高中阶段学校招收优秀体育学生工作的通知': 'admission-2026-outstanding-sports-students',
  '2026-all-上海市教育委员会关于做好2026年上海市特殊教育高中阶段招生入学工作的通知': 'admission-2026-special-education-high-school',
  '2026-all-上海市教育考试院关于印发《2026年上海市高中阶段学校考试招生工作实施细则》的通知（沪教考院中招〔2026〕3号）': 'exam-2026-zhongzhao-implementation-rules',
  '2026-all-上海市教育委员会关于公布2026年上海市普通高中思想政治等7门科目学业水平合格性考试命题要求的通知': 'exam-2026-xuekao-seven-subject-requirements'
};

export function getPolicyMappedNewsId(policyOrId) {
  const id = typeof policyOrId === 'string' ? policyOrId : policyOrId?.id;
  return POLICY_NEWS_DETAIL_MAP[id] || null;
}

export function getPolicyDetailHref(policyOrId) {
  const id = typeof policyOrId === 'string' ? policyOrId : policyOrId?.id;
  return `/news/policy/${encodeURIComponent(String(id || ''))}`;
}
