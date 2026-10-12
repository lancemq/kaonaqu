// 地区布局：从路由段 params 取 region（不再读 headers，保证页面可被 ISR/静态缓存）。
import { getRegionContextFromParams } from '../../lib/region-server.mjs';
import { KNOWN_REGIONS } from '../../shared/region-list.mjs';

// 构建期为每个地区预生成（配合各子页 revalidate 实现 ISR，CDN 直出）。
export async function generateStaticParams() {
  return KNOWN_REGIONS.map((region) => ({ region }));
}

// 地区级 SEO 元数据（原根布局逻辑迁移至此）。
export async function generateMetadata({ params }) {
  const { region, config } = await getRegionContextFromParams(params);
  const label = config.label;
  const title = config.seo.titleTemplate.replace('{label}', label);
  const description = config.seo.descriptionTemplate.replace('{label}', label);
  const keywords = config.seo.keywords.map((k) => k.replace('{label}', label));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kaonaqu.xyz';
  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/${region}` },
    openGraph: { type: 'website', title, description, url: siteUrl },
    twitter: { card: 'summary_large_image', title, description }
  };
}

export default function RegionLayout({ children }) {
  return children;
}
