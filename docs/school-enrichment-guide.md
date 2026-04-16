# 学校详情补充指南

## 📋 功能说明

新增了 3 个脚本来补充学校详情信息：

| 脚本 | 用途 | 说明 |
|------|------|------|
| `crawl:school-enrich` | 搜索并抓取学校官网、电话、地址 | 通过百度搜索 + 官网抓取 |
| `crawl:school-enrich:dry` | 预演模式（不写文件） | 测试用，默认 10 所 |
| `data:schools:merge` | 合并补充数据到主数据 | 将 enrichment 数据合并到 schools.json |

## 🚀 快速开始

### 1. 预演模式（推荐先测试）

```bash
# 测试 10 所学校，不写文件
npm run crawl:school-enrich:dry
```

### 2. 小批量运行

```bash
# 补充前 20 所学校
ENRICH_LIMIT=20 npm run crawl:school-enrich
```

### 3. 全量运行

```bash
# 补充所有缺少信息的学校（约 700+ 所）
npm run crawl:school-enrich
```

### 4. 合并数据

```bash
# 将补充信息合并到 data/schools.json
npm run data:schools:merge
```

### 5. 验证数据

```bash
# 查看数据覆盖率
npm run data:schools:validate
```

## ⚙️ 参数说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ENRICH_LIMIT` | 本次处理学校数 | 50 |
| `ENRICH_START` | 起始位置 | 0 |

### 命令行参数

| 参数 | 说明 |
|------|------|
| `--dry-run` | 预演模式，不写文件 |
| `--force-website` | 即使已有官网也重新抓取 |
| `--force-phone` | 即使已有电话也重新搜索 |

## 📊 数据流程

```
data/schools.json
  ↓
crawler/src/crawlers/school-enrichment.js
  ↓ (百度搜索 + 官网抓取)
crawler/data/raw/school-enrichment.json
  ↓
crawler/src/merge-school-data.js
  ↓
data/schools.json (更新后)
```

## 📈 预期效果

| 指标 | 当前 | 预期 |
|------|------|------|
| 有官网 | 91 所 (10%) | 300+ 所 (35%+) |
| 有电话 | 159 所 (18%) | 500+ 所 (60%+) |
| 有地址 | ~250 所 (28%) | 700+ 所 (80%+) |
| 详细档案 | 7 所 (1%) | 500+ 所 (60%+) |

## ⚠️ 注意事项

1. **搜索频率**：脚本内置随机延迟（2-4 秒），避免被百度封禁
2. **数据质量**：搜索结果可能包含不准确信息，建议后续人工校验
3. **运行时间**：全量运行预计 3-5 小时（取决于网络状况）
4. **断点续跑**：支持 `ENRICH_START` 参数，可分段运行

## 🔄 完整工作流

```bash
# 1. 预演测试
npm run crawl:school-enrich:dry

# 2. 小批量测试（20 所）
ENRICH_LIMIT=20 npm run crawl:school-enrich

# 3. 检查测试结果
npm run data:schools:validate

# 4. 确认无误后，分批运行（每次 100 所）
ENRICH_LIMIT=100 ENRICH_START=0 npm run crawl:school-enrich
ENRICH_LIMIT=100 ENRICH_START=100 npm run crawl:school-enrich
ENRICH_LIMIT=100 ENRICH_START=200 npm run crawl:school-enrich

# 5. 合并数据
npm run data:schools:merge

# 6. 最终验证
npm run data:schools:validate

# 7. 重新生成 Markdown
npm run data:schools:markdown
```

## 🐛 故障排除

### 搜索失败
- 检查网络连接
- 检查是否被百度暂时封禁（等待 10 分钟后重试）

### 数据合并问题
- 运行 `npm run data:validate` 检查数据格式
- 查看 `crawler/data/raw/school-enrichment.json` 确认数据已生成

### 运行时间过长
- 减少 `ENRICH_LIMIT` 分批运行
- 检查网络延迟
