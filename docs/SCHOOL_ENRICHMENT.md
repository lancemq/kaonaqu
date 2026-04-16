# 学校详情补充爬虫 - 使用指南

## ✅ 已完成的脚本

### 1. 学校详情补充爬虫
**文件**: `crawler/src/crawlers/school-enrichment.js`

**功能**:
- 通过百度搜索获取学校官网、电话、地址
- 深度抓取学校官网提取招生信息
- 支持断点续跑和批量处理

### 2. 数据合并脚本
**文件**: `crawler/src/merge-school-data.js`

**功能**:
- 将补充信息合并到主数据文件
- 自动验证数据覆盖率
- 更新 profileDepth 字段

## 🚀 使用方法

### 快速测试（推荐）

```bash
# 进入项目目录
cd /root/project/kaonaqu

# 1. 预演模式 - 测试 3 所学校
node crawler/src/crawlers/school-enrichment.js --dry-run --limit 3

# 2. 小批量运行 - 测试 10 所
ENRICH_LIMIT=10 node crawler/src/crawlers/school-enrichment.js

# 3. 查看结果
cat crawler/data/raw/school-enrichment.json | head -50
```

### 全量运行

```bash
# 分批运行（推荐每次 100 所）
ENRICH_LIMIT=100 ENRICH_START=0 node crawler/src/crawlers/school-enrichment.js
ENRICH_LIMIT=100 ENRICH_START=100 node crawler/src/crawlers/school-enrichment.js
ENRICH_LIMIT=100 ENRICH_START=200 node crawler/src/crawlers/school-enrichment.js
# ... 依此类推

# 合并数据
node crawler/src/merge-school-data.js

# 验证结果
node crawler/src/merge-school-data.js
```

### 使用 npm 脚本

```bash
# 预演
npm run crawl:school-enrich:dry

# 运行
npm run crawl:school-enrich

# 合并
npm run data:schools:merge

# 验证
npm run data:schools:validate
```

## 📊 数据格式

### 补充数据格式 (school-enrichment.json)

```json
{
  "id": "xuhui-上海中学",
  "name": "上海中学",
  "district": "徐汇区",
  "website": "https://www.shs.sh.cn",
  "phone": "021-64789012",
  "address": "上海市徐汇区百色支路 99 号",
  "enrichedAt": "2026-04-13T10:30:00.000Z",
  "source": "search_enrichment"
}
```

## ⚠️ 注意事项

1. **百度搜索频率限制**: 
   - 脚本已内置 2-4 秒随机延迟
   - 如遇 403 错误，等待 10 分钟后重试

2. **网络要求**:
   - 需要能访问百度和学校官网
   - 建议使用稳定的网络连接

3. **数据质量**:
   - 自动抓取的信息可能有不准确
   - 关键学校建议人工复核

4. **运行时间**:
   - 每所学校约 5-10 秒
   - 100 所学校约 10-15 分钟

## 📈 预期效果

运行后，学校数据覆盖率预期：

| 字段 | 当前 | 预期 |
|------|------|------|
| 官网 | 10% | 35%+ |
| 电话 | 18% | 60%+ |
| 地址 | 28% | 80%+ |

## 🔧 故障排除

### 问题 1: 搜索无结果
- 检查网络连接
- 尝试更换搜索关键词

### 问题 2: 官网抓取失败
- 检查官网是否可访问
- 部分学校官网可能有反爬机制

### 问题 3: 运行速度慢
- 正常现象，已设置合理延迟避免被封
- 可调整 `sleep` 时间（不推荐低于 1 秒）

## 📝 完整工作流

```bash
# 1. 测试
node crawler/src/crawlers/school-enrichment.js --dry-run --limit 3

# 2. 小批量
ENRICH_LIMIT=20 node crawler/src/crawlers/school-enrichment.js

# 3. 检查结果
node crawler/src/merge-school-data.js

# 4. 全量（分批）
for i in 0 100 200 300 400 500 600 700 800; do
  ENRICH_LIMIT=100 ENRICH_START=$i node crawler/src/crawlers/school-enrichment.js
done

# 5. 合并
node crawler/src/merge-school-data.js

# 6. 重新生成 Markdown
npm run data:schools:markdown

# 7. 提交代码
git add data/ crawler/
git commit -m "补充学校详情信息"
```
