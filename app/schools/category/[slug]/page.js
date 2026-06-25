import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import SiteShell from '../../../../components/site-shell';
import {
  findSchoolCategoryBySlug,
  findSpecializationBySlug,
  SCHOOL_CATEGORY_LIST,
  SPECIALIZATION_CATEGORY_LIST,
  getSchoolsByCategory,
  getSchoolsBySpecialization,
  getSchoolsByCanonicalGroup,
  getSchoolCategoryLabel,
  getSchoolDistrictName,
  getSchoolStage,
  getSchoolOwnershipLabel,
  getSchoolSpecializationLabels,
  getSchoolTrainingDirections
} from '../../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../../shared/data-store');

export const revalidate = 86400;

export async function generateStaticParams() {
  const params = [];
  for (const cat of SCHOOL_CATEGORY_LIST) {
    params.push({ slug: cat.slug });
  }
  for (const spec of SPECIALIZATION_CATEGORY_LIST) {
    params.push({ slug: spec.slug });
  }
  return params;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN');
}

function formatSchoolUpdate(value) {
  const text = String(value || '').trim();
  if (!text) return '时间待补充';
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!match) return text;
  const [, year, month, day, hour, minute] = match;
  if (hour && minute) return `${year}.${month}.${day} ${hour}:${minute}`;
  return `${year}.${month}.${day}`;
}

function getUpdateSortValue(value) {
  const text = String(value || '').trim();
  if (!text) return 0;
  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) return parsed;
  return 0;
}

