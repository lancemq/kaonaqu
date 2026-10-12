import '../../../../styles/channels/knowledge.css';
import 'katex/dist/katex.min.css';
import { notFound } from 'next/navigation';
import KnowledgePage from '../../../../components/knowledge-page';
import { getKnowledgePage, listKnowledgeSlugs, buildKnowledgeJsonLd } from '../../../../lib/knowledge-content.mjs';
import { getRegionContextFromParams } from '../../../../lib/region-server.mjs';

export async function generateStaticParams() {
  // 知识体系为上海专属：只为 shanghai 预生成，其他地区按需渲染时 404。
  return (await listKnowledgeSlugs()).map((entry) => ({ ...entry, region: 'shanghai' }));
}

export async function generateMetadata({ params }) {
  const { region, config } = await getRegionContextFromParams(params);
  // 知识内容为上海专属：非上海 region 直接 404（不 redirect——redirect 会让爬虫反复追链，
  // 每条都消耗函数 CPU 且计入错误率；404 一次终局，对 SEO 也更干净）。
  if (config.features.knowledge === false) notFound();
  const page = await getKnowledgePage((await params).slug || []);

  if (!page) {
    return {
      title: '知识体系 | 考哪去'
    };
  }

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: `/${region}${page.href}`
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.href,
      type: 'article',
      siteName: '考哪去',
      locale: 'zh_CN'
    }
  };
}

export default async function KnowledgeRoutePage({ params }) {
  const { region, config } = await getRegionContextFromParams(params);
  // 同上：非上海 region 404 终局（方案 A，见 generateMetadata 注释）。
  if (config.features.knowledge === false) notFound();
  const page = await getKnowledgePage((await params).slug || []);

  if (!page) {
    notFound();
  }

  const jsonLdBlocks = buildKnowledgeJsonLd(page, region);

  return (
    <>
      {jsonLdBlocks.map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <KnowledgePage page={page} region={region} />
    </>
  );
}
