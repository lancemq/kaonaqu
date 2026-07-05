import { Analytics } from '@vercel/analytics/react';
import BodyPageFlag from '../components/body-page-flag';
import '../styles/index.css';

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
      <body>
        <BodyPageFlag />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
