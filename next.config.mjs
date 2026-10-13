/** @type {import('next').NextConfig} */
const nextConfig = {

  // 【Fluid CPU 关键】Next 16 客户端 Segment Cache 默认开启且无开关：
  // 视口内每个 <Link> 都会预取 <href>.segments/_tree.segment，而该响应的
  // Cache-Control 是 no-store（实测）——Vercel CDN 永不缓存，每次预取都是一次
  // 函数执行。默认 staleTimes.dynamic=0 又导致客户端每次导航都重新拉树，
  // 请求量 = PV × 视口内链接数（首页链接在全站导航里，故 /shanghai 树最热）。
  // 拉长客户端复用窗口 + 关闭启动预载，削减 90%+ 的 segment 预取请求。
  experimental: {
    staleTimes: { dynamic: 300, static: 300 },
    preloadEntriesOnStart: false
  },
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/*': [

      // 仅 content/（知识 JSON、学校 markdown）为运行时读取；data/ 是迁移源数据，
      // 运行时零引用（已核查 process.cwd/require/import），打包进函数徒增 15MB 冷启动。
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
