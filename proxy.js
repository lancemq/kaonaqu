import { NextResponse } from 'next/server';
import { createRequire } from 'module';
import { DEFAULT_REGION, isKnownRegion } from './shared/region-list.mjs';

// shared/region-config 是 CJS，proxy 为 ESM，用 createRequire 桥接。
const require = createRequire(import.meta.url);
const { getRegionFeatures } = require('./shared/region-config');

// 多地区路由代理（Next 16 proxy 文件约定，原 middleware）：所有地区（含上海）统一走 /{region}/... 前缀。
//
// - /{region}/...（已知地区）：rewrite 到 /...，注入 x-region request header 供 server 组件读取。
//   若该地区关闭了路径对应频道（如苏州仅新闻），先 308 重定向到 /{region}/news。
// - 无前缀路径（/schools、/、/news/xxx）：308 永久重定向到 /{DEFAULT_REGION}{pathname}，
//   统一带前缀并把旧链接 SEO 权重传递到 /shanghai/...。
//
// matcher 排除 /api（API 从 query.region 取）、/_next、favicon、robots、sitemap、llms、
// baidu_urls 及一切含点的静态文件路径。

// 新闻专题页路径（内容上海专属，苏州等仅新闻地区重定向到 /{region}/news）
const NEWS_SPECIAL_PATHS = new Set([
  '/news/admission-timeline',
  '/news/gaokao-special',
  '/news/zhongkao-special',
  '/news/sports-reform',
  '/news/policy-faq',
  '/news/policy-glossary'
]);

// 检查无前缀的 rest 路径是否属于该地区已关闭的频道，需要 308 到 /{region}/news。
// 非新闻频道按对应 feature 判断；新闻专题在 schools 关闭时重定向（内容上海专属）。
function shouldRedirectToNews(rest, features) {
  // /schools/score-match -> scoreMatch
  if (rest === '/schools/score-match') return features.scoreMatch === false;
  // /schools, /schools/* -> schools
  if (rest === '/schools' || rest.startsWith('/schools/')) return features.schools === false;
  // /knowledge, /knowledge/* -> knowledge
  if (rest === '/knowledge' || rest.startsWith('/knowledge/')) return features.knowledge === false;
  // /compare, /compare/* -> compare
  if (rest === '/compare' || rest.startsWith('/compare/')) return features.compare === false;
  // /groups, /groups/* -> groups
  if (rest === '/groups' || rest.startsWith('/groups/')) return features.groups === false;
  // /district, /district/* -> district
  if (rest === '/district' || rest.startsWith('/district/')) return features.district === false;
  // 新闻专题：内容上海专属，schools 关闭时重定向
  if (NEWS_SPECIAL_PATHS.has(rest)) return features.schools === false;
  return false;
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // 根路径 / -> 308 /shanghai
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_REGION}`;
    return NextResponse.redirect(url, 308);
  }

  // 解析首段：/shanghai/schools -> 'shanghai' + '/schools'
  const match = pathname.match(/^\/([a-z][a-z0-9-]*)(\/.*)?$/);
  if (match) {
    const firstSegment = match[1];
    if (isKnownRegion(firstSegment)) {
      const rest = match[2] || '/';

      // 频道开关拦截：该地区关闭的频道 308 重定向到 /{region}/news
      const features = getRegionFeatures(firstSegment);
      if (shouldRedirectToNews(rest, features)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = `/${firstSegment}/news`;
        return NextResponse.redirect(redirectUrl, 308);
      }

      // 带前缀：rewrite 到剩余路径，注入 x-region。
      const url = request.nextUrl.clone();
      url.pathname = rest;
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-region', firstSegment);
      return NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      });
    }
    // 首段非地区（/schools、/news、/knowledge 等）：fallthrough 到 308。
  } else {
    // 非字母首段（matcher 已排除静态文件，这里兜底放行其余）
    return NextResponse.next();
  }

  // 无前缀路径：308 永久重定向到 /{DEFAULT_REGION}{pathname}
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${DEFAULT_REGION}${pathname}`;
  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: ['/((?!api|_next|favicon|robots|sitemap|llms|baidu_urls|.*\\..*).*)'],
};
