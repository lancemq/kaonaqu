import { NextResponse } from 'next/server';
import { DEFAULT_REGION, isKnownRegion } from './shared/region-list.mjs';

// 多地区路由代理（Next 16 proxy 文件约定，原 middleware）：所有地区（含上海）统一走 /{region}/... 前缀。
//
// - /{region}/...（已知地区）：rewrite 到 /...，注入 x-region request header 供 server 组件读取。
// - 无前缀路径（/schools、/、/news/xxx）：308 永久重定向到 /{DEFAULT_REGION}{pathname}，
//   统一带前缀并把旧链接 SEO 权重传递到 /shanghai/...。
//
// matcher 排除 /api（API 从 query.region 取）、/_next、favicon、robots、sitemap、llms、
// baidu_urls 及一切含点的静态文件路径。

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
      // 带前缀：rewrite 到剩余路径，注入 x-region。
      const rest = match[2] || '/';
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
