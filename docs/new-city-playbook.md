# 新城市接入 Playbook

> 从苏州（2026-08）→ 南京（2026-08~09）两城实战提炼的标准流程。第 4 城照此执行，不看历史聊天记录即可复现。
> 前置条件：`reports/add-new-city-plan/prerequisites.md` 中的 P0/P2 门槛已达成（数据硬伤清零、框架 config 驱动、双文件一致性测试常绿）。
> 选城依据：`reports/jiangsu-cities/expansion-evaluation.md`（江苏 T1 = 无锡/南通/常州）。
> 配套脚本（均已存在，复制改 region 即用）：`tmp/select-spotcheck-generic.cjs` / `tmp/apply-spotcheck-generic.cjs`（P3-11 已参数化）。

---

## 总览：8 步 × 验收门槛

| # | 步骤 | 工作量 | 验收门槛 |
|---|------|--------|---------|
| 1 | 制度调研 | 1~2 天 | 调研报告定稿（下方 7 项全有答案） |
| 2 | 配置接入 | 0.5 天 | region-config + region-list 双文件 + 测试绿 |
| 3 | 官方名录建库 | 3~7 天 | 名录数对得上官方文件；零 pinyin-slug 重复 |
| 4 | 历年统招线 | 3~5 天 | 当年线零缺口（上线门槛）；历史线 ≥3 年 |
| 5 | 星级→keyLevel 映射 | 随建库 | 全表 8 值词表无词表外值 |
| 6 | enrichment 批量 | 滚动 | 头部校 content 非空 ≥80% |
| 7 | spotcheck 专项 | 自动化 | 每日轮转跑通，done 文件在累积 |
| 8 | 新闻扩区 + 上线 | 1~2 天 | sitemap/专题页/降级路径全对 |

同一时间只开一城（研究 agent 与 spotcheck 资源有限）。10~12 月选城建库最佳（当年数据已定型）；次年 6~7 月放榜季是每城数据大考。

---

## 第 1 步：制度调研（1~2 天）

产出：一页调研报告，7 个问题全部有答案且注来源。

1. **中考满分**是多少？（⚠️ 江苏各市不同：苏州 740 / 南京 700 / 无锡约 750 / 南通约 760——照搬别市满分会导致 score-match 全部失准）
2. **高考满分**与模式？（江苏省内统一 3+1+2 = 750，无需逐市配）
3. **录取批次**怎么命名？（南京"第一批/第二批次统招平行志愿"；上海"1至15志愿"；批次名决定 score_lines.plan 的写法）
4. **高中分层体系**？（江苏=四星/三星/二星/一星星级评估；直辖市可能是"市重点/区重点"）
5. **初中招生方式**？（对口直升 / 摇号 / 学籍+户籍双重口径——决定初中侧有没有分数线：摇号城市初中 score_lines 一律空数组，勿编造）
6. **官方名录来源**？（市教育局官网义务教育名录 + 普高名单；把 URL 记下来，第 3 步直接用）
7. **特殊机制**？（指标生比例、跨区招生范围分级、民办锁区——写进 admissionInfo.notes 的口径依据）

调研源优先级：市教育局官网 > 市招考院/考试院 > 区教育局 > 本地宝/入学网（仅线索，不入库）。

## 第 2 步：配置接入（0.5 天）

**双文件强约束**——只改一处会被 `tests/region-config.test.mjs` 判红（15 用例含双文件五字段一致性断言）。

1. `shared/region-config.js`：复制 `NANJING` 块改值——`label` / `brandSuffix` / `officialSourceName`（第 1 步第 6 项）/ `examTotal.zhongkao`（第 1 步第 1 项）/ `districtCatalog`（该市区县全表）/ `cohortField`（江苏星级制填 `'schoolStar'`，沪式荣誉制填 `'eliteCohort'`）/ `starSystem`（与 cohortField 配套）/ `features`（首期：schools/district/compare/scoreMatch 开，knowledge/groups 关）/ `newsSpecials`+`specialPages`（首期空数组，第 8 步再建专属专题页）
2. `shared/region-list.mjs`：`KNOWN_REGIONS` 加 region 名 + `REGION_ENTRIES` 加条目（value/label/brandSuffix/brandSuffixFull/examTotal/features 五字段必须与 region-config 逐字一致）
3. `node --test tests/region-config.test.mjs` → 15/15 绿
4. `next build` → 通过

