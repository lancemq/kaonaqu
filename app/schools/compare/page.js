import SiteShell from '../../../components/site-shell';
import { createRequire } from 'module';
import SchoolsCompareClient from '../../../components/schools-compare-client';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '上海学校信息对比工具 | 考哪去',
  description: '多维度对比上海初高中学校信息，包括梯队、集团、招生政策、特色标签等，辅助升学择校决策。'
};

export const dynamic = 'force-dynamic';

export default async function SchoolsComparePage({ searchParams }) {
  const { districts, schools } = await loadDataStore();
  const params = await searchParams;
  const initialSchools = typeof params?.schools === 'string' ? params.schools : '';

  return (
    <SiteShell hideKnowledgeNav breadcrumbItems={[
      { label: '首页', href: '/' },
      { label: '学校信息', href: '/schools' },
      { label: '学校对比' }
    ]}>
      <SchoolsCompareClient 
        schools={schools} 
        initialSchools={initialSchools} 
      />
    </SiteShell>
  );
}
