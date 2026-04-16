export function getNewsSection(item) {
  const rawType = String(item?.newsType || '').toLowerCase();
  if (rawType === 'school' || rawType === 'schoolnews' || rawType === 'school_news') {
    return 'school';
  }
  if (rawType === 'admission' || rawType === 'admissionnews' || rawType === 'admission_news') {
    return 'admission';
  }
  if (rawType === 'exam' || rawType === 'examnews' || rawType === 'exam_news') {
    return 'exam';
  }
  if (rawType === 'policy' || rawType === 'policynews' || rawType === 'policy_news') {
    return 'policy';
  }
  if (rawType === 'guide' || rawType === 'guidenews' || rawType === 'guide_news') {
    return 'guide';
  }

  const category = String(item?.category || '').toLowerCase();
  const sourceName = String(item?.source?.name || '').toLowerCase();
  const title = String(item?.title || '').toLowerCase();

  if (category.includes('学校动态') || sourceName.includes('中学官网') || sourceName.includes('学校官网')) {
    return 'school';
  }

  if (category.includes('招生')) {
    return 'admission';
  }
  if (category.includes('政策')) {
    return 'policy';
  }
  if (category.includes('指南') || category.includes('攻略') || category.includes('备考')) {
    return 'guide';
  }

  if (title.includes('学校') && !title.includes('招生')) {
    return 'school';
  }
  if (item?.examType === 'zhongkao' || item?.examType === 'gaokao') {
    return 'exam';
  }
  return 'exam';
}