**已知坑**：`app/layout.js` 已 import KNOWN_REGIONS（勿再内联字面量，测试会抓）；`data-store.js` 排序权重已按 region 取，无需改。

## 第 3 步：官方名录建库（3~7 天）

**数据源**：第 1 步记下的官方名录（普高名单 + 义务教育学校名录）。高中全量入库；初中如果摇号/对口为主，只建骨架（level 标注 + 地址，content/scoreLines 留空等 enrichment）。

**脚本范式**：`tmp/build-nanjing-supplement.cjs`（diff 官方名录 vs 库内存量 → 产出 supplement JSON）→ `tmp/import-nanjing-supplement.cjs [--exec]`（createSchoolInSupabase，skip 已存在 slug/同名）→ `tmp/verify-nanjing-supplement.cjs`（读回核对）。

**⚠️ 防 pinyin-slug 重复（南京踩过 18 行的坑）**：slug 一律用「{区名}-{官方校名}」中文格式（如 `江宁区-南京市秦淮中学`），**禁止**用拼音转写（`jiangning-qinhuai-zhongxue` 这种后期清理成本极高）。import 前跑一遍：

```bash
# 扫描器：同 code / 规范化同名双维度查重（已存在）
node tmp/scan-nanjing-duplicates.cjs   # 复制改 REGION
```

**多校区校**：南京官方按校区计（如二十九中锦江/龙江两校区是两条记录、同代码）。建库时跟官方口径走——**同代码多校区是合法建模，不是重复**；真重复是"同校不同 slug"（一个中文 slug + 一个 pinyin slug）。

**已知坑**：
- 代码撞车（两所不同学校挂同一招生代码，如上海青浦世外 184006/青浦二中）→ 处理方式是**摘码**而非合并，notes 写明依据
- 完中学段拆分（初中部/高中部分两条记录，如南外）→ 合法建模，勿合并
- pg 直连 Supabase 必须 `channelBinding: 'disable'`（pg≥8.20 在 pooler 上 EAUTHQUERY 超时）；全量 SELECT 会被掐线，用主键 keyset 分页（`tmp/backup-tables.cjs` 有现成实现）

**验收**：`scan-{city}-duplicates.cjs` 报告 0 真重复；总行数与官方名录一致。

## 第 4 步：历年统招线（3~5 天）

**口径红线**：
- 只存真实统招线（官方分数线表）；民办参考线/国际班线写 admissionInfo.notes，不进 score_lines
- 一律取**本区线**；跨区招生线（如南京面向全市 13 所）在 plan/note 里标注招生范围
- 未录满降分校按考试院《降分公告》实际投档线记录，plan 标 `·未录满`（这是真实口径不是脏数据，南京 2026 民办降分一档）
- 同年多条线（跨区校分片区）用复合键 year+plan+note 共存（generic apply 已支持）

**选批**：`node tmp/select-spotcheck-generic.cjs --region={city}`（权重：缺2026线+40 / 缺2025+50 / 空+60 / 年份<3+20 / 市重点+12 / 四星+6）。

**研究 → 写库**：4 组×5 校并行研究 agent（纪律：严禁编造；查无也是结论写 notes；自媒体 verified:false；metrics 键白名单 qingbei/fuJiaoQB/score600plus/topScore/zongpingTotal/fuJiao）→ **研究稿按批次名单过滤校验**（防 agent 在旧文件上追加污染——南京批 1 D 组踩过）→ `apply-spotcheck-generic.cjs --region={city}` dry-run → `--exec`。

**验收**：当年统招线零缺口（上线门槛）；历史 ≥3 年；`spotcheck-done-{region}.json` 在累积。

