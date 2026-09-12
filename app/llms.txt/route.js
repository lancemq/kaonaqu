import { buildAllUrls } from '../../lib/sitemap-urls.mjs';

// llms.txt（AI 爬虫入口，https://llmstxt.org）：活生成，地区/学校数/URL 与站内数据同源，
// 替代原手工维护的 public/llms.txt（已删除）。
export const fetchCache = 'force-cache';

export async function GET() {
  const { base, regions } = await buildAllUrls();

  const lines = [];
  lines.push('# 考哪去');
  lines.push('');
  lines.push('> 面向学生和家长的升学信息平台，聚合中考/高考新闻政策、学校信息、区县专题和初高中知识体系。多地区站点，地区列表见下。');
  lines.push('');
  for (const r of regions) {
    lines.push(`## ${r.label}（${base}/${r.region}）`);
    lines.push('');
    lines.push(`> 收录 ${r.schoolCount} 所初高中学校、${r.newsCount} 条新闻与政策。频道：${[
      r.features.news !== false ? '新闻' : null,
      r.features.schools ? '学校' : null,
      r.features.compare ? '学校对比' : null,
      r.features.knowledge ? '知识体系' : null,
      r.features.district ? '区县专题' : null,
      r.features.scoreMatch ? '估分择校' : null
    ].filter(Boolean).join('、')}。`);
    lines.push('');
    // 频道入口 + 高价值工具页（控制篇幅，不放全量详情 URL）
    for (const u of r.urls.filter((u) => u.priority >= 0.6 && !u.url.includes('/schools/%') && !u.url.includes('/news/%'))) {
      lines.push(`- [${decodeURIComponent(u.url.slice(base.length))}](${u.url})`);
    }
    lines.push('');
  }
  lines.push('## 数据说明');
  lines.push('');
  lines.push('- 学校与新闻数据来自线上数据库，本站不采集个人信息');
  lines.push('- 估分择校的档位参考区间随地区配置，见对应地区页面说明');
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}
