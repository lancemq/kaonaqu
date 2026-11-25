export const revalidate = 3600; // pg 直连后无 fetch 驱动 ISR，查库页面必须显式声明重验证
import { createRequire } from 'module';
import { redirect } from 'next/navigation';
import { NewsTopicSpecialPage } from '../../../../components/news-topic-special-ui';
import { getPolicyDetailHref } from '../../../../lib/policy-detail';
import { getRegionContextFromParams } from '../../../../lib/region-server.mjs';
import { buildSpecialProps } from '../../../../shared/news-special-builder.mjs';

const require = createRequire(import.meta.url);
const { loadNewsList } = require('../../../../shared/data-store');

export async function generateMetadata({ params }) {
  const { region, config } = await getRegionContextFromParams(params);
  if (config.features.schools === false) redirect(`/${region}/news`);
  if (region === 'suzhou') redirect(`/${region}/news/suzhou-gaokao`);
  const label = config.label;
  const total = config.examTotal?.gaokao || '';
  return {
    title: `${label}高招政策详解 | 考哪去`,
    description: `汇总 2026 年${label}市普通高校招生政策与录取动态，高考满分 ${total} 分，附关键时间节点与常见误区，具体规则以当地教育行政部门发布为准。`,
    alternates: { canonical: `/${region}/news/gaokao-special` }
  };
}

export default async function GaokaoSpecialPage({ params }) {
  const { region, config } = await getRegionContextFromParams(params);
  if (config.features.schools === false) redirect(`/${region}/news`);
  if (region === 'suzhou') redirect(`/${region}/news/suzhou-gaokao`);
  const news = await loadNewsList(region);
  const props = buildSpecialProps({
    region,
    regionConfig: config,
    variant: 'gaokao',
    news,
    detailHref: getPolicyDetailHref
  });
  return (
    <NewsTopicSpecialPage
      region={region}
      variant="gaokao"
      kicker="GAOKAO POLICY"
      {...props}
      contentId="gaokao-list"
    />
  );
}