## 第 5 步：星级→keyLevel 映射（随建库）

江苏城市直接复制南京映射：`四星→市重点(高中)` / `三星→区重点(高中)` / `未参评→一般高中`；初中头部校按口碑标 顶级/强 公办(初中)/民办(初中)，其余默认 一般初中。

**红线**：DB 词表 8 值固定（带 `(高中)/(初中)` 后缀），词表外值会被一致性测试拒绝且排序权重落 0。

## 第 6 步：enrichment 批量（滚动）

优先级：高中（市重点→区重点→一般）→ 初中头部（强公办/强民办）→ 一般初中骨架。

流水线：`select-{city}-content-batch.cjs`（content=0 排序选批，注意 OFFSET 递进）→ 2×10 校并行研究 agent（纪律：严禁编造，乡镇校查无荣誉就空数组；概览 80~200 字）→ 校验（JSON 可解析 + dbName 与名单一致 + 4 block 结构 + 无 U+FFFD）→ `apply-{city}-content-batch.cjs`（幂等：已有 content 自动跳过）。

## 第 7 步：spotcheck 专项自动化

第 4~6 步手工批跑完后，接入每日轮转。**模板**：`.workbuddy/automations/automation-1784266942235`（每日数据债清理，08:00，四方向轮转 prompt）。

通用脚本已 region 参数化（P3-11）：
```bash
node tmp/select-spotcheck-generic.cjs --region={city}          # 选批
node tmp/apply-spotcheck-generic.cjs --region={city}           # DRY
node tmp/apply-spotcheck-generic.cjs --region={city} --exec    # 写库
```
done 文件按城分文件（`spotcheck-done-{region}.json`），旧专项 done 首跑自动迁移。

## 第 8 步：新闻扩区 + 上线（1~2 天）

1. 新闻自动化（automation-1784168886234）检索脚本按 region 分流，新城市纳入每日生产
2. 专属专题页：复制 `app/news/suzhou-zhongkao/page.js` 范式写该城事实 → config 的 newsSpecials/specialPages 挂上（上海 6 专题已 region 门控，第三城不会串内容）
3. **上线门槛**：`next build` 绿 + 当年统招线零缺口 + sitemap 含该城 schools/district/news URL + 手动巡检 `/{city}/schools`、`/district`、`/news` 无上海内容串入 + 404/重定向监控

---

## 历史坑速查（两城实战全部踩过的）

| 坑 | 后果 | 防法 |
|---|---|---|
| pinyin-slug 与中文 slug 双行 | 南京 18 行清理 | 建库即用中文 slug；scan-duplicates 把关 |
| 中考满分照搬别市 | score-match 全错 | 第 1 步第 1 项必须核实 |
| 同代码多校区被误合并 | 破坏合法建模 | 先判"同校不同 slug"再动手 |
| 代码撞车两所不同校 | 错误合并 | 摘码 + notes 依据，勿合 |
| 研究 agent 在旧文件追加 | 脏数据入库 | apply 前按批次名单过滤（强制步骤） |
| 完中学段拆两条被当重复 | 误删 | 扫描器把"同名不同 stage"列为合法 |
| pg channelBinding 默认值 | 连接超时 | 直连一律 `channelBinding:'disable'` |
| 全量 SELECT 被 pooler 掐线 | 备份/导出中断 | 主键 keyset 分页 |

## 城际差异速记（江苏三城已入库口径）

| 城 | region | 中考满分 | cohort | 已入库 | 特色口径 |
|---|---|---|---|---|---|
| 上海 | shanghai | 750 | eliteCohort + starSystem:false | 816 | 1至15志愿；初中摇号无线 |
| 苏州 | suzhou | 740 | schoolStar + starSystem:true | 385 | 四市六区；指标生 70% |
| 南京 | nanjing | 700 | schoolStar + starSystem:true | 319 | 第一/二批次；招生范围三级（全市13所/原市区/本区）；多校区同代码 |
