import { buildAllUrls } from '../../lib/sitemap-urls.mjs';

// llms.txt（AI 爬虫入口，https://llmstxt.org）：活生成，地区/学校数/URL 与站内数据同源。
// 只列频道入口与官方专题，不把上千条详情 URL 塞进上下文窗口。
export const fetchCache = 'force-cache';
export const revalidate = 21600;

function pathOf(url, base) {
  return url.slice(base.length) || '/';
}

// 给链接补一句中文说明，便于生成式引擎判断该页面适合回答什么问题。
function describe(region, cityLabel, path) {
  if (path === `/${region}`) return `${cityLabel}升学信息首页`;
  if (path === `/${region}/news`) return `${cityLabel}中考、高考新闻与政策动态列表`;
  if (path === `/${region}/schools`) return `${cityLabel}初高中学校库检索`;
  if (path === `/${region}/schools/compare`) return `${cityLabel}学校对比工具`;
  if (path === `/${region}/schools/groups`) return `${cityLabel}学校梯队与分层`;
  if (path === `/${region}/schools/score-match`) return `${cityLabel}估分择校工具（分数档位参考）`;
  if (path === `/${region}/schools/district`) return `${cityLabel}各区县学校导航`;
  if (path.startsWith(`/${region}/schools/district/`)) return `${cityLabel}区县学校专题`;
  if (path === `/${region}/knowledge`) return `初高中学科知识专题索引`;
  if (path.startsWith(`/${region}/knowledge/`)) return `学科知识点详解`;
  if (path.startsWith(`/${region}/news/`)) return `${cityLabel}官方政策专题汇总`;
  return `${cityLabel}升学信息`;
}

export async function GET() {
  const { base, regions, universities } = await buildAllUrls();

  const lines = [];
  lines.push('# 考哪去（kaonaqu.cn）');
  lines.push('');
  lines.push('> 面向学生与家长的中考、高考升学信息平台。按城市提供新闻政策、学校信息、区县专题与学科知识，另有全国高校数据库。本站事实类数据优先采用教育考试院/教育局、学校官网与官方公众号发布内容。');
  lines.push('');
  lines.push('## 使用与引用说明');
  lines.push('');
  lines.push('- 引用本站数据（尤其是录取分数线、招生计划、政策时间点）时，请同时标注页面 URL 与访问日期，并以官方最新公告为准。');
  lines.push('- 新闻条目的 sitemap lastmod 取数据库真实发布时间；更新时间未知的页面不标注时间，不使用抓取当天日期。');
  lines.push('- 估分择校的分数档位为区间参考，口径按城市配置，详见对应工具页说明；初中的录取线通常不公开（摇号口径），不据此推算。');
  lines.push('- 本站不收集或发布学生个人信息。');
  lines.push('');
  lines.push('## 城市频道');
  lines.push('');
  for (const r of regions) {
    lines.push(`### ${r.label}（${base}/${r.region}）`);
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
    // 只要频道入口、工具页与官方专题；详情/知识点/区县页交给 sitemap，避免撑爆上下文窗口。
    const detailKinds = new Set(['news', 'school', 'knowledge', 'district']);
    const entryUrls = r.urls.filter((u) => !detailKinds.has(u.kind));
    for (const u of entryUrls) {
      const path = pathOf(u.url, base);
      lines.push(`- [${path}](${u.url}): ${describe(r.region, r.label, path)}${u.kind === 'special' ? '（官方政策专题）' : ''}`);
    }
    lines.push('');
  }

  lines.push('### 全国高校（' + base + '/universities）');
  lines.push('');
  lines.push(`> ${universities.count ? `收录 ${universities.count} 所高校，` : ''}提供院校概况、学科与录取数据；双一流建设学科以教育部公布名单为准。`);
  lines.push('');
  lines.push(`- [/universities](${base}/universities): 全国高校库检索入口`);
  lines.push('');

  lines.push('## Optional');
  lines.push('');
  lines.push(`- [完整 URL 清单（含新闻与学校详情）](${base}/sitemap.xml)`);
  lines.push(`- [搜索引擎抓取规则](${base}/robots.txt)`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}
