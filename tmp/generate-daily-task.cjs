// 每日任务分配器：跑总览查询 → 按优先级规则产出当日任务分配 → 写 tmp/daily-task-today.json
// 由 automation-1784266942235 每日首轮调用；执行完批次后再跑 tmp/full-city-overview.cjs 刷新总览。
// 2026-10-30 起双线：本脚本末尾联动跑 tmp/generate-university-task.cjs（高校数据债），
// 并把高校今日任务合并进 daily-task-today.json 的 universityTask 字段——自动化按"分配器输出"执行，
// 高校线由此纳入每日例行，无需改自动化 prompt。
// 优先级规则（P0 > P1 > P2，同优先级内按顺序取第一个有余量的方向）：
//   P0  上线门槛类：市/区重点高中缺 content、缺当年统招线（直接伤害页面质量）
//   P1  深度数据类：头部校 outcome、招生代码、历史年份线（<3 年）、初中头部 level 校准
//   P1W 弱市攻坚类（WEAK_CITY权重前置）：一般高中缺2026线（排除外籍/中外合作/已知自招校）、
//       初中 content 薄/空（苏州263薄→无锡46空→南京67薄）、建校年份缺失
//   P2  长尾类：一般初中 content、一般高中 content
// 2026-10-29 数据债重构：按四城质量审计结果（上海健康/南京框架好骨架多/苏州初中欠账/无锡全骨架），
// 新增弱市攻坚方向，弱市（无锡>苏州>南京）在查询排序中加权前置，集中火力清质量洼地。
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
let url = (env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL).replace(/[?&]sslmode=[^&]+/g, '');

const BATCH = Number((process.argv.find(a => a.startsWith('--batch=')) || '=20').split('=')[1]) || 20;

// 结构性无统招线的市/区重点高中（经抽查确认，非数据缺口）——加入白名单以免每日空跑。
// 来源：2026-10-13 P0 分数线专项批，已写入 scoreLines:[] + admissionNotes 说明。
// 注意：qixia-nanjing-yanziji-zhongxue 为 pinyin-slug 重复记录（与中文 slug 同校），其删除走独立清理，
// 此处一并排除避免被「缺 2026 线」查询重复标记。
const NO_LINE_KNOWN = [
  'qixia-nanjing-yanziji-zhongxue',                          // 燕子矶(老pinyin slug, 重复记录)
  '栖霞区-南京市燕子矶中学（燕子矶校区）',                    // 燕子矶校区 2026 第一批次断档
  '鼓楼区-南京师范大学附属中学科学高中',                      // 市直属特殊类型·科技特长生+加试
  '虹口区-上海外国语大学附属外国语学校',                      // 七年一贯直升
  '浦东新区-上海外国语大学附属浦东外国语学校',                // 提前批自招（三公）
  '嘉定区-上海市延安中学新城分校',                            // 无独立招生代码/统招计划
  '无锡市-江阴市要塞中学'                                     // 江阴考试中心代码不公开·查无可靠统招线
];

