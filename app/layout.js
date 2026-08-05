import { Analytics } from '@vercel/analytics/react';
import { Funnel_Sans, Geist, Geist_Mono, Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google';
import BodyPageFlag from '../components/body-page-flag';
import { RegionProvider } from '../components/region-context';
import { getRegionContext } from '../lib/region-server.mjs';
import { KNOWN_REGIONS } from '../shared/region-list.mjs';
import '../styles/index.css';

// 字体自托管（next/font 构建时下载、运行时同源分发，无第三方依赖）：
// 5 个家族 = Funnel Sans(标题latin显示体) + Geist(正文) + Geist Mono(数据) + Noto Sans SC(中文正文) + Noto Serif SC(中文标题衬线)。
// 通过 CSS 变量注入，styles/tokens.css 的 --channel-font-* 引用这些变量。
const fontFunnel = Funnel_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-funnel',
  display: 'swap'
});
const fontGeist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap'
});
const fontGeistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-geist-mono',
  display: 'swap'
});
// 中文：按需分片（unicode-range），不做 preload，避免大量分片预载标签
const fontNotoSansSC = Noto_Sans_SC({
  subsets: ['chinese-simplified', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  preload: false
});
// 中文衬线（标题用，与正文无衬线形成层级对比）；latin 仍用 Funnel Sans 显示体
const fontNotoSerifSC = Noto_Serif_SC({
  subsets: ['chinese-simplified', 'latin'],
  weight: ['500', '600', '700', '900'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  preload: false
});

// 统一设置 fetchCache = 'force-cache'：使 Next.js Data Cache 对所有页面生效。
// Previous Model auto 模式下，调用 searchParams / params / cookies 等 Request-time API
// 之后的 fetch 默认不缓存（即使 fetch 显式设了 cache: 'force-cache' 也会被忽略）。
// 段级 force-cache 覆盖此行为，使 Supabase 查询（cachedFetch）能被 Data Cache 缓存。
// route handler（app/api/）不继承 layout 段配置，需单独设置（见 app/api/[...slug]/route.js）。
// 注：dynamic = 'force-dynamic' 会把 fetchCache 默认改为 force-no-store 覆盖此设置，
// 故各页面不再使用 force-dynamic（searchParams/params 已自动使页面动态渲染）。
export const fetchCache = 'force-cache';

export async function generateMetadata() {
  const { region, config } = await getRegionContext();
  const label = config.label;
  const title = config.seo.titleTemplate.replace('{label}', label);
  const description = config.seo.descriptionTemplate.replace('{label}', label);
  const keywords = config.seo.keywords.map((k) => k.replace('{label}', label));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kaonaqu.xyz';
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords,
    alternates: {
      canonical: `/${region}`
    },
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      siteName: '考哪去',
      title,
      description,
      url: siteUrl
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  };
}

export default async function RootLayout({ children }) {
  const { region, config } = await getRegionContext();
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-7712476875404468';
  return (
    <html lang="zh-CN">
      <head>
        <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`} crossOrigin="anonymous"></script>
      </head>
      <body
        className={`${fontFunnel.variable} ${fontGeist.variable} ${fontGeistMono.variable} ${fontNotoSansSC.variable} ${fontNotoSerifSC.variable}`}
        suppressHydrationWarning
      >
        {/* 首屏同步设置 data-page，避免频道 CSS（body[data-page=...]）因客户端 useEffect 延迟而首屏闪烁（FOUC）。
            SPA 路由切换由 BodyPageFlag 的 useEffect 负责更新。
            内联 R 由 KNOWN_REGIONS 注入（与 shared/region-list.mjs 同步），用于剥离 /{region}/ 前缀。 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              `(function(){try{var p=location.pathname||'/';var R=${JSON.stringify(KNOWN_REGIONS)};function sp(x){var s=x.split('/');if(s.length>2&&R.indexOf(s[1])>=0){return '/'+s.slice(2).join('/');}return x;}var pp=sp(p);var r=pp.indexOf('/news')===0?'news':pp.indexOf('/schools')===0?'schools':pp.indexOf('/knowledge')===0?'knowledge':'home';document.body.setAttribute('data-page',r);}catch(e){}})();`
          }}
        />
        <RegionProvider
          region={region}
          label={config.label}
          brandSuffix={config.brandSuffix}
          brandSuffixFull={config.brandSuffixFull}
          examTotal={config.examTotal}
        >
          <BodyPageFlag />
          {children}
          <Analytics />
        </RegionProvider>
      </body>
    </html>
  );
}
