# SEO 与 GEO 优化方案

## 现状
- metadata 基础有（layout.js + 10 页导出），但 **twitter card 类型错误**（`summary_large_name` 应为 `summary_large_image`）
- 无 **metadataBase** / **canonical** / **OG image**
- JSON-LD：首页 WebSite、news ItemList、news/[id] NewsArticle、schools/[id] School、schools/district ItemList
- **无 llms.txt**（GEO 缺失，AI 搜索引擎无法快速概览站点）
- policy-faq 无 FAQPage（FAQ 内容最适合）、knowledge 页无 metadata、专题页无 JSON-LD
- 域名 kaonaqu.xyz，sitemap.xml + baidu_urls.txt + robots.txt 齐全

## P0（高收益低风险）
1. **layout.js metadata 修复**
   - twitter card `summary_large_name` → `summary_large_image`
   - 加 `metadataBase: new URL('https://kaonaqu.xyz')`
   - 加默认 `openGraph.images`（用现有 public/school-images 中一张，或留空数组）
   - 加 `alternates.canonical` 默认（首页）
2. **新建 public/llms.txt**（GEO 核心）
   - 按 llms.txt 规范：`# 站点名` + `> 描述` + `## 板块` + 链接列表
   - 列出首页/新闻/学校/知识/四大专题入口 + 招生日程
   - 帮助 ChatGPT/Perplexity 等 AI 搜索引擎理解站点结构与核心内容
3. **policy-faq 加 FAQPage JSON-LD**
   - 把现有问答数据映射为 schema.org/FAQPage（mainEntity + Question + acceptedAnswer）
   - FAQ 内容是 AI 摘要的高价值结构化数据
4. **首页加 Organization JSON-LD**
   - 补充 WebSite 旁的 Organization（name/url/logo/sameAs），增强实体识别

## P1（中收益）
5. **各页 canonical**：layout 默认 + 各专题/详情页覆盖 `alternates.canonical`
6. **knowledge/[[...slug]] 加 metadata + Article JSON-LD**：当前完全无 metadata，是 SEO 盲区
7. **专题页（zhongkao/gaokao/sports-reform）加 CollectionPage JSON-LD**
8. **NewsArticle image 填充**：当前 `image: []`，填学校图或默认图

## 不做
- 不改 sitemap.xml / robots.txt（已齐全，seo:build 脚本生成）
- 不新增 OG 图片资源（无现成品牌图，建议后续补）
- 不改业务逻辑

## 验证
- `npm run dev` + curl 各页确认 200
- curl 首页/news/policy-faq 检查 JSON-LD 输出
- `node --test tests/*.test.mjs`
- `npm run data:validate`

## 工作量
- 涉及 app/layout.js + app/page.js + app/news/policy-faq + knowledge + 专题页
- 新建 public/llms.txt
- 约 8 文件，纯增量为主，风险低