// 结构性/已核实查无高考成果的市·区重点高中（经抽查确认，非数据缺口）——加入白名单以免每日空跑。
// 来源：2026-10-15 P1 key-school-outcome 批，4 组并行 research 后确认无公开可录入高考数字（网传汇总缺失或新办无毕业生）。
// 其中 3 所为结构性无数据（新校区/分校区无独立高考口径）：南师附中晓庄校区、南师附中科学高中（2026新办无毕业生）、江浦文昌校区（分校区无独立数据）。
// 其余 7 所（临江/六合实验/六合程桥/秦淮·仅美术班/十四中/栖霞/溧水三中）为已核实网传汇总缺失；若后续官方喜报出现可移除此名单。
const OUTCOME_NO_DATA_KNOWN = [
  '江宁区-临江高级中学',
  '六合区-六合区实验高级中学',
  '六合区-六合区程桥高级中学',
  '江宁区-南京市秦淮中学',
  '江北新区-南京市第十四中学',
  '栖霞区-南京师范大学附属中学（晓庄校区）',
  '鼓楼区-南京师范大学附属中学科学高中',
  '栖霞区-栖霞中学',
  '浦口区-江浦高级中学文昌校区',
  '溧水区-溧水区第三高级中学'
  // —— 2026-10-16 P1 key-school-outcome 批追加（经 4 组并行 research 确认查无公开可录入高考数字）——
  // 结构性/永久无独立数据：
  ,'溧水区-溧水区第二高级中学'                 // 网传汇总缺失（仅达线率提升百分点/考生人数，无分数段喜报）
  ,'高淳区-高淳区淳辉高级中学'                 // 网传汇总缺失（同溧水二高口径）
  ,'嘉定区-上海市延安中学新城分校'             // 校名疑似占位/错误（延安本部在长宁，嘉定"新城"实为上师大嘉定新城分校），无独立数据
  ,'吴江区-震泽中学示范校区'                   // 校区无独立喜报，数据并入震泽中学本部/育英校区
  ,'吴江区-吴江区实验中学'                     // 检索到的"实验中学"高考数据均属苏州实验中学（高新区）或外地同名校，无法确认
  ,'无锡市-宜兴市官林中学'                     // 宜兴片区：综评未单列、无校方喜报，自媒体本一/本科率非白名单指标未录入
  // 新校暂未毕业（将产于 2027-2029，数据出现后可移除此名单）：
  ,'徐汇区-上海市位育附属徐汇科技实验中学'     // 2025 新办·无毕业生
  ,'浦东新区-上海市浦东临港科技高级中学'       // 2026 新办·无毕业生
  ,'嘉定区-上海师范大学附属中学嘉定新城分校'   // 2025 首届·2028 首考
  ,'松江区-上海师范大学附属中学松江分校'       // 2025 首届·2028 首考
  ,'青浦区-上海师范大学附属青浦实验中学'       // 高中部 2026 首届
  ,'金山区-华东师范大学第二附属中学金山实验学校' // 2026 才首招高中·2029 首考
  ,'浦东新区-华东师范大学附属浦东临港高级中学' // 2025 首届·2028 首考
  ,'浦东新区-华东理工大学附属浦东科技高级中学' // 2024 首届·2027 首考
  ,'太仓市-太仓市明德高级中学常州路校区'       // 2026 新增校区·首年招生
  ,'张家港市-张家港市沙洲中学北校区'           // 2022 启用·与本部一体管理，无北校区独立喜报
  // 2026-10-18 P1 key-school-outcome（江阴批次）追加：
  ,'无锡市-江阴市祝塘中学'                     // 江阴片区：未出现在无锡2022-2024各高中综评统计名单、查无校方/官方高考喜报，结构性无可靠高考数字（网传汇总不可信未录入）
];

