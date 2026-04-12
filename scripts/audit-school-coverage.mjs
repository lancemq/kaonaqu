import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, 'tmp', 'school-audit');
const REPORT_DIR = path.join(ROOT, 'reports');
const HIGH_SCHOOL_PDF_URL = 'https://www.shmeea.edu.cn/download/20250430/90.pdf';
const COMPULSORY_EDU_POLICY_URL = 'https://www.shanghai.gov.cn/nw12344/20250327/9d524c40947141639a2c40666ee4490d.html';
const HIGH_SCHOOL_PDF = path.join(TMP_DIR, 'shanghai-2025-high-schools.pdf');
const HIGH_SCHOOL_TEXT = path.join(TMP_DIR, 'shanghai-2025-high-schools.txt');
const REPORT_PATH = path.join(REPORT_DIR, 'school-coverage-audit-2026-04-12.md');

const DISTRICT_MAP = {
  '黄浦区': 'huangpu',
  '徐汇区': 'xuhui',
  '长宁区': 'changning',
  '静安区': 'jingan',
  '普陀区': 'putuo',
  '虹口区': 'hongkou',
  '杨浦区': 'yangpu',
  '闵行区': 'minhang',
  '宝山区': 'baoshan',
  '嘉定区': 'jiading',
  '浦东新区': 'pudong',
  '金山区': 'jinshan',
  '松江区': 'songjiang',
  '青浦区': 'qingpu',
  '奉贤区': 'fengxian',
  '崇明区': 'chongming'
};

function download(url, filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 KaonaquCoverageAudit/1.0' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        download(new URL(response.headers.location, url).href, filePath).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      const stream = fs.createWriteStream(filePath);
      response.pipe(stream);
      stream.on('finish', () => stream.close(resolve));
    }).on('error', reject);
  });
}

function normalizeName(value) {
  return String(value || '')
    .replace(/[（）()\[\]【】\s·•]/g, '')
    .replace(/^上海市/, '上海')
    .replace(/^上海/, '')
    .replace(/高级中学/g, '中学')
    .replace(/初级中学/g, '中学')
    .replace(/附属/g, '附')
    .replace(/第二/g, '二')
    .replace(/第一/g, '一')
    .replace(/第十/g, '市十')
    .replace(/黄浦区|徐汇区|长宁区|静安区|普陀区|虹口区|杨浦区|闵行区|宝山区|嘉定区|浦东新区|金山区|松江区|青浦区|奉贤区|崇明区/g, '');
}

function isSameSchoolName(localName, officialName) {
  const local = normalizeName(localName);
  const official = normalizeName(officialName);
  if (!local || !official) return false;
  if (local === official) return true;
  return (local.includes(official) || official.includes(local)) && Math.min(local.length, official.length) >= 4;
}

function parseHighSchoolPdfText(text) {
  const districts = Object.keys(DISTRICT_MAP);
  const pattern = new RegExp(`^(\\d+)\\s+(.+?)\\s+(\\d{6})\\s+(${districts.join('|')})\\s+(公办|民办|中外|合作)`, 'gm');
  const rows = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    rows.push({
      sequence: Number(match[1]),
      name: match[2].replace(/\s+/g, ''),
      admissionCode: match[3],
      districtName: match[4],
      districtId: DISTRICT_MAP[match[4]]
    });
  }

  return rows;
}

function summarizeByDistrict(records) {
  return records.reduce((acc, item) => {
    acc[item.districtId || 'unknown'] = (acc[item.districtId || 'unknown'] || 0) + 1;
    return acc;
  }, {});
}

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  if (!fs.existsSync(HIGH_SCHOOL_PDF)) {
    await download(HIGH_SCHOOL_PDF_URL, HIGH_SCHOOL_PDF);
  }

  execFileSync('npx', ['--yes', 'pdf-parse', 'text', HIGH_SCHOOL_PDF, '--format', 'text', '-o', HIGH_SCHOOL_TEXT], {
    cwd: ROOT,
    stdio: 'pipe'
  });

  const schools = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'schools.json'), 'utf8'));
  const officialHighSchools = parseHighSchoolPdfText(fs.readFileSync(HIGH_SCHOOL_TEXT, 'utf8'));
  const missingHighSchools = officialHighSchools.filter((official) => (
    !schools.some((school) => school.districtId === official.districtId && isSameSchoolName(school.name, official.name))
  ));
  const localJuniorOrComplete = schools.filter((school) => ['junior', 'complete'].includes(school.schoolStage));

  const report = [
    '# 上海初高中学校覆盖审计',
    '',
    `生成时间：2026-04-12`,
    '',
    '## 高中覆盖',
    '',
    `- 官方基准：上海市教育考试院《2025 年上海市高中招生学校名单》：${HIGH_SCHOOL_PDF_URL}`,
    `- 官方 PDF 解析记录数：${officialHighSchools.length}`,
    `- 站内学校总数：${schools.length}`,
    `- 高中官方名单缺口：${missingHighSchools.length}`,
    '',
    missingHighSchools.length
      ? missingHighSchools.map((item) => `- ${item.sequence}. ${item.name}（${item.districtName} / ${item.admissionCode}）`).join('\n')
      : '- 结论：当前站内学校库已覆盖本轮解析到的官方高中招生学校名单。',
    '',
    '## 初中覆盖',
    '',
    `- 站内初中/完全中学相关记录：${localJuniorOrComplete.length}`,
    `- 按区分布：${JSON.stringify(summarizeByDistrict(localJuniorOrComplete))}`,
    `- 市级义务教育政策入口：${COMPULSORY_EDU_POLICY_URL}`,
    '- 本轮未找到一个可直接机器读取的上海市级“全量初中学校名单”。市级义务教育招生政策明确各区教育行政部门负责公布招生入学相关信息，因此初中全量覆盖需要按 16 区官方页面/PDF 逐区建立基准表后再跑差集。',
    '',
    '## 使用说明',
    '',
    '- 重新运行：`node scripts/audit-school-coverage.mjs`',
    '- 若后续补齐 16 区初中官方基准，可在本脚本中增加 district junior source 解析，再生成初中缺口表。'
  ].join('\n');

  fs.writeFileSync(REPORT_PATH, `${report}\n`);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
