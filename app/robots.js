// 动态 robots.txt：Host/Sitemap 跟随 NEXT_PUBLIC_SITE_URL，部署多地区域名时无需改文件。
// 存在 app/robots.js 后，Next 忽略 public/robots.txt。
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kaonaqu.xyz';

export default function robots() {
  const disallow = ['/api/', '/data/', '/shared/'];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: 'Baiduspider', allow: '/', disallow }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL.replace(/^https?:\/\//, '')
  };
}
