import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import SiteShell from '../../../../components/site-shell';
import {
  getDistrictSchoolTopic,
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolOwnershipLabel,
  getSchoolStage,
  getSchoolTrainingDirections,
  getSchoolType
} from '../../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../../shared/data-store');

export const dynamic = 'force-dynamic';

function formatSchoolUpdate(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '时间待补充';
  }
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!match) {
    return text;
  }
  const [, year, month, day, hour, minute] = match;
  if (hour && minute) {
    return `${year}.${month}.${day} ${hour}:${minute}`;
  }
  return `${year}.${month}.${day}`;
}

function getUpdateSortValue(value) {
  const text = String(value || '').trim();
  if (!text) {
    return 0;
  }
  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }
  return 0;
}

function clipText(text, maxLength = 84) {
  const value = String(text || '').trim();
  if (!value || value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength).trim()}...`;
}

function buildCardTags(school) {
  const values = [
    ...(school.tags || []),
    ...(school.features || []),
    ...getSchoolTrainingDirections(school)
  ].filter(Boolean);
  return Array.from(new Set(values)).slice(0, 4);
}

function sortSchoolsBySignal(list) {
  return list
    .slice()
    .sort((left, right) => {
      const rightSignal = (right.features?.length || 0) + (right.tags?.length || 0);
      const leftSignal = (left.features?.length || 0) + (left.tags?.length || 0);
      return rightSignal - leftSignal || getUpdateSortValue(right.updatedAt) - getUpdateSortValue(left.updatedAt);
    });
}

export async function generateMetadata({ params }) {
  const { districts } = await loadDataStore();
  const { district } = await params;
  const districtInfo = districts.find((item) => item.id === district);
  if (!districtInfo) {
    return { title: '区级学校专题 | 考哪去' };
  }

  return {
    title: `${districtInfo.name}学校专题 | 考哪去`,
    description: `集中查看${districtInfo.name}的学校分布、重点学校和培养方向。`
  };
}

export default async function DistrictSchoolsPage({ params }) {
  const { districts, schools } = await loadDataStore();
  const { district } = await params;
  const districtInfo = districts.find((item) => item.id === district);

  if (!districtInfo) {
    notFound();
  }

  const districtSchools = schools.filter((school) => school.districtId === districtInfo.id);
  const sortedSchools = sortSchoolsBySignal(districtSchools);
  const stageBuckets = {
    junior: sortedSchools.filter((school) => school.schoolStage === 'junior'),
    senior_high: sortedSchools.filter((school) => school.schoolStage === 'senior_high'),
    complete: sortedSchools.filter((school) => school.schoolStage === 'complete')
  };
  const featured = sortedSchools.slice(0, 6);
  const latestUpdated = formatSchoolUpdate(sortedSchools[0]?.updatedAt);
  const relatedDistricts = districts
    .filter((item) => item.id !== districtInfo.id)
    .slice()
    .sort((left, right) => Number(right.schoolCount || 0) - Number(left.schoolCount || 0))
    .slice(0, 5);

  const districtDescriptor = [
    `${districtSchools.length} 所学校`,
    `${stageBuckets.senior_high.length} 所高中`,
    `${stageBuckets.junior.length} 所初中`,
    `${stageBuckets.complete.length} 所完全中学`
  ].join(' · ');

  const stageGroups = [
    { id: 'senior_high', label: '高中', items: stageBuckets.senior_high, note: '适合中招阶段直接比较高中。' },
    { id: 'junior', label: '初中', items: stageBuckets.junior, note: '适合小升初与初中阶段择校。' },
    { id: 'complete', label: '完全中学', items: stageBuckets.complete, note: '适合关注初高中贯通培养路径。' }
  ].filter((group) => group.items.length);

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero" id="top">
        <section className="district-datadesk-hero" aria-label="区级学校专题">
          <div className="district-datadesk-hero-grid">
            <div className="district-datadesk-hero-main">
              <p className="overview-label">District Database</p>
              <h1>{districtInfo.name}学校专题</h1>
              <p className="district-datadesk-subtitle">{getDistrictSchoolTopic(districtInfo)}</p>
              <p className="district-datadesk-description">这页把 {districtInfo.name} 的学校按区域数据库方式重组，先看区内学校结构和优先学校，再决定进入学校详情还是返回全市学校库继续比较。</p>
              <div className="district-datadesk-actions">
                <Link className="button" href={`/schools?district=${districtInfo.id}`}>{districtInfo.name}学校检索</Link>
                <Link className="button button-secondary" href="/schools">返回全市学校数据库</Link>
              </div>
              <div className="district-datadesk-inline-meta">
                <span>区域结构优先</span>
                <span>先看学段分布</span>
                <span>再选具体学校</span>
              </div>
            </div>

            <div className="district-datadesk-summary-grid">
              <article className="district-datadesk-summary-card district-datadesk-summary-card-strong">
                <span>学校总量</span>
                <strong>{districtSchools.length}</strong>
                <p>{districtInfo.name} 当前收录学校条目</p>
              </article>
              <article className="district-datadesk-summary-card">
                <span>最近更新</span>
                <strong>{latestUpdated}</strong>
                <p>本区学校数据最近一次收录时间</p>
              </article>
              <article className="district-datadesk-summary-card">
                <span>高中 / 初中</span>
                <strong>{stageBuckets.senior_high.length} / {stageBuckets.junior.length}</strong>
                <p>纯高中与纯初中分布</p>
              </article>
              <article className="district-datadesk-summary-card">
                <span>完全中学</span>
                <strong>{stageBuckets.complete.length}</strong>
                <p>适合看连续培养路径的学校数量</p>
              </article>
            </div>
          </div>
        </section>
      </header>

      <section className="district-datadesk-statusbar" aria-label="区级数据库状态">
        <span className="district-datadesk-statuslabel">District Status</span>
        <span>{districtInfo.name} / {districtDescriptor}</span>
      </section>

      <main className="layout district-datadesk-layout">
        <aside className="district-datadesk-sidebar">
          <section className="district-datadesk-panel district-datadesk-panel-dark">
            <div className="district-datadesk-panel-head">
              <p className="overview-label">本区读法</p>
              <span>{districtInfo.name}</span>
            </div>
            <p className="district-datadesk-panel-copy">先看这个区的学段结构和学校密度，再决定是继续按学段深入，还是先从头部学校进入详情。</p>
            <div className="district-datadesk-stack">
              <span>纯高中 {stageBuckets.senior_high.length}</span>
              <span>纯初中 {stageBuckets.junior.length}</span>
              <span>完全中学 {stageBuckets.complete.length}</span>
            </div>
          </section>

          <section className="district-datadesk-panel">
            <div className="district-datadesk-panel-head">
              <p className="overview-label">学段分布</p>
              <span>本区结构</span>
            </div>
            <div className="district-datadesk-breakdown">
              {stageGroups.map((group) => (
                <article key={group.id} className="district-datadesk-breakdown-card">
                  <strong>{group.label}</strong>
                  <span>{group.items.length} 所</span>
                  <p>{group.note}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="district-datadesk-panel">
            <div className="district-datadesk-panel-head">
              <p className="overview-label">相关区域</p>
              <span>继续横向看区</span>
            </div>
            <div className="district-datadesk-related">
              {relatedDistricts.map((item) => (
                <Link key={item.id} className="district-datadesk-related-link" href={`/schools/district/${item.id}`}>
                  <strong>{item.name}</strong>
                  <span>{item.schoolCount || 0} 所学校</span>
                </Link>
              ))}
            </div>
          </section>
        </aside>

        <section className="district-datadesk-results">
          <section className="district-datadesk-panel">
            <div className="district-datadesk-results-head">
              <div>
                <p className="overview-label">本区优先阅读</p>
                <h2>{districtInfo.name}优先学校</h2>
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
                        <p className="district-datadesk-cardkicker">{getSchoolDistrictName(school)} / {getSchoolStage(school)} / {getSchoolOwnershipLabel(school) || '学校信息'}</p>
                        <h3>{school.name}</h3>
                      </div>
                      <div className="district-datadesk-cardmeta">
                        <span>{getSchoolType(school)}</span>
                        <span>{formatSchoolUpdate(school.updatedAt)}</span>
                      </div>
                    </div>
                    <p className="district-datadesk-cardsummary">{clipText(getSchoolAdmissionInfo(school) || school.schoolDescription || '学校信息持续整理中。')}</p>
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
                  <h2>{districtInfo.name}{group.label}学校</h2>
                </div>
                <p>{group.note}</p>
              </div>
              <div className="district-datadesk-schoolgrid">
                {group.items.slice(0, 9).map((school) => (
                  <Link key={school.id} href={`/schools/${school.id}`} className="district-datadesk-schoolitem">
                    <strong>{school.name}</strong>
                    <span>{getSchoolOwnershipLabel(school) || '学校信息'} / {formatSchoolUpdate(school.updatedAt)}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </section>
      </main>

      <footer className="prototype-page-footer">
        <span>上海学校数据库 / 区域专题页</span>
        <span>{districtInfo.name} / 区域结构 / 学段分布 / 学校详情</span>
      </footer>
    </SiteShell>
  );
}
