import { buildAllUrls } from '../lib/sitemap-urls.mjs';

// sitemap.xml：URL 清单由 lib/sitemap-urls.mjs 活生成（与 llms.txt / baidu_urls.txt 同源）。
// revalidate 3600：爬虫高频抓取下 1 小时内复用 Route Cache，不再每次请求全量跑函数。
export const revalidate = 3600;

export default async function sitemap() {
  const { urls } = await buildAllUrls();
  return urls;
}
