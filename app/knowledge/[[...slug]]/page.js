import '../../../styles/channels/knowledge.css';
import 'katex/dist/katex.min.css';
import { notFound } from 'next/navigation';
import KnowledgePage from '../../../components/knowledge-page';
import { getKnowledgePage, listKnowledgeSlugs, buildKnowledgeJsonLd } from '../../../lib/knowledge-content.mjs';
import { getRegionContext } from '../../../lib/region-server.mjs';

export async function generateStaticParams() {
  return listKnowledgeSlugs();
}

export async function generateMetadata({ params }) {
  const page = await getKnowledgePage((await params).slug || []);

  if (!page) {
    return {
      title: '知识体系 | 考哪去'
    };
  }

  const { region } = await getRegionContext();

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
  const page = await getKnowledgePage((await params).slug || []);

  if (!page) {
    notFound();
  }

  const { region } = await getRegionContext();
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
      <KnowledgePage page={page} />
    </>
  );
}