function clipText(text, maxLength = 84) {
  const value = String(text || '').trim();
  if (!value || value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function buildCardTags(school) {
  const values = [
    ...(school.tags || []),
    ...(school.features || []),
    ...getSchoolTrainingDirections(school),
    ...getSchoolSpecializationLabels(school)
  ].filter(Boolean);
  return Array.from(new Set(values)).slice(0, 4);
}

function sortSchoolsBySignal(list) {
  return list.slice().sort((left, right) => {
    const rightSignal = (right.features?.length || 0) + (right.tags?.length || 0);
    const leftSignal = (left.features?.length || 0) + (left.tags?.length || 0);
    return rightSignal - leftSignal || getUpdateSortValue(right.updatedAt) - getUpdateSortValue(left.updatedAt);
  });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = findSchoolCategoryBySlug(slug);
  const spec = findSpecializationBySlug(slug);
  const target = cat || spec;
  if (!target) {
    return { title: '学校分类 | 考哪去' };
  }
  const title = cat ? `${target.label}学校名单 - 上海${target.label}学校一览 | 考哪去` : `${target.label}特色学校 - 上海${target.label}学校清单 | 考哪去`;
  const description = cat
    ? `查看上海${target.label}学校名单、所属区域、办学性质与培养方向，${target.description}`
    : `${target.description}查看上海${target.label}方向的学校名单与培养路径。`;
  return {
    title,
    description,
    keywords: cat
      ? ['上海学校分类', target.label, '初中', '高中', '择校', '上海升学']
      : [target.label, '上海学校', '特色学校', '培养方向']
  };
}

export default async function CategoryDetailPage({ params }) {
  const { slug } = await params;
  const cat = findSchoolCategoryBySlug(slug);
  const spec = findSpecializationBySlug(slug);
  const target = cat || spec;

  if (!target) {
    notFound();
  }

  const { schools, districts } = await loadDataStore();

  let categorySchools;
  if (cat) {
    categorySchools = getSchoolsByCategory(schools, cat.id);
  } else {
    categorySchools = getSchoolsBySpecialization(schools, spec.id);
  }

  const sortedSchools = sortSchoolsBySignal(categorySchools);

  const stageBuckets = {
    junior: sortedSchools.filter((school) => school.schoolStage === 'junior'),
    senior_high: sortedSchools.filter((school) => school.schoolStage === 'senior_high'),
    complete: sortedSchools.filter((school) => school.schoolStage === 'complete')
  };

  const districtStats = sortedSchools.reduce((acc, school) => {
    const id = school.districtId || 'unknown';
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});
  const topDistricts = Object.entries(districtStats)
    .map(([id, count]) => ({
      id,
      name: districts.find((d) => d.id === id)?.name || id,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const featured = sortedSchools.slice(0, 6);
  const latestUpdated = formatSchoolUpdate(sortedSchools[0]?.updatedAt);

  const descriptor = [
    `${categorySchools.length} 所学校`,
    `${stageBuckets.senior_high.length} 所高中`,
    `${stageBuckets.junior.length} 所初中`,
    `${stageBuckets.complete.length} 所完全中学`
  ].join(' · ');

  const stageGroups = [
    { id: 'senior_high', label: '高中', items: stageBuckets.senior_high, note: '适合中招阶段直接比较。' },
    { id: 'complete', label: '完全中学', items: stageBuckets.complete, note: '适合关注初高中贯通培养路径。' },
    { id: 'junior', label: '初中', items: stageBuckets.junior, note: '适合小升初与初中阶段择校。' }
  ].filter((g) => g.items.length);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': cat ? `${cat.label}学校列表` : `${spec.label}特色学校列表`,
    'description': cat ? cat.description : spec.description,
    'numberOfItems': categorySchools.length
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <SiteShell
        hideKnowledgeNav
        breadcrumbItems={[
          { label: '学校信息', href: '/schools' },
          { label: '学校分类', href: '/schools/category' },
          { label: target.label }
        ]}
      >
        <header className="hero" id="top">
          <section className="district-datadesk-hero" aria-label="学校分类详情">
            <div className="district-datadesk-hero-grid">
              <div className="district-datadesk-hero-main">
                <p className="overview-label">{cat ? 'School Tier' : 'Specialization'}</p>
                <h1>{cat ? `上海${target.label}学校名单` : `上海${target.label}方向学校`}</h1>
                <p className="district-datadesk-subtitle">{target.description}</p>
                <p className="district-datadesk-description">
                  {cat
                    ? `上海${target.label}学校按区域与学段重组。`
                    : `${target.label}方向办学特色突出的学校汇总，按区域查看。`}
                </p>
                <div className="district-datadesk-inline-meta">
                  <span>区域优先</span>
                  <span>学段分布</span>
                  <span>学校详情</span>
                </div>
              </div>

              <div className="district-datadesk-summary-grid">
                <article className="district-datadesk-summary-card district-datadesk-summary-card-strong">
                  <span>学校数量</span>
                  <strong>{formatNumber(categorySchools.length)}</strong>
                  <p>{cat ? `当前分类${target.label}学校` : `${target.label}方向学校`}</p>
                </article>
                <article className="district-datadesk-summary-card">
                  <span>覆盖区域</span>
                  <strong>{topDistricts.length}</strong>
                  <p>学校主要分布的行政区</p>
                </article>
                <article className="district-datadesk-summary-card">
                  <span>最近更新</span>
                  <strong>{latestUpdated}</strong>
                  <p>本分类数据最近一次收录时间</p>
                </article>
                <article className="district-datadesk-summary-card">
                  <span>高中 / 初中</span>
                  <strong>{stageBuckets.senior_high.length} / {stageBuckets.junior.length}</strong>
                  <p>纯高中与纯初中分布</p>
                </article>
              </div>
            </div>
          </section>
        </header>

        <section className="district-datadesk-statusbar" aria-label="分类状态">
          <span className="district-datadesk-statuslabel">Category Status</span>
          <span>{target.label} / {descriptor}</span>
        </section>

        <main className="layout district-datadesk-layout">
          <aside className="district-datadesk-sidebar">
            <section className="district-datadesk-panel district-datadesk-panel-dark">
              <div className="district-datadesk-panel-head">
                <p className="overview-label">分类说明</p>
                <span>{target.label}</span>
              </div>
              <p className="district-datadesk-panel-copy">{target.description}</p>
              <div className="district-datadesk-stack">
                <span>高中 {stageBuckets.senior_high.length}</span>
                <span>初中 {stageBuckets.junior.length}</span>
                <span>完全中学 {stageBuckets.complete.length}</span>
              </div>
            </section>

            <section className="district-datadesk-panel">
              <div className="district-datadesk-panel-head">
                <p className="overview-label">主要分布区域</p>
                <span>{topDistricts.length} 个区</span>
              </div>
              <div className="district-datadesk-related">
                {topDistricts.map((d) => (
                  <Link key={d.id} className="district-datadesk-related-link" href={`/schools/district/${d.id}`}>
                    <strong>{d.name}</strong>
                    <span>{d.count} 所学校</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="district-datadesk-panel">
              <div className="district-datadesk-panel-head">
                <p className="overview-label">其他分类</p>
                <span>继续横向看</span>
              </div>
              <div className="district-datadesk-related">
                {(cat ? SCHOOL_CATEGORY_LIST : SPECIALIZATION_CATEGORY_LIST)
                  .filter((item) => item.id !== target.id)
                  .slice(0, 6)
                  .map((item) => (
                    <Link key={item.id} className="district-datadesk-related-link" href={`/schools/category/${item.slug}`}>
                      <strong>{item.label}</strong>
                      <span>{item.description.slice(0, 28)}</span>
                    </Link>
                  ))}
              </div>
            </section>
          </aside>

          <section className="district-datadesk-results">
            <section className="district-datadesk-panel">
              <div className="district-datadesk-results-head">
                <div>
                  <p className="overview-label">优先阅读</p>
                  <h2>{target.label}优先学校</h2>
                </div>
                <p>优先展示资料相对完整、适合做第一轮判断的学校条目。</p>
              </div>
              <div className="district-datadesk-cardlist">
                {featured.map((school) => {
                  const cardTags = buildCardTags(school);
                  return (
                    <Link key={school.id} href={`/schools/${school.id}`} className="district-datadesk-card">
                      <div className="district-datadesk-cardhead">
                        <div>
                          <p className="district-datadesk-cardkicker">{getSchoolDistrictName(school)} / {getSchoolStage(school)} / {getSchoolOwnershipLabel(school)}</p>
                          <h3>{school.name}</h3>
                        </div>
                        <div className="district-datadesk-cardmeta">
                          <span>{getSchoolCategoryLabel(school)}</span>
                          <span>{formatSchoolUpdate(school.updatedAt)}</span>
                        </div>
                      </div>
                      <p className="district-datadesk-cardsummary">{clipText(school.description || school.schoolDescription || '学校信息持续整理中。')}</p>
                      <div className="district-datadesk-cardfooter">
                        <div className="district-datadesk-cardtags">
                          {cardTags.length ? cardTags.map((tag) => (
                            <span key={tag} className="district-datadesk-cardtag">{tag}</span>
                          )) : (
                            <span className="district-datadesk-cardtag district-datadesk-cardtag-muted">标签待补充</span>
                          )}
                        </div>
                        <span className="district-datadesk-cardlink">进入学校详情</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {stageGroups.map((group) => (
              <section key={group.id} className="district-datadesk-panel">
                <div className="district-datadesk-results-head">
                  <div>
                    <p className="overview-label">按学段查看</p>
                    <h2>{target.label}{group.label}学校</h2>
                  </div>
                  <p>{group.note}</p>
                </div>
                <div className="district-datadesk-schoolgrid">
                  {group.items.slice(0, 12).map((school) => (
                    <Link key={school.id} href={`/schools/${school.id}`} className="district-datadesk-schoolitem">
                      <strong>{school.name}</strong>
                      <span>{getSchoolDistrictName(school)} / {getSchoolOwnershipLabel(school)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </section>
        </main>

        <footer className="prototype-page-footer">
          <span>上海学校数据库 / 分类专题</span>
          <span>{target.label} / {descriptor}</span>
        </footer>
      </SiteShell>
    </>
  );
}
