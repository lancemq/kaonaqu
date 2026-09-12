'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegionLink } from './region-link';
import { regionPath } from '../shared/region-path.mjs';
import { buildSchoolsHref } from '../lib/schools-list-url.mjs';
import { useRegion } from './region-context';
import { useCompareBag } from './compare-bag';

// 学校列表页筛选侧栏（client 岛）：所有筛选变更经 URL 导航触发服务端重取，
// 服务端是唯一数据源；本组件只管理手风琴开合与对比篮展示。
function FilterSection({ id, label, open, onToggle, active, badge, children }) {
  return (
    <section className={`schools-aerial-filter-block schools-aerial-section ${open ? 'is-open' : 'is-closed'}`}>
      <button type="button" className="schools-aerial-section-head" onClick={() => onToggle(id)} aria-expanded={open}>
        <span className="schools-aerial-section-title">
          {label}
          {active ? <i className="schools-aerial-section-flag" aria-hidden="true" /> : null}
        </span>
        <span className="schools-aerial-section-right">
          {badge != null ? <span className="schools-aerial-section-badge">{badge}</span> : null}
          <i className="schools-aerial-section-chevron" aria-hidden="true" />
        </span>
      </button>
      {open ? <div className="schools-aerial-section-body">{children}</div> : null}
    </section>
  );
}

