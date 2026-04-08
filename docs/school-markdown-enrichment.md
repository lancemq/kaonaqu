# 学校详情 Markdown 补全说明

统一入口脚本：

- `scripts/enrich-school-markdown-unified.mjs`

该脚本用于批量刷新学校详情 markdown，覆盖：

- 学校概览
- 历史沿革（公开资料）
- 办学特色（公开资料）
- 课程与培养路径解读
- 招生与路径
- 培养方向
- 阅读提示

## 常用命令

全量刷新（默认不包含 `priority`）：

```bash
node scripts/enrich-school-markdown-unified.mjs
```

按区县刷新：

```bash
node scripts/enrich-school-markdown-unified.mjs --districts pudong,xuhui,yangpu
```

按区县并限制数量：

```bash
node scripts/enrich-school-markdown-unified.mjs --districts jingan,changning,minhang --limit 50
```

包含 `priority` 学校：

```bash
node scripts/enrich-school-markdown-unified.mjs --include-priority
```

仅预览，不写入文件：

```bash
node scripts/enrich-school-markdown-unified.mjs --districts baoshan,fengxian --dry-run
```

## 参数说明

- `--districts`：逗号分隔的 `districtId` 列表（如 `pudong,xuhui`）
- `--include-priority`：默认会跳过 `profileDepth=priority`，加此参数后会包含
- `--limit`：限制处理条数
- `--dry-run`：只输出计划处理对象，不写入 markdown

## 建议流程

1. 先 `--dry-run` 看范围是否正确。
2. 再执行正式命令写入。
3. 最后运行数据校验：

```bash
node scripts/check-school-enrichment.mjs
node scripts/validate-data.js
```
