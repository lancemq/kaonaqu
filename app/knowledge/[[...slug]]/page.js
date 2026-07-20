import '../../../styles/channels/knowledge.css';
import { notFound } from 'next/navigation';
import KnowledgePage from '../../../components/knowledge-page';
import { getKnowledgePage, listKnowledgeSlugs, buildKnowledgeJsonLd } from '../../../lib/knowledge-content.mjs';

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

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: page.href
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

  const jsonLdBlocks = buildKnowledgeJsonLd(page);

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
