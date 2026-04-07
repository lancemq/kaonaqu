export const HIGH_INTEREST_SCHOOL_NAMES = [
  '上海中学',
  '华东师范大学第二附属中学',
  '复旦大学附属中学',
  '上海交通大学附属中学',
  '上海市建平中学',
  '上海市七宝中学',
  '上海市实验学校'
];

export const STABLE_TAGS = [
  '公办',
  '民办',
  '双语',
  '外籍学校',
  '初中',
  '高中',
  '完全中学',
  '寄宿',
  '九年一贯',
  '外语特色',
  '国际课程',
  '示范性高中',
  '市重点',
  '区重点'
];

export const JUDGMENT_TAGS = [
  '科创竞赛',
  '人文综合',
  '艺术特色',
  '寄宿管理',
  '贯通培养',
  '教研课程强',
  '德育活动强'
];

export function isHighInterestSchoolName(name) {
  return HIGH_INTEREST_SCHOOL_NAMES.includes(String(name || '').trim());
}
