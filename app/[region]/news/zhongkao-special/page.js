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
  if (region === 'suzhou') redirect(`/${region}/news/suzhou-zhongkao`);
  const label = config.label;
  const total = config.examTotal?.zhongkao || '';
  return {
    title: `${label}中招政策详解 | 考哪去`,
    description: `以 2026 年${label}市中招办法为依据，系统说明${label}中考招生录取批次、${total} 分构成、名额分配综合评价、自主招生、志愿填报与政策性照顾加分，附关键时间节点与常见误区。`,
    alternates: { canonical: `/${region}/news/zhongkao-special` }
  };
}

export default async function ZhongkaoSpecialPage({ params }) {
  const { region, config } = await getRegionContextFromParams(params);
  if (config.features.schools === false) redirect(`/${region}/news`);
  if (region === 'suzhou') redirect(`/${region}/news/suzhou-zhongkao`);
  const news = await loadNewsList(region);
  const props = buildSpecialProps({
    region,
    regionConfig: config,
    variant: 'zhongkao',
    news,
    detailHref: getPolicyDetailHref
  });
  return (
    <NewsTopicSpecialPage
      region={region}
      variant="zhongkao"
      kicker="ZHONGKAO POLICY"
      {...props}
      contentId="zhongkao-list"
    />
  );
}
