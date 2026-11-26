// 动态 robots.txt：Host/Sitemap 跟随 NEXT_PUBLIC_SITE_URL，部署多地区域名时无需改文件。
// 存在 app/robots.js 后，Next 忽略 public/robots.txt。
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kaonaqu.cn';

export default function robots() {
  const disallow = ['/api/', '/data/', '/shared/'];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: 'Baiduspider', allow: '/', disallow },
      // 显式允许生成式引擎抓取公开升学信息（与 * 规则一致，便于站点意图表达与被正确解析）。
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot'],
        allow: '/',
        disallow
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL.replace(/^https?:\/\//, '')
  };
}