(async () => {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, channelBinding: 'disable', keepAlive: true });
  await c.connect();
  const tasks = [];
  const push = (priority, direction, city, desc, count, query, script) => tasks.push({ priority, direction, city, desc, count, sampleQuery: query, script });

  // ---------- P0：上线门槛类 ----------
  // P0-1 市/区重点高中缺 content（四城通用）
  push('P0', 'key-school-content', 'all', '市/区重点高中缺 content（上线门槛）', null,
    `SELECT region, slug, name, district_name, school_key_level FROM schools
      WHERE school_stage_label IN ('高中','完全中学') AND school_key_level IN ('市重点(高中)','区重点(高中)')
        AND COALESCE(jsonb_array_length(content),0)=0 ORDER BY region, name LIMIT ${BATCH}`);

  // P0-2 市/区重点高中缺当年(2026)统招线（排除结构性无统招线白名单）
  const noLineExcl = NO_LINE_KNOWN.map(s => `'${s.replace(/'/g,"''")}'`).join(',');
  push('P0', 'key-school-2026-line', 'all', '市/区重点高中缺 2026 统招线', null,
    `SELECT region, slug, name, district_name FROM schools
      WHERE school_stage_label IN ('高中','完全中学') AND school_key_level IN ('市重点(高中)','区重点(高中)')
        AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(score_lines,'[]'::jsonb)) l WHERE l->>'year'='2026')
        AND slug NOT IN (${noLineExcl})
      ORDER BY region, name LIMIT ${BATCH}`);

  // 结构性/已核实查无上海中招招生代码（经 2026-10-23 sh-code 批抽查确认，非数据缺口）——加入白名单以免每日空跑。
  // 来源：4 组并行 research（上海招考热线 shmeea.edu.cn 国际课程班招生计划 PDF / 各区1-15志愿统招分数线 / 学校官微）确认以下校
  // 不参加上海中考统一招生（自主招生国际课程中心 / 外籍人士子弟学校 / 台商子弟学校 / 新校高中部未开办 / 实为初中建制）：
  const SH_CODE_NO_DATA_KNOWN = [
    '虹口区-上外立泰剑桥'                       // 上外贤达立泰国际课程中心·自主招生无中招代码
    ,'虹口区-上外贤达贤德国际课程中心'           // 国际课程中心·自主招生无中招代码
    ,'浦东新区-上海光华剑桥'                     // 光华剑桥(剑桥国际中心)·自主招生无中招代码
    ,'虹口区-上海博华美国高中'                   // 博华中美国际高中·自主招生无中招代码
    ,'闵行区-上海台商子女学校'                   // 台商子弟学校·台湾学制不参加上海中招
    ,'嘉定区-上海市延安中学新城分校'             // 实为一处初中建制·无独立中招代码（NO_LINE_KNOWN 已列，此处双保险）
    ,'闵行区-上海市民办万源城协和双语学校'       // 协和万源高中部未入市教委"21所"国际课程班·无中招代码
    ,'浦东新区-上海市民办中芯学校（高中部）'     // 中芯高中部完全自主招生·无中招代码
    ,'虹口区-上海市民办克勒外国语学校'           // 克勒高中部国际课程·自主招生无中招代码
    ,'黄浦区-上海市民办成才综合高中'             // 浦东属综合高中试点·自主招生·未入2026高中招生名单（DB区属黄浦存疑待核）
    ,'嘉定区-上海市民办融育学校'                 // 融育国际学校·未入2026"21所"·自主招生无中招代码
    ,'虹口区-上海市民办迅行中学（初中部）'       // 迅行为初中强校·不作为中招高中招生学校
    ,'普陀区-上海师范大学附属普陀科技学校'       // 2026新筹建校·高中部尚未开办无中招代码
    ,'金山区-上海市金山区朱泾中学'               // 未入市考试院2025/2026高中招生学校名单·招生状态疑似调整·待人工核查DB记录
    // —— 以下经 2026-10-24 sh-code 批抽查确认（上海招考热线 shmeea.edu.cn 国际课程班招生计划 PDF / 各区1-15志愿统招分数线官方表 / 学校官微）：
    // 均为自主招生国际课程校或初中建制，不参加上海中考1至15志愿统一招生，无在用高中中招招生代码（结构性查无，非数据缺口）
    ,'黄浦区-上海康德双语实验学校'               // 十二年一贯制双语·高中A-Level/IGCSE自主招生·未入黄浦1-15志愿统招表（016005为初中生源校代码）
    ,'浦东新区-上海戏剧学院附属浦东实验中学'     // 实验中学·未入浦东1-15志愿统招表（069004艺术班为不同实体）
    ,'长宁区-上海民办包玉刚实验学校（初中部）'   // 初中部建制·高中部(松江175021)另录·本初中部无高中中招代码
    ,'徐汇区-上海民办南模中学'                   // 民办完中·高中BC/A-Level自主招生·未入徐汇1-15志愿统招表
    ,'浦东新区-上海民办启能东方外国语学校'       // 十五年一贯制国际化·高中双语课程部自主招生·未入浦东1-15志愿统招表
    ,'闵行区-上海美高双语学校（高中部）'         // 美高AP/IGCSE+A-Level自主招生·无统招代码（与下条同校双记录）
    ,'闵行区-上海闵行区民办美高双语学校'         // 即美高双语高中部实体·同校双记录·无统招代码
    ,'闵行区-上海闵行区汇点高中'                 // 文绮中学国际部·汇点美高·自主招生·无统招代码
    ,'浦东新区-上海领科教育上海校区'             // 领科国际课程中心实体·与松江领科双语(174013)不同记录·无统招代码
    ,'浦东新区-协和浦东三林校区'                 // 协和三林校区·高中国际课程班自主招生·未入浦东1-15志愿统招表
  ];

  // ---------- P1W：弱市攻坚类（2026-10-29 新增，质量审计驱动） ----------
  // 弱市优先排序：无锡 > 苏州 > 南京 > 上海（上海基本无弱项）
  const WEAK_CITY_ORDER = `CASE region WHEN 'wuxi' THEN 0 WHEN 'suzhou' THEN 1 WHEN 'nanjing' THEN 2 ELSE 3 END`;

  // P1W-1 一般高中/完中缺 2026 统招线（排除外籍/中外合作——自主招生无统招线属结构性；
  //        剩余民办自招校研究后如确认查无，回填 NO_LINE_GENERAL_KNOWN 白名单）
  // 排除已知自招/无独立统招校（来源：2026-10-29 四城审计，上海 60 所缺线校逐名单核）：
  const NO_LINE_GENERAL_KNOWN = [
    // —— 上海：民办自招/国际课程班/综合高中试点（自主招生，无统一投档线，结构性）——
    '闵行区-上海市民办万源城协和双语学校',      // 协和万源·自主招生（SH_CODE_NO_DATA_KNOWN 同源）
    '浦东新区-上海市民办中芯学校（高中部）',    // 中芯高中部完全自主招生
    '徐汇区-上海民办位育中学',                  // 民办位育国际课程自主招生
    '徐汇区-上海民办南模中学',                  // BC/A-Level 自主招生
    '浦东新区-上海民办启能东方外国语学校',      // 国际化自主招生
    '虹口区-上海市民办克勒外国语学校',          // 国际课程自主招生
    '浦东新区-上海光华剑桥',                    // 剑桥国际中心
    '黄浦区-上海市民办成才综合高中',            // 综合高中试点
    '普陀区-上海师范大学附属普陀科技学校',      // 2026 新筹建·高中部未开办
    '闵行区-上海市民办上实剑桥外国语中学',      // 上实剑桥国际课程自主招生
    '浦东新区-上海领科教育上海校区',            // 领科国际课程中心
    '浦东新区-协和浦东三林校区',                // 协和三林国际课程班
    '闵行区-上海闵行区汇点高中',                // 汇点美高自主招生
    '闵行区-上海美高双语学校（高中部）',        // 美高自主招生
    '闵行区-上海闵行区民办美高双语学校',        // 同校双记录
    '金山区-上海市金山区朱泾中学',              // 招生状态疑似调整·待人工核查
    '长宁区-上海民办包玉刚实验学校（初中部）',  // 初中部建制误标高中
    '金山区-上海市第二体育运动学校（上海市体育中学）', // 体育校·无统招线
    // —— 苏州：国际化/民办自招（2026-10-29 审计确认 33 所中 32 所为国际化学校）——
    '太仓市-太仓市西浦附属实验学校',
    '张家港市-张家港市常青藤实验学校',
    '常熟市-中国常熟世界联合学院',
    '常熟市-常熟市苏常外国语学校',
    '常熟市-常熟康桥学校',
    '昆山市-昆山昆城外国语学校',
    '昆山市-昆山澄峰高级中学',
    '昆山市-昆山狄邦华曜学校',
    '相城区-苏州市相城区美高学校',
    '工业园区-苏州工业园区开放大学附属综合高中',
    '工业园区-苏州工业园区德威联合书院',
    '工业园区-苏州工业园区领科高级中学',
    '工业园区-苏州工业园区外国语学校',
    '工业园区-苏州工业园区海归人才子女学校',
    '姑苏区-苏州外国语学校（高中部）',
    '虎丘区-苏州科技城外国语高级中学',
    '相城区-苏州北美国际高级中学',
    '相城区-苏州市相城区山峰学校',
    '相城区-南京师范大学苏州实验学校',
    '相城区-苏州市相城区诺德学校',
    '相城区-苏州市相城区苏城外国语学校',
    '相城区-苏州阿德科特学校',
    '常熟市-常熟市伦华高级中学',
    '常熟市-常熟市昆承湖外国语学校',
    '常熟市-常熟世华高级中学',
    '张家港市-张家港市外国语学校',
    '昆山市-昆山礼仁外国语学校',
    '昆山市-昆山美华学校',
    '吴中区-苏州外国语学校吴中校区',
    '常熟市-常熟UWC艺术高中'                    // 同 UWC 体系（若 slug 名不同以库内为准，DRY 阶段过滤）
    // —— 2026-10-30 P1W senior-2026-line-weak 无锡批：经 12 次 WebSearch 交叉核验，以下无锡一般高中查无市考试院2026第二批次官方统招线（仅第三方"参考"估算，依红线未入库）；
    //    公办新校/无独立线者结构性无公开线。为防每日空跑（与上海/苏州民办自招校同机制）回填白名单。若后续官方二批表/新校首考数据出现可移除此名单。
    ,'无锡市-无锡市第一中学经开分校'             // 2026 首届招生公办新校（过渡办学），查无市考试院公开 2026 统招投档线（未入第一批次一/二/三阶段官方表）
    ,'无锡市-宜兴市周铁中学'                     // 不在宜兴市2026中招公告(三)统招名单（仅"宜兴一中周铁分校"在榜613.5），查无独立 2026 统招线
    ,'无锡市-无锡先锋高级中学'                   // 无锡民办·查无市考试院2026第二批次官方统招线（第三方参考约560，非官方未入库）
    ,'无锡市-无锡光华学校（高中部）'             // 无锡民办·同上（第三方参考约502，非官方未入库）
    ,'无锡市-无锡外国语学校（高中部）'           // 无锡民办·同上（第三方参考约582，非官方未入库）
    ,'无锡市-无锡市匡园双语学校（高中部）'       // 无锡民办双语·同上（查无可靠公开参考线，非官方未入库）
    ,'无锡市-无锡市华天双语学校（高中部）'       // 无锡民办双语·同上（第三方参考约582，非官方未入库）
    ,'无锡市-无锡市大桥实验学校（高中部）'       // 无锡民办标杆·同上（第三方参考约680，非官方未入库）
    ,'无锡市-无锡市运河实验中学'                 // 无锡民办·同上（第三方参考约575，非官方未入库）
    ,'无锡市-无锡市锡南实验中学'                 // 无锡民办·同上（第三方参考约510，非官方未入库）
    ,'无锡市-无锡狄邦文理学校（惠山校区）（高中部）' // 无锡民办国际课程(IB/A-Level)·同上（第三方参考约582，非官方未入库）
    ,'无锡市-无锡狄邦文理学校（高中部）'         // 无锡民办国际课程(IB/A-Level)·同上（第三方参考约582，非官方未入库）
    ,'无锡市-无锡金榜高级中学'                   // 无锡民办(2025新办)·同上（第三方参考约500+，非官方未入库）
  ];
  const noLineGenExcl = NO_LINE_GENERAL_KNOWN.map(s => `'${s.replace(/'/g, "''")}'`).join(',');
  push('P1W', 'senior-2026-line-weak', 'all', '一般高中缺 2026 统招线（弱市优先，排除外籍/中外合作/已知自招校）', null,
    `SELECT region, slug, name, district_name FROM schools
      WHERE school_stage_label IN ('高中','完全中学')
        AND school_property_label IN ('公办','民办')
        AND slug NOT IN (${noLineGenExcl})
        AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(score_lines,'[]'::jsonb)) l WHERE l->>'year'='2026')
      ORDER BY ${WEAK_CITY_ORDER}, name LIMIT ${BATCH}`);

  // P1W-2 初中 content 薄/空攻坚（苏州 263 薄 → 无锡 46 空 → 南京 67 薄 → 上海 0）
  //        薄 = blocks 1-3（吴江 39 字模板段）；空 = 0 块（无锡初中骨架）
  push('P1W', 'junior-content-weak', 'all', '初中 content 薄/空攻坚（弱市优先：苏州薄→无锡空→南京薄）', null,
    `SELECT region, slug, name, district_name FROM schools
      WHERE school_stage_label='初中'
        AND ( COALESCE(jsonb_array_length(content),0)=0
              OR (jsonb_array_length(COALESCE(content,'[]'::jsonb)) BETWEEN 1 AND 3
                  AND COALESCE((SELECT sum(COALESCE(length(b->>'text'), 0) + COALESCE(length(COALESCE(b->>'items','')::text), 0)) FROM jsonb_array_elements(COALESCE(content,'[]'::jsonb)) b),0) < 120) )
      ORDER BY ${WEAK_CITY_ORDER}, region, name LIMIT ${BATCH}`);

  // P1W-3 建校年份缺失（弱市优先；上海已全量）
  push('P1W', 'founding-year-weak', 'all', '建校年份缺失（弱市优先）', null,
    `SELECT region, slug, name, district_name FROM schools
      WHERE founding_year IS NULL
      ORDER BY ${WEAK_CITY_ORDER}, region, name LIMIT ${BATCH}`);

  // ---------- P1：深度数据类 ----------
  // P1-1 头部校缺 outcome（市/区重点高中）；排除已核实查无高考成果的校（OUTCOME_NO_DATA_KNOWN）
  const outcomeExcl = OUTCOME_NO_DATA_KNOWN.map(s => `'${s.replace(/'/g, "''")}'`).join(',');
  push('P1', 'key-school-outcome', 'all', '市/区重点高中缺高考成果(outcome)', null,
    `SELECT region, slug, name, district_name FROM schools
      WHERE school_stage_label IN ('高中','完全中学') AND school_key_level IN ('市重点(高中)','区重点(高中)')
        AND COALESCE(jsonb_array_length(outcome_stats),0)=0
        AND slug NOT IN (${outcomeExcl})
      ORDER BY region, name LIMIT ${BATCH}`);

  // 结构性/已核实查无历史年份线（经抽查确认，非数据缺口）——加入白名单以免每日空跑。
  // 来源：2026-10-19 P1 key-school-history-lines 批，确认以下校为 2025 首届/首年招生，仅有 2025/2026 线，
  // 不存在 2023/2024 历史统招线（与 OUTCOME_NO_DATA_KNOWN 中同 slug 条目口径一致）。
  const HISTORY_NO_DATA_KNOWN = [
    '徐汇区-上海市位育附属徐汇科技实验中学',   // 2025 新办·无 2023/2024 线
    '嘉定区-上海师范大学附属中学嘉定新城分校', // 2025 首届·无历史线
    '松江区-上海师范大学附属中学松江分校',     // 2025 首届·无历史线
    '浦东新区-华东师范大学附属浦东临港高级中学', // 2025 首届·无历史线
    '栖霞区-南京师范大学附属中学（晓庄校区）'  // 晓庄校区 2025 年起独立投档线，2023/2024 并入南师附中本部无独立线
  ];

  // P1-2 头部校历史年份线不足 3 年（排除结构性无统招线 + 仅有 2026 线的新校/首年招生校——
  // 后者不存在 2023/2024/2025 历史线，补充无意义且会每日空跑，与 2026-line/outcome 白名单同机制）
  const histNoLineExcl = [...NO_LINE_KNOWN, ...HISTORY_NO_DATA_KNOWN].map(s => `'${s.replace(/'/g, "''")}'`).join(',');
  push('P1', 'key-school-history-lines', 'all', '头部校分数线年份 <3 年（补历史年份）', null,
    `SELECT region, slug, name,
            (SELECT count(DISTINCT l->>'year') FROM jsonb_array_elements(COALESCE(score_lines,'[]'::jsonb)) l) AS year_count
      FROM schools
      WHERE school_stage_label IN ('高中','完全中学') AND school_key_level IN ('市重点(高中)','区重点(高中)')
        AND (SELECT count(DISTINCT l->>'year') FROM jsonb_array_elements(COALESCE(score_lines,'[]'::jsonb)) l) < 3
        AND slug NOT IN (${histNoLineExcl})
        AND EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(score_lines,'[]'::jsonb)) l WHERE (l->>'year')::int <= 2025)
      ORDER BY year_count ASC, region, name LIMIT ${BATCH}`);

  // P1-3 无锡初中头部 level 校准（特定名单）
  push('P1', 'wuxi-junior-level', 'wuxi', '无锡初中头部/民办 level 校准（只改 level）', null,
    `SELECT slug, name, school_property_label AS prop FROM schools
      WHERE region='wuxi' AND school_stage_label='初中' AND school_key_level='一般初中'
        AND (name ~ '大桥|金桥|外国语|狄邦|协和|匡园|育才|光华|锡南|先锋|侨育|江南中学|东林|积余')
      ORDER BY name LIMIT ${BATCH}`);

  // P1-4 上海高中缺招生代码（排除结构性查无中招代码白名单 SH_CODE_NO_DATA_KNOWN）
  const shCodeExcl = SH_CODE_NO_DATA_KNOWN.map(s => `'${s.replace(/'/g, "''")}'`).join(',');
  push('P1', 'sh-code', 'shanghai', '上海高中缺招生代码', null,
    `SELECT slug, name, district_name FROM schools
      WHERE region='shanghai' AND school_stage_label IN ('高中','完全中学')
        AND school_property_label IN ('公办','民办') AND COALESCE(admission_info->>'code','')=''
        AND slug NOT IN (${shCodeExcl})
      ORDER BY name LIMIT ${BATCH}`);

  // ---------- P2：长尾类 ----------
  // P2-1 一般初中缺 content（南京优先——缺口最大且流水线现成）
  push('P2', 'junior-content', 'all', '一般初中缺 content（南京流水线现成优先）', null,
    `SELECT region, slug, name, district_name FROM schools
      WHERE school_stage_label='初中' AND school_key_level='一般初中' AND COALESCE(jsonb_array_length(content),0)=0
      ORDER BY CASE region WHEN 'nanjing' THEN 0 ELSE 1 END, region, name LIMIT ${BATCH}`);

  // P2-2 一般高中缺 content
  push('P2', 'senior-content', 'all', '一般高中缺 content', null,
    `SELECT region, slug, name, district_name FROM schools
      WHERE school_stage_label IN ('高中','完全中学') AND school_key_level IN ('一般高中','区重点(高中)') AND COALESCE(jsonb_array_length(content),0)=0
      ORDER BY region, name LIMIT ${BATCH}`);

  // ---------- 评估各方向余量 ----------
  console.log('===== 每日任务分配（数据总览驱动） =====\n');
  for (const t of tasks) {
    try {
      const { rows } = await c.query(t.sampleQuery);
      t.count = rows.length;
      t.sample = rows.slice(0, BATCH).map(r => r.slug || r.name);
    } catch (e) {
      t.count = -1; t.error = e.message;
    }
  }

  // 取优先级最高且有余量的方向作为今日主任务
  const active = tasks.find(t => t.count > 0);
  const today = {
    generatedAt: new Date().toISOString(),
    batch: BATCH,
    todayTask: active ? { priority: active.priority, direction: active.direction, city: active.city, desc: active.desc, remaining: active.count, sample: active.sample } : null,
    allDirections: tasks.map(t => ({ priority: t.priority, direction: t.direction, city: t.city, desc: t.desc, remaining: t.count })),
    notes: [
      '执行完今日批次后：1) 重跑 node tmp/full-city-overview.cjs 刷新总览报告；2) 在 automation memory 追加批次记录。',
      '研究稿格式与红线见 automation prompt（严禁编造/自媒体口径不写 outcome/无锡片区标注/复合键只增不覆盖）。',
    ],
  };

  // ---------- 高校线联动（2026-10-30 新增） ----------
  // 同一脚本出口里跑高校分配器，把结果合并进 daily-task-today.json 的 universityTask。
  // 高校线方法论见 docs/new-city-playbook.md 附录；执行用 apply-universities-batch.cjs。
  let university = null;
  try {
    const { execSync } = require('child_process');
    execSync(`NODE_OPTIONS= node ${path.resolve(__dirname, 'generate-university-task.cjs')}`, { stdio: 'inherit', env: process.env });
    university = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'university-task-today.json'), 'utf8'));
    today.universityTask = university.todayTask;
    today.universityTagStats = university.tagStats;
    today.universityAllDirections = university.allDirections;
    today.notes.push('高校线：按 universityTask 执行（10 所/批），研究稿 tmp/universities-{direction}-{MMDD}.json，写库 node tmp/apply-universities-batch.cjs --research=... DRY → --exec。方法论见 docs/new-city-playbook.md 附录。');
  } catch (e) {
    today.universityTask = null;
    today.universityError = e.message;
    console.error('高校分配器失败（不影响初高中线）:', e.message);
  }

  const outFile = path.resolve(__dirname, 'daily-task-today.json');
  fs.writeFileSync(outFile, JSON.stringify(today, null, 2));
  console.log(`今日主任务: ${today.todayTask ? `[${today.todayTask.priority}] ${today.todayTask.direction} (${today.todayTask.city}) 剩余 ${today.todayTask.remaining}` : '全部清零 → 维护模式'}`);
  console.log(`今日高校任务: ${today.universityTask ? `[${today.universityTask.priority}] ${today.universityTask.direction} 剩余 ${today.universityTask.remaining}` : '高校清零或分配器不可用'}`);
  console.log('\n全部方向余量:');
  for (const t of tasks) console.log(`  [${t.priority}] ${t.direction.padEnd(26)} ${String(t.count).padStart(5)} — ${t.desc}`);
  console.log('\n已写 ' + outFile);
  await c.end();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
