import { buildAllUrls } from '../lib/sitemap-urls.mjs';

// sitemap.xml：URL 清单由 lib/sitemap-urls.mjs 活生成（与 llms.txt / baidu_urls.txt 同源）。
// revalidate 3600：爬虫高频抓取下 1 小时内复用 Route Cache，不再每次请求全量跑函数。
export const revalidate = 21600;

export default async function sitemap() {
  const { urls } = await buildAllUrls();
  // Next 16 的 sitemap 字段名是 lastModified / changeFrequency（不是协议原名）。
  // 旧代码用 lastmod / changefreq，两个字段都被序列化器吞掉，线上只剩 loc + priority。
  // kind 是 llms.txt 的内部分类标记，不透出。
  return urls.map(({ url, lastmod, changefreq, priority }) => ({
    url,
    ...(lastmod ? { lastModified: lastmod } : {}),
    changeFrequency: changefreq,
    priority
  }));
}
