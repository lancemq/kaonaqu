import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import KnowledgePage from '../../../components/knowledge-page';
import { getKnowledgeChannelJourney } from '../../../lib/cross-channel-journeys.mjs';
import { getKnowledgePage, listKnowledgeSlugs } from '../../../lib/knowledge-content.mjs';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

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
  const dataStore = await loadDataStore();

  if (!page) {
    notFound();
  }

  return (
    <SiteShell breadcrumbItems={page.breadcrumbItems}>
      <KnowledgePage page={page} journey={getKnowledgeChannelJourney(page, dataStore)} />
    </SiteShell>
  );
}
