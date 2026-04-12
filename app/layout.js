import { Analytics } from '@vercel/analytics/react';
import BodyPageFlag from '../components/body-page-flag';
import '../styles/base.css';
import '../styles/theme-home.css';
import '../styles/theme-news.css';
import '../styles/theme-schools.css';
import '../styles/site-unified.css';

export const metadata = {
  title: '考哪去 | 上海中考高考政策、学校信息与知识体系平台',
  description: '考哪去聚合上海中考、高考新闻政策、学校信息和初高中知识体系，覆盖升学动态、学校筛选、知识点梳理与年级学习路径。'
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <BodyPageFlag />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
