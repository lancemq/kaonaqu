// Pure label/order maps for the knowledge module. No node `fs`/server imports
// here so this module is safe to import from client components.

export const SUBJECT_LABELS = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  history: '历史',
  politics: '道德与法治',
  science: '科学',
  geography: '地理'
};

export const GRADE_LABELS = {
  grade7: '七年级',
  grade8: '八年级',
  grade9: '九年级',
  senior1: '高一',
  senior2: '高二',
  senior3: '高三'
};

export const SUBJECT_ORDER = ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology', 'history', 'politics', 'science', 'geography'];
export const GRADE_ORDER = ['grade7', 'grade8', 'grade9', 'senior1', 'senior2', 'senior3'];
