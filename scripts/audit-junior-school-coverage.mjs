import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as cheerio from 'cheerio';

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, 'tmp', 'school-audit', 'junior');
const REPORT_DIR = path.join(ROOT, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'junior-school-coverage-audit-2026-04-12.md');

const SOURCES = [
  {
    districtId: 'huangpu',
    districtName: '黄浦区',
    type: 'html-table',
    url: 'https://www.shanghai.gov.cn/hpqywjy/20250416/5f05ce5edb724d40aa297cd684e50df6.html',
    fileName: 'huangpu.html',
    tableIndex: 0,
    columns: { name: 1, ownership: 2, address: 3 }
  },
  {
    districtId: 'pudong',
    districtName: '浦东新区',
    type: 'html-table',
    url: 'https://www.pudong.gov.cn/zwgk/ywjyxxml_jygk_zdgz/2025/97/339839.html',
    fileName: 'pudong.html',
    tableIndex: 1,
    columns: { code: 0, name: 1, campus: 2, ownership: 3, address: 4 }
  },
  {
    districtId: 'changning',
    districtName: '长宁区',
    type: 'html-table',
    url: 'https://zwgk.shcn.gov.cn/xxgk/tjsj-jyjzhzw/2025/97/77181.html',
    fileName: 'changning-facilities.html',
    tableIndex: 0,
    columns: { name: 1, ownership: 2 }
  },
  {
    districtId: 'jingan',
    districtName: '静安区',
    type: 'pdf-patterns',
    url: 'https://www.jingan.gov.cn/main/3287e827-c242-46f6-bdd8-5ccfa54b8605/bd1f0f7b-5238-4e4f-9f78-8d66eadd9a5d/2025%E5%B9%B4%E9%9D%99%E5%AE%89%E5%8C%BA%E5%85%AC%E5%8A%9E%E5%88%9D%E4%B8%AD%E5%85%A5%E5%AD%A6%E6%96%B9%E5%BC%8F.pdf',
    fileName: 'jingan.pdf',
    textFileName: 'jingan.txt',
    names: [
      '上海市民立中学',
      '上海市第一中学',
      '上海市市西初级中学',
      '上海市静安区市西中学附属学校',
      '同济大学附属七一中学',
      '上海市育才初级中学',
      '上海市静安区协和双语培明学校',
      '上海市五四中学',
      '上海市静安区教育学院附属学校',
      '上海市闸北第八中学',
      '上海外国语大学苏河湾实验中学',
      '上海市市北初级中学',
      '上海市静安区市北初级中学西校',
      '上海市静安区市北初级中学北校',
      '上海市青云中学',
      '上海市静安区实验中学',
      '上海市朝阳中学',
      '上海市风华初级中学',
      '上海市静安区风华初级中学西校',
      '上海市静安区风华初级中学南校',
      '上海市静安区风华初级中学北校',
      '上海市新中初级中学',
      '上海市彭浦第四中学',
      '上海市彭浦初级中学',
      '上海市彭浦第三中学',
      '上海市岭南中学',
      '上海市华灵学校',
      '上海市三泉学校',
      '上海市爱国学校',
      '上海戏剧学院附属静安学校',
      '上海市静安区大宁国际学校',
      '上海市时代中学',
      '上海市回民中学',
      '上海市久隆模范中学'
    ]
  },
  {
    districtId: 'hongkou',
    districtName: '虹口区',
    type: 'pdf-patterns',
    url: 'https://www.shhk.gov.cn/hkjy_nas/13bebba5-5f61-49ee-8552-4fee4665e1ac/64054e0e-3738-43c8-ba40-c345b0d09b27/2025%E5%B9%B4%E8%99%B9%E5%8F%A3%E5%8C%BA%E4%B9%89%E5%8A%A1%E6%95%99%E8%82%B2%E9%98%B6%E6%AE%B5%E5%85%AC%E5%8A%9E%E5%88%9D%E4%B8%AD%E6%8B%9B%E7%94%9F%E8%AE%A1%E5%88%92%E5%92%8C%E8%81%94%E7%B3%BB%E6%96%B9%E5%BC%8F.pdf',
    fileName: 'hongkou-public.pdf',
    textFileName: 'hongkou-public.txt',
    ownership: '公办',
    names: [
      { name: '华东师范大学第一附属初级中学', address: '虹关路318号' },
      { name: '同济大学附属澄衷中学', stage: 'complete', address: '临时安置点：霍山路228号' },
      { name: '上海市江湾初级中学', address: '奎照路528弄16号' },
      { name: '上海市海南中学', address: '塘沽路484号' },
      { name: '上海市复兴实验中学', address: '汶水东路690弄73号' },
      { name: '上海师范大学附属虹口中学', stage: 'complete', address: '凉城路2236号' },
      { name: '上海市丰镇中学', address: '丰镇路12号' },
      { name: '上海市鲁迅初级中学', address: '宝安路66弄7号' },
      { name: '上海市钟山初级中学', address: '万安路1289号' },
      { name: '上海市虹口区教育学院实验中学', address: '四川北路1838号' },
      { name: '上海音乐学院虹口区实验中学', address: '水电路285号' },
      { name: '上海市继光初级中学', address: '高阳路640号' },
      { name: '上海市曲阳第二中学', address: '玉田路180号' },
      { name: '上海市第五十二中学', stage: 'complete', address: '广灵二路122号' },
      { name: '上海市北郊学校', stage: 'complete', address: '大连西路205号' },
      { name: '上海市长青学校', stage: 'complete', address: '临时安置点：大连路975弄58号' },
      { name: '上海市虹口实验学校', stage: 'complete', address: '辉河路65号' },
      { name: '上海世外教育附属虹口区欧阳学校', stage: 'complete', address: '祥德路274弄220号' }
    ]
  },
  {
    districtId: 'hongkou',
    districtName: '虹口区',
    type: 'pdf-patterns',
    url: 'https://www.shhk.gov.cn/hkjy_nas/398b4bde-674b-44b5-a86c-66699fae3e5b/cbb7f98d-436a-4ea0-a432-65fef757eb8e/2025%E5%B9%B4%E8%99%B9%E5%8F%A3%E5%8C%BA%E6%B0%91%E5%8A%9E%E5%88%9D%E4%B8%AD%E6%8B%9B%E7%94%9F%E8%AE%A1%E5%88%92.pdf',
    fileName: 'hongkou-private.pdf',
    textFileName: 'hongkou-private.txt',
    ownership: '民办',
    defaultStage: 'junior',
    names: [
      '上海民办克勒外国语学校',
      '上海市民办新华初级中学',
      '上海市民办新复兴初级中学',
      '上海市民办新北郊初级中学',
      '上海市民办迅行中学'
    ]
  }
];

