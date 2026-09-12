import { createRequire } from 'module';
import { redirect } from 'next/navigation';
import GroupsToolbar from '../../../components/groups-toolbar';
import GroupsCard from '../../../components/groups-card';
import GroupsRow from '../../../components/groups-row';
import { RegionLink } from '../../../components/region-link';
import { RegionSelector } from '../../../components/region-selector';
import { getRegionContext } from '../../../lib/region-server.mjs';
import { buildGroupsData, filterGroups } from '../../../lib/groups-data.mjs';

const require = createRequire(import.meta.url);
const { loadSchoolsList } = require('../../../shared/data-store');
const { getDistrictCatalog } = require('../../../shared/region-config');

export async function generateMetadata() {
  const { region, config } = await getRegionContext();
  if (config.features.schools === false) redirect(`/${region}/news`);
  if (config.features.groups === false) redirect(`/${region}/news`);
  const label = config.label;
  return {
    title: `${label}教育集团大全 | 考哪去`,
    description: `按教育集团检索${label}初高中学校，查看旗下成员校、分布区域与梯队构成。`,
    alternates: { canonical: `/${region}/schools/groups` }
  };
}


// 教育集团页（B6 收尾）：筛选走 URL searchParams，聚合/过滤/统计在服务端完成，
// 仅工具栏与成员校展开/收起为 client 岛（与学校列表页同模式，服务端是唯一数据源）。
export default async function GroupsPage({ searchParams }) {
  const { region, config } = await getRegionContext();
  if (config.features.schools === false) redirect(`/${region}/news`);
  if (config.features.groups === false) redirect(`/${region}/news`);
  const schools = await loadSchoolsList(region);
  const districts = getDistrictCatalog(region);
  const params = await searchParams;

  const filters = {
    district: typeof params?.district === 'string' ? params.district : 'all',
    stage: typeof params?.stage === 'string' ? params.stage : 'all',
    tier: typeof params?.tier === 'string' ? params.tier : 'all',
    query: typeof params?.query === 'string' ? params.query : ''
  };

  const data = buildGroupsData(schools);
  const filteredGroups = filterGroups(data.groups, filters);

  const featuredGroups = filteredGroups.slice(0, 5);
  const regionalGroups = filteredGroups.filter((group) => !group.hasTopTier).slice(0, 5);
  const visibleRegionalGroups = regionalGroups.length ? regionalGroups : filteredGroups.slice(5, 10);
  const activeFilterCount = [
    filters.district !== 'all',
    filters.stage !== 'all',
    filters.tier !== 'all',
    Boolean(filters.query)
  ].filter(Boolean).length;

  const benefitNotes = [
    '资源共享：课程体系、教学资源、实验室设施集团内互通',
    '师资流动：骨干教师在成员校间轮岗交流，提升整体教学水平'
  ];

  return (
    <main className="schools-aerial-page school-groups-aerial-page">
      <nav className="channel-nav" aria-label="顶部导航">
        <RegionLink className="channel-brand" href="/" aria-label="考哪去首页">
          <strong>考哪去</strong>
          <span>{config.brandSuffix}</span>
        </RegionLink>
        <div className="channel-nav-links">
          <RegionLink href="/">首页</RegionLink>
          <RegionLink href="/news">新闻</RegionLink>
          {config.features.schools && <RegionLink className="is-active" href="/schools">学校</RegionLink>}
          {config.features.knowledge && <RegionLink href="/knowledge">知识</RegionLink>}
          <RegionSelector />
        </div>
      </nav>

      <header className="channel-hero" id="top">
        <section className="channel-hero-content" aria-label="教育集团专题">
          <div className="channel-hero-copy">
            <p className="channel-kicker"><span aria-hidden="true"></span>EDUCATION GROUPS</p>
            <h1>教育集团</h1>
            <p>{config.label}推行学区化集团化办学，通过名校引领、资源共享、课程共建、师资流动等方式，促进优质教育资源均衡分布。</p>
          </div>

          <aside className="channel-hero-stats" aria-label="教育集团统计">
            <article>
              <strong>{data.groups.length}</strong>
              <span>教育集团</span>
            </article>
            <article>
              <strong>{data.memberSchoolTotal}</strong>
              <span>成员学校</span>
            </article>
            <article>
              <strong>{data.districtCoverage}</strong>
              <span>覆盖区域</span>
            </article>
          </aside>
        </section>
      </header>

      <section className="school-groups-aerial-overview">
        <h2>集团化办学概况</h2>
        <p>当前页面已排除区域名归并、泛化类别与单校伪集团；集团化办学不等于升学结果，适合先看核心校、成员校分布、覆盖学段与区域扩展，再进入具体学校详情确认官方口径。</p>
      </section>

      <GroupsToolbar districts={districts} filters={filters} allTiers={data.allTiers} />

      <section className="school-groups-aerial-list" aria-label="主要教育集团">
        <div className="school-groups-aerial-section-head">
          <p className="channel-kicker"><span aria-hidden="true"></span>MAJOR GROUPS</p>
          <h2>主要教育集团</h2>
        </div>
        <div className="school-groups-grid">
          {featuredGroups.map((group) => (
            <GroupsCard key={group.name} group={group} districts={districts} />
          ))}
        </div>
      </section>

      <section className="school-groups-aerial-list" aria-label="区域联盟与特色集团">
        <div className="school-groups-aerial-section-head">
          <p className="channel-kicker"><span aria-hidden="true"></span>REGIONAL GROUPS</p>
          <h2>区域联盟与特色集团</h2>
          <p>{activeFilterCount ? `当前筛选匹配 ${filteredGroups.length} 个集团。` : `按头部梯队与成员校数量排序，当前展示 ${filteredGroups.length} 个通过校验的集团。`}</p>
        </div>
        <div className="school-groups-aerial-row-list">
          {visibleRegionalGroups.map((group) => (
            <GroupsRow key={group.name} group={group} districts={districts} />
          ))}
        </div>
      </section>

      <section className="school-groups-aerial-types" aria-label="教育集团类型">
        {data.groupTypes.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="school-groups-aerial-benefits">
        <article>
          <p className="channel-kicker"><span aria-hidden="true"></span>BENEFITS</p>
          <h2>为什么要看教育集团</h2>
          <p>集团化办学不是简单看名字，而是观察课程、师资、活动和升学信息如何在成员校之间流动。它能帮助家庭理解一个学校背后的资源网络。</p>
        </article>
        <div>
          {benefitNotes.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>

      <div className="channel-color-bar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <footer className="channel-footer">
        <div><strong>考哪去</strong><span>{config.brandSuffixFull}</span></div>
        <nav aria-label="页脚导航">
          <RegionLink href="/">首页</RegionLink>
          <RegionLink href="/news">新闻</RegionLink>
          {config.features.schools && <RegionLink href="/schools">学校</RegionLink>}
          {config.features.knowledge && <RegionLink href="/knowledge">知识</RegionLink>}
        </nav>
        <p>© 2026 考哪去</p>
      </footer>
    </main>
  );
}
