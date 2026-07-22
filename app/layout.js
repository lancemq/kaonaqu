import { Analytics } from '@vercel/analytics/react';
import { Funnel_Sans, Geist, Geist_Mono, Noto_Sans_SC } from 'next/font/google';
import BodyPageFlag from '../components/body-page-flag';
import '../styles/index.css';

// 字体自托管（next/font 构建时下载、运行时同源分发，无第三方依赖）：
// 4 个家族 = Funnel Sans(标题) + Geist(正文) + Geist Mono(数据) + Noto Sans SC(中文)。
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

// 统一设置 fetchCache = 'force-cache'：使 Next.js Data Cache 对所有页面生效。
// Previous Model auto 模式下，调用 searchParams / params / cookies 等 Request-time API
// 之后的 fetch 默认不缓存（即使 fetch 显式设了 cache: 'force-cache' 也会被忽略）。
// 段级 force-cache 覆盖此行为，使 Supabase 查询（cachedFetch）能被 Data Cache 缓存。
// route handler（app/api/）不继承 layout 段配置，需单独设置（见 app/api/[...slug]/route.js）。
// 注：dynamic = 'force-dynamic' 会把 fetchCache 默认改为 force-no-store 覆盖此设置，
// 故各页面不再使用 force-dynamic（searchParams/params 已自动使页面动态渲染）。
export const fetchCache = 'force-cache';

export const metadata = {
  metadataBase: new URL('https://kaonaqu.xyz'),
  title: '考哪去 | 上海中考高考政策、学校信息与知识体系平台',
  description: '考哪去聚合上海中考、高考新闻政策、学校信息和初高中知识体系，覆盖升学动态、学校筛选、知识点梳理与年级学习路径。',
  keywords: ['上海中考', '上海高考', '上海学校', '升学政策', '中招', '高招', '上海教育'],
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: '考哪去',
    title: '考哪去 | 上海中考高考政策、学校信息与知识体系平台',
    description: '考哪去聚合上海中考、高考新闻政策、学校信息和初高中知识体系，覆盖升学动态、学校筛选、知识点梳理与年级学习路径。',
    url: 'https://kaonaqu.xyz'
  },
  twitter: {
    card: 'summary_large_image',
    title: '考哪去 | 上海中考高考政策、学校信息与知识体系平台',
    description: '考哪去聚合上海中考、高考新闻政策、学校信息和初高中知识体系，覆盖升学动态、学校筛选、知识点梳理与年级学习路径。'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7712476875404468" crossOrigin="anonymous"></script>
      </head>
      <body className={`${fontFunnel.variable} ${fontGeist.variable} ${fontGeistMono.variable} ${fontNotoSansSC.variable}`}>
        <BodyPageFlag />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