const CHECKED_DISTRICTS = new Set(SOURCES.map((source) => source.districtId));
const DISTRICT_ORDER = ['huangpu', 'xuhui', 'changning', 'jingan', 'putuo', 'hongkou', 'yangpu', 'minhang', 'baoshan', 'jiading', 'pudong', 'jinshan', 'songjiang', 'qingpu', 'fengxian', 'chongming'];

function download(url, filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 KaonaquJuniorCoverageAudit/1.0' } }, (response) => {
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

function cleanCell(value) {
  return String(value || '').replace(/\s+/g, '').trim();
}

function normalizeName(value) {
  return cleanCell(value)
    .replace(/[（）()【】\[\]·•]/g, '')
    .replace(/^上海市/, '上海')
    .replace(/^上海/, '')
    .replace(/初级中学/g, '中学')
    .replace(/高级中学/g, '中学')
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

function inferStageByOwnership(ownership) {
  const text = String(ownership || '');
  if (/完中|一贯制|学校/.test(text)) return 'complete';
  return 'junior';
}

function inferOwnershipLabel(ownership) {
  if (/民办/.test(ownership)) return '民办';
  if (/公办/.test(ownership)) return '公办';
  return '学校公开条目';
}

function parseHtmlTable(source, html) {
  const $ = cheerio.load(html);
  const rows = [];
  const table = $('table').eq(source.tableIndex);
  table.find('tr').each((_, tr) => {
    const cells = $(tr).find('td,th').map((__, cell) => cleanCell($(cell).text())).get();
    const name = cells[source.columns.name];
    const ownership = cells[source.columns.ownership] || '';
    if (!name || !/中学|学校/.test(name) || /学校名称|名称/.test(name) || name === '学校') return;
    rows.push({
      name,
      districtId: source.districtId,
      districtName: source.districtName,
      stage: inferStageByOwnership(ownership),
      ownership: inferOwnershipLabel(ownership),
      address: cells[source.columns.address] || '',
      sourceUrl: source.url
    });
  });
  return dedupe(rows);
}

function parsePdfPatterns(source, text) {
  return source.names
    .map((entry) => (typeof entry === 'string' ? { name: entry } : entry))
    .filter((entry) => text.includes(entry.name))
    .map((entry) => ({
      name: entry.name,
      districtId: source.districtId,
      districtName: source.districtName,
      stage: entry.stage || source.defaultStage || (/学校$/.test(entry.name) ? 'complete' : 'junior'),
      ownership: entry.ownership || source.ownership || '公办',
      address: entry.address || '',
      sourceUrl: source.url
    }));
}

function dedupe(records) {
  const map = new Map();
  for (const record of records) {
    const key = `${record.districtId}|${normalizeName(record.name)}`;
    if (!map.has(key)) map.set(key, record);
  }
  return [...map.values()];
}

async function parseSource(source) {
  const filePath = path.join(TMP_DIR, source.fileName);
  if (!fs.existsSync(filePath)) {
    await download(source.url, filePath);
  }
  if (source.type === 'html-table') {
    return parseHtmlTable(source, fs.readFileSync(filePath, 'utf8'));
  }
  const textPath = path.join(TMP_DIR, source.textFileName);
  execFileSync('npx', ['--yes', 'pdf-parse', 'text', filePath, '--format', 'text', '-o', textPath], {
    cwd: ROOT,
    stdio: 'pipe'
  });
  return parsePdfPatterns(source, fs.readFileSync(textPath, 'utf8'));
}

function toSchoolRecord(record) {
  const id = `${record.districtId}-${record.name.replace(/[\\/\\:*?"<>|]/g, '-')}`;
  return {
    id,
    name: record.name,
    districtId: record.districtId,
    districtName: record.districtName,
    schoolStage: record.stage,
    schoolStageLabel: record.stage === 'complete' ? '完全中学' : '初中',
    schoolType: record.ownership === '民办' ? 'private' : 'public',
    schoolTypeLabel: record.ownership,
    tier: '',
    address: record.address,
    phone: '',
    website: '',
    admissionNotes: `根据${record.districtName}2025年义务教育阶段学校招生入学公开信息整理。具体对口、报名和录取口径请以当年区教育行政部门发布为准。`,
    features: ['区级义务教育招生公开信息'],
    tags: [record.stage === 'complete' ? '完全中学' : '初中', record.ownership, '区级官方名录'],
    source: {
      name: `${record.districtName}2025年义务教育阶段学校招生入学公开信息`,
      type: 'official',
      url: record.sourceUrl,
      crawledAt: '2026-04-12T18:10:00+08:00',
      confidence: 0.96
    },
    updatedAt: '2026-04-12T18:10:00+08:00',
    trainingDirections: ['初中升学路径'],
    profileDepth: 'foundation',
    contentFile: `content/schools/${id}.md`
  };
}

function writeMarkdown(school) {
  const content = [
    '## 学校概览',
    `${school.name}位于${school.districtName}，已根据区级义务教育招生入学公开信息纳入站内学校库。当前先完成官方名单收录，后续可继续补充学校官网、课程特色、师资与开放日信息。`,
    '',
    '## 基础信息',
    `- 所在区域：${school.districtName}`,
    `- 学段：${school.schoolStageLabel}`,
    `- 办学性质：${school.schoolTypeLabel}`,
    school.address ? `- 地址：${school.address}` : null,
    `- 最近更新时间：${school.updatedAt}`,
    '',
    '## 关注重点',
    '- 已纳入区级义务教育招生公开信息。',
    '- 建议继续核对当年对口、报名、摇号、调剂和校方开放日信息。',
    '- 对完全中学或一贯制学校，应分开核对小学、初中与高中阶段口径。',
    '',
    '## 招生与路径',
    school.admissionNotes,
    '',
    '## 培养方向',
    '当前先按区级官方名录完成基础收录，后续可继续补充学校课程、社团、特色项目和升学出口。',
    '',
    '## 适合谁',
    '适合正在按区、对口和学校类型做初中入学初筛的家庭。',
    '',
    '## 阅读提示',
    '本页先解决“是否在区级义务教育招生公开信息内”的收录问题。具体入学判断仍应回到当年区级细则和学校官方通知。',
    '',
    '## 公开信息入口',
    `- [${school.source.name}](${school.source.url})`
  ].filter(Boolean).join('\n');
  fs.writeFileSync(path.join(ROOT, school.contentFile), `${content}\n`);
}

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'content', 'schools'), { recursive: true });

  const schoolsPath = path.join(ROOT, 'data', 'schools.json');
  const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));
  const officialRecords = dedupe((await Promise.all(SOURCES.map(parseSource))).flat());
  const missing = officialRecords.filter((record) => !schools.some((school) => (
    school.districtId === record.districtId && isSameSchoolName(school.name, record.name)
  )));

  const additions = [];
  for (const record of missing) {
    const school = toSchoolRecord(record);
    if (schools.some((item) => item.id === school.id)) continue;
    schools.push(school);
    writeMarkdown(school);
    additions.push(school);
  }

  schools.sort((a, b) => String(a.districtId).localeCompare(String(b.districtId)) || String(a.name).localeCompare(String(b.name), 'zh-Hans-CN'));
  fs.writeFileSync(schoolsPath, `${JSON.stringify(schools, null, 2)}\n`);

  const pendingDistricts = DISTRICT_ORDER.filter((district) => !CHECKED_DISTRICTS.has(district));
  const report = [
    '# 上海初中学校区级覆盖审计',
    '',
    '生成时间：2026-04-12',
    '',
    '## 本轮已核区',
    '',
    ...SOURCES.map((source) => `- ${source.districtName}：${source.url}`),
    '',
    '## 结果',
    '',
    `- 本轮区级官方初中/完全中学基准记录：${officialRecords.length}`,
    `- 本轮补录学校：${additions.length}`,
    `- 补录后站内学校总数：${schools.length}`,
    '',
    additions.length
      ? additions.map((item) => `- ${item.name}（${item.districtName} / ${item.schoolStageLabel}）`).join('\n')
      : '- 本轮已核区无新增缺口。',
    '',
    '## 待核区',
    '',
    `- ${pendingDistricts.join('、')}`,
    '',
    '## 说明',
    '',
    '- 上海初中全量名录需要按区教育行政部门发布的义务教育招生信息逐区核对。',
    '- 上海各区官方公开口径不完全一致；后续把其余区的官方 HTML/PDF 加入 `SOURCES` 即可继续补录。'
  ].join('\n');

  fs.writeFileSync(REPORT_PATH, `${report}\n`);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
