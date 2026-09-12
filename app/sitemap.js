import { buildAllUrls } from '../lib/sitemap-urls.mjs';

// sitemap.xml：URL 清单由 lib/sitemap-urls.mjs 活生成（与 llms.txt / baidu_urls.txt 同源）。
export default async function sitemap() {
  const { urls } = await buildAllUrls();
  return urls;
}
