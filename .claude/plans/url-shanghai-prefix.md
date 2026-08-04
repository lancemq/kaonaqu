# URL 统一带 /shanghai/ 前缀

## 目标
所有地区（含上海）URL 统一带 `/{region}/` 前缀。上海从无前缀（`/schools`）改为 `/shanghai/schools`。旧无前缀 URL 由 middleware 308 永久重定向到 `/shanghai/...`（传递 SEO 权重）。内部导航用 RegionLink 组件自动加前缀，零 301。

## 改动文件

### 1. 新建 `shared/region-path.mjs`（ESM 零依赖，server/client 共用）
```js
import { DEFAULT_REGION } from './region-list.mjs';
// regionPath('/schools', 'shanghai') -> '/shanghai/schools'
// regionPath('/', 'shanghai') -> '/shanghai'
// 保留 query/hash；非字符串（URL 对象）透传
export function regionPath(path, region = DEFAULT_REGION) { ... }
```

### 2. 新建 `components/region-link.jsx`（client）
```jsx
'use client';
import Link from 'next/link';
import { useRegion } from './region-context';
import { regionPath } from '../shared/region-path.mjs';
export function RegionLink({ href, ...props }) {
  const { region } = useRegion();
  return <Link href={regionPath(href, region)} {...props} />;
}
```
透传所有 Link props（className/aria-label/children 等）。

### 3. `middleware.js` 改：无前缀 308 redirect
- 带前缀 `/{region}/...`（已知地区）：rewrite 到 `/...` + x-region（不变）
- 无前缀 `/schools`、`/`、`/news/xxx` 等：308 redirect 到 `/{DEFAULT_REGION}{pathname}`（保留 query）
- matcher 已排除 api/_next/静态，不受影响

### 4. `components/region-selector.jsx` 改：统一加前缀
- `stripRegionPrefix` 保留（用于计算 base 路径）
- `select`：选任意地区（含上海）都 `router.push(regionPath(base, value))`，不再对上海特殊去前缀

### 5. `app/sitemap.js` 改：URL 加 /shanghai/ 前缀
- knowledge/news 生成 URL：`${BASE}/shanghai/knowledge/...`、`${BASE}/shanghai/news/...`
- sitemap-extra.xml 解析的静态 URL：loc 前插 `/shanghai`

### 6. 全站 `<Link` -> `<RegionLink`（Agent 批量）
- ~220 处（186 Link + 40 href="/" + 自闭合）
- 每文件加 `import { RegionLink } from '<相对路径>/region-link';`，删除不再用的 `import Link from 'next/link'`（若全改）
- `<Link ` -> `<RegionLink `、`</Link>` -> `</RegionLink>`、`<Link ... />` -> `<RegionLink ... />`

### 7. `router.push` 改 regionPath（非 Link 的客户端导航）
- `components/schools-compare-client.js` 3 处（/schools/compare）
- 选择器已用 regionPath（改后统一）
- buildHref/buildNewsHref（分页 helper）返回值经 RegionLink 自动加前缀，不需改

## 验证
- `/` -> 308 -> `/shanghai` -> rewrite `/` + x-region shanghai
- `/schools` -> 308 -> `/shanghai/schools` -> rewrite `/schools` + x-region
- `/shanghai/news/xxx` -> rewrite `/news/xxx` + x-region（正常）
- RegionLink 渲染 `href="/shanghai/schools"` 等
- sitemap URL 含 `/shanghai/`
- build 81 页通过；内部导航无 301（Link prefetch 正常）

## 风险与回滚
- 220 处替换遗漏 -> build 报错或个别链接无前缀；用 grep `href="/[a-z]` 排查残留无前缀 Link
- middleware 308 对 SEO：旧链接权重传递到 /shanghai/，需更新搜索引擎（sitemap 提交）
- 回滚：恢复 middleware 无前缀放行 + RegionLink 改回 Link
