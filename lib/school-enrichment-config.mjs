const HIGH_INTEREST_SCHOOL_NAMES = [
  '上海中学',
  '华东师范大学第二附属中学',
  '复旦大学附属中学',
  '上海交通大学附属中学',
  '上海市建平中学',
  '上海市七宝中学',
  '上海市实验学校',
  '上海市南洋模范中学',
  '上海市格致中学',
  '上海市大同中学',
  '上海市控江中学',
  '上海市长宁区延安中学',
  '上海市复兴高级中学'
];

export function isHighInterestSchoolName(name) {
  return HIGH_INTEREST_SCHOOL_NAMES.includes(String(name || '').trim());
}