export default function SchoolsFilterSidebar({ districts, filters, filterOptions }) {
  const router = useRouter();
  const { region, features } = useRegion();
  const { ids: bagIds, ready: bagReady, clear: clearBag, max: bagMax } = useCompareBag();

  const navigate = (next) => {
    router.push(regionPath(buildSchoolsHref(filters, next), region));
  };

  const activeDistrict = filters.district;
  const activeStage = filters.stage;
  const activeProperty = filters.property;
  const activeKeyLevel = filters.keyLevel;
  const activeCohort = filters.cohort;
  const activeBoarding = filters.boarding;
  const activeInternational = filters.international;
  const activeFeatures = Array.isArray(filters.features) ? filters.features : [];

  const highlightedDistricts = useMemo(
    () => districts.slice().sort((left, right) => Number(right.schoolCount || 0) - Number(left.schoolCount || 0)).slice(0, 6),
    [districts]
  );

  const toggleFeature = (fid) => {
    const next = activeFeatures.includes(fid)
      ? activeFeatures.filter((id) => id !== fid)
      : [...activeFeatures, fid];
    navigate({ features: next });
  };

  // 侧栏手风琴：默认展开高频筛选，次要条件收进「更多条件 / 工具与导航」
  const [openSections, setOpenSections] = useState(() => new Set(['district', 'stage', 'cohort', 'keyLevel', 'feature']));
  const toggleSection = (id) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const moreActive = activeProperty !== 'all' || activeBoarding !== 'all' || activeInternational !== 'all';

  return (
    <aside className="schools-aerial-sidebar" aria-label="筛选条件">
      <div className="schools-aerial-sidebar-head">
        <div className="channel-kicker"><span aria-hidden="true"></span><p>FILTER</p></div>
        <h2>筛选条件</h2>
      </div>

      <section className="schools-aerial-filter-block schools-aerial-basket-top">
        <div className="schools-aerial-compare-basket">
          <span>{bagReady ? `${bagIds.length}/${bagMax}` : `0/${bagMax}`} 所</span>
          <RegionLink href="/schools/compare">查看对比 →</RegionLink>
          {bagReady && bagIds.length > 0 && (
            <button type="button" className="schools-aerial-compare-clear" onClick={() => clearBag()}>清空</button>
          )}
        </div>
      </section>

      <FilterSection id="district" label="区域" open={openSections.has('district')} onToggle={toggleSection} active={activeDistrict !== 'all'}>
        <select
          id="prototype-district-filter"
          value={activeDistrict}
          onChange={(event) => navigate({ district: event.target.value })}
        >
          <option value="all">全部区域</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>{district.name || district.districtName}</option>
          ))}
        </select>
      </FilterSection>

      <FilterSection id="stage" label="学段" open={openSections.has('stage')} onToggle={toggleSection} active={activeStage !== 'all'}>
        <div className="schools-aerial-filter-stack">
          {filterOptions.stage.map((option) => (
            <button key={option} type="button" className={activeStage === option ? 'is-active' : ''} onClick={() => navigate({ stage: activeStage === option ? 'all' : option })}>
              {option}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection id="cohort" label={region === 'suzhou' ? '办学星级' : '荣誉'} open={openSections.has('cohort')} onToggle={toggleSection} active={activeCohort !== 'all'}>
        <div className="schools-aerial-filter-stack">
          {filterOptions.cohort.map((option) => (
            <button key={option} type="button" className={activeCohort === option ? 'is-active' : ''} onClick={() => navigate({ cohort: activeCohort === option ? 'all' : option })}>
              {option}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection id="keyLevel" label="等级" open={openSections.has('keyLevel')} onToggle={toggleSection} active={activeKeyLevel !== 'all'}>
        <div className="schools-aerial-filter-stack">
          {filterOptions.keyLevel.map((option) => (
            <button key={option} type="button" className={activeKeyLevel === option ? 'is-active' : ''} onClick={() => navigate({ keyLevel: activeKeyLevel === option ? 'all' : option })}>
              {option}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection id="feature" label="特色标签" open={openSections.has('feature')} onToggle={toggleSection} active={activeFeatures.length > 0}>
        <div className="schools-aerial-filter-stack schools-aerial-feature-chips">
          {filterOptions.featureFilters.map((option) => (
            <button key={option.id} type="button" className={activeFeatures.includes(option.id) ? 'is-active' : ''} onClick={() => toggleFeature(option.id)}>
              {option.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection id="more" label="更多条件" open={openSections.has('more')} onToggle={toggleSection} active={moreActive}>
        <div className="schools-aerial-subgroup">
          <div className="schools-aerial-filter-block">
            <label>办学性质</label>
            <div className="schools-aerial-filter-stack">
              {filterOptions.property.map((option) => (
                <button key={option} type="button" className={activeProperty === option ? 'is-active' : ''} onClick={() => navigate({ property: activeProperty === option ? 'all' : option })}>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="schools-aerial-filter-block">
            <label>寄宿 / 走读</label>
            <div className="schools-aerial-filter-stack">
              <button type="button" className={activeBoarding === 'boarding' ? 'is-active' : ''} onClick={() => navigate({ boarding: activeBoarding === 'boarding' ? 'all' : 'boarding' })}>寄宿制</button>
              <button type="button" className={activeBoarding === 'day' ? 'is-active' : ''} onClick={() => navigate({ boarding: activeBoarding === 'day' ? 'all' : 'day' })}>走读</button>
            </div>
          </div>

          <div className="schools-aerial-filter-block">
            <label>国际课程</label>
            <div className="schools-aerial-filter-stack">
              <button type="button" className={activeInternational === 'international' ? 'is-active' : ''} onClick={() => navigate({ international: activeInternational === 'international' ? 'all' : 'international' })}>国际课程 / 中外合作</button>
            </div>
          </div>
        </div>
      </FilterSection>

      <FilterSection
        id="tools"
        label="工具与导航"
        open={openSections.has('tools')}
        onToggle={toggleSection}
        badge={bagReady && bagIds.length > 0 ? bagIds.length : null}
      >
        <div className="schools-aerial-subgroup">
          <div className="schools-aerial-filter-block">
            <label>快速工具</label>
            <div className="schools-aerial-tool-stack">
              <RegionLink href="/schools/compare"><span>学校对比</span><i>→</i></RegionLink>
              <RegionLink href="/schools/score-match"><span>分数匹配</span><i>→</i></RegionLink>
              <RegionLink href="/news/admission-timeline"><span>政策日历</span><i>→</i></RegionLink>
              {features.groups && (
                <RegionLink href="/schools/groups"><span>教育集团</span><i>→</i></RegionLink>
              )}
              <RegionLink href="/schools/district"><span>区域专题</span><i>→</i></RegionLink>
            </div>
          </div>

          <div className="schools-aerial-filter-block">
            <label>热门区域</label>
            <div className="schools-aerial-tool-stack">
              {highlightedDistricts.map((district) => (
                <RegionLink key={district.id} href={`/schools/district/${district.id}`}>
                  <span>{district.name || district.districtName}</span>
                  <i>{district.schoolCount || 0} 所</i>
                </RegionLink>
              ))}
            </div>
          </div>
        </div>
      </FilterSection>

      <button
        className="schools-aerial-reset"
        type="button"
        onClick={() => router.push(regionPath('/schools', region))}
      >
        清空全部条件
      </button>
    </aside>
  );
}
