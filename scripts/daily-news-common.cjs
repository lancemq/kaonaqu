// 每日新闻流水线共享工具：日期解析、素材路径、环境加载、常量。
// 所有脚本用法：node scripts/daily-news-<stage>.cjs [--date=YYYY-MM-DD]
// 不传 --date 时取本机当天（GMT+8）。
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGIONS = ['shanghai', 'suzhou', 'nanjing', 'wuxi'];

// 允许的新闻素材键名（与 news 表写库契约一致）
const ALLOWED_KEYS = ['id', 'title', 'newsType', 'category', 'examType', 'summary', 'source', 'publishedAt', 'content', 'relatedSchoolIds'];
const BLOCK_TYPES = ['heading', 'paragraph', 'list', 'quote', 'divider', 'markdown'];
const NEWS_TYPES = ['admission', 'policy', 'exam', 'guide', 'school', 'news'];

function pad(n) { return String(n).padStart(2, '0'); }

// 解析运行日期：--date=YYYY-MM-DD / --date=MMDD / 默认今天
function parseDate(argv) {
  const hit = argv.find(a => a.startsWith('--date='));
  let raw = hit ? hit.split('=')[1] : null;
  if (!raw) {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}\d{2}\d{2}$/.test(raw)) return `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  throw new Error(`无法解析 --date=${raw}，应为 YYYY-MM-DD 或 MMDD`);
}

function mmdd(date) { return date.slice(5).replace('-', ''); }

function materialPath(region, date) {
  const year = date.slice(0, 4);
  return path.join(ROOT, 'reports', `${region}-edu-news-${year}`, `news-items-${date}.json`);
}

function loadMaterials(date) {
  return REGIONS.map(region => ({
    region,
    file: materialPath(region, date),
    items: fs.existsSync(materialPath(region, date))
      ? JSON.parse(fs.readFileSync(materialPath(region, date), 'utf8'))
      : null
  }));
}

// 手动读 .env.local（pg 直连，避免依赖 dotenv）
function loadEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  if (!fs.existsSync(p)) return;
  const txt = fs.readFileSync(p, 'utf8');
  const re = /^([A-Za-z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/gm;
  let m;
  while ((m = re.exec(txt)) !== null) if (!(m[1] in process.env)) process.env[m[1]] = m[2];
}

module.exports = {
  ROOT, REGIONS, ALLOWED_KEYS, BLOCK_TYPES, NEWS_TYPES,
  pad, parseDate, mmdd, materialPath, loadMaterials, loadEnvLocal
};
