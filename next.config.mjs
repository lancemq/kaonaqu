/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/*': [
      './data/**/*',
      './content/**/*'
    ]
  },
  async redirects() {
    // Legacy "已迁移" stub pages (title 含"跳转中") now 301 to their real
    // grade-specific target. These replace the old in-page "点击进入新版" links
    // so crawlers stop wasting budget on soft-redirect stubs.
    return [
      { source: '/knowledge/chemistry', destination: '/knowledge/chemistry-grade8', permanent: true },
      { source: '/knowledge/chinese', destination: '/knowledge/chinese-grade8', permanent: true },
      { source: '/knowledge/english', destination: '/knowledge/english-grade8', permanent: true },
      { source: '/knowledge/history', destination: '/knowledge/history-grade8', permanent: true },
      { source: '/knowledge/math', destination: '/knowledge/math-grade8', permanent: true },
      { source: '/knowledge/physics', destination: '/knowledge/physics-grade8', permanent: true },
      { source: '/knowledge/politics', destination: '/knowledge/politics-grade8', permanent: true },
      { source: '/knowledge/physics-plan', destination: '/knowledge/physics-grade8', permanent: true },
      { source: '/knowledge/physics-grade8-plan', destination: '/knowledge/physics-grade8', permanent: true }
    ];
  }
};

export default nextConfig;
