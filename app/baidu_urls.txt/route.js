import { buildAllUrls } from '../../lib/sitemap-urls.mjs';

// baidu_urls.txt（百度站长推送清单）：活生成最终 URL（带 /{region}/ 前缀，无 308 跳转链），
// 替代原手工维护的 public/baidu_urls.txt（旧文件 930 条无前缀 URL 均为跳转链）。
export const fetchCache = 'force-cache';

export async function GET() {
  const { urls } = await buildAllUrls();
  const body = urls.map((u) => u.url).join('\n') + '\n';
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}
