'use client';

import { useMemo, useState } from 'react';
import {
  buildRecommendations,
  getAllDistricts,
  getAllJuniorHighs,
  type RecommendationResult
} from '../lib/simulator-engine';

const CATEGORY_CONFIG: Record<RecommendationResult['category'], { label: string; className: string }> = {
  official_route: {
    label: '官方对口',
    className: 'official'
  },
  group_continuation: {
    label: '集团延续',
    className: 'group'
  },
  tier_match: {
    label: '层级匹配',
    className: 'tier'
  },
  same_district: {
    label: '本区学校',
    className: 'district'
  }
};

const TIER_OPTIONS = [
  { value: '四校', label: '四校' },
  { value: '八大', label: '八大' },
  { value: '市实验性示范性高中', label: '市实验性示范性高中' },
  { value: '四校分校', label: '四校分校' },
  { value: '八大分校', label: '八大分校' },
  { value: '一般高中', label: '一般高中' }
];

export default function SchoolsSimulatorClient() {
  const juniorHighs = useMemo(() => getAllJuniorHighs(), []);
  const districts = useMemo(() => getAllDistricts(), []);

  const [selectedJuniorId, setSelectedJuniorId] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [targetTier, setTargetTier] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedJunior = juniorHighs.find((junior) => junior.id === selectedJuniorId);

  const recommendations = useMemo(() => {
    if (!selectedJuniorId) {
      return [];
    }

    return buildRecommendations(selectedJuniorId, selectedDistrict || undefined, targetTier || undefined);
  }, [selectedJuniorId, selectedDistrict, targetTier]);

  const groupedResults = useMemo(() => {
    const groups: Partial<Record<RecommendationResult['category'], RecommendationResult[]>> = {};
    recommendations.forEach((result) => {
      if (!groups[result.category]) {
        groups[result.category] = [];
      }
      groups[result.category]?.push(result);
    });
    return groups;
  }, [recommendations]);

  const filteredJuniorHighs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return juniorHighs;
    }

    return juniorHighs.filter((junior) =>
      junior.name.toLowerCase().includes(term) || junior.districtName.toLowerCase().includes(term)
    );
  }, [juniorHighs, searchTerm]);

  const resetFilters = () => {
    setSelectedDistrict('');
    setTargetTier('');
  };

  return (
    <>
      <section className="schools-simulator-hero" aria-label="初升高志愿模拟">
        <div className="schools-simulator-hero-copy">
          <span className="overview-label">Volunteer Simulator</span>
          <h1>初升高志愿模拟</h1>
          <p>先选当前初中，再按区域和目标层级缩小范围，生成一份可继续比较的高中候选清单。</p>
        </div>
        <div className="schools-simulator-hero-panel">
          <span>当前数据</span>
          <strong>2026 年 4 月</strong>
          <p>结果用于择校前筛选，最终招生规则以官方当年发布为准。</p>
        </div>
      </section>

      <main className="schools-simulator-layout">
        <aside className="schools-simulator-controls" aria-label="模拟条件">
          <section className="schools-datadesk-panel schools-simulator-panel">
            <div className="schools-datadesk-panel-head">
              <span>Step 01</span>
              <h2>选择初中学校</h2>
            </div>

            <label className="schools-datadesk-searchfield schools-datadesk-searchfield-main" htmlFor="simulator-school-search">
              <span className="visually-hidden">搜索学校名称或区域</span>
              <input
                id="simulator-school-search"
                type="search"
                placeholder="搜索学校名称或区域"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label className="schools-datadesk-searchfield schools-datadesk-searchfield-select" htmlFor="simulator-junior-school">
              <span className="visually-hidden">选择初中学校</span>
              <select
                id="simulator-junior-school"
                value={selectedJuniorId}
                onChange={(event) => setSelectedJuniorId(event.target.value)}
              >
                <option value="">请选择初中</option>
                {filteredJuniorHighs.map((junior) => (
                  <option key={junior.id} value={junior.id}>
                    {junior.districtName} / {junior.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedJunior ? (
              <div className="schools-simulator-selected">
                <span>已选择</span>
                <strong>{selectedJunior.name}</strong>
                <p>{selectedJunior.districtName} / {selectedJunior.tier}</p>
                {selectedJunior.group ? <p>{selectedJunior.group}</p> : null}
              </div>
            ) : (
              <p className="schools-datadesk-panel-copy">输入学校名或区域后，从下拉框选择当前就读初中。</p>
            )}
          </section>

          <section className="schools-datadesk-panel schools-simulator-panel">
            <div className="schools-datadesk-panel-head">
              <span>Step 02</span>
              <h2>设置筛选条件</h2>
            </div>

            <div className="schools-datadesk-controls">
              <div className="schools-datadesk-controlblock">
                <span>目标区域</span>
                <label className="schools-datadesk-searchfield schools-datadesk-searchfield-select" htmlFor="simulator-district">
                  <span className="visually-hidden">目标区域</span>
                  <select
                    id="simulator-district"
                    value={selectedDistrict}
                    onChange={(event) => setSelectedDistrict(event.target.value)}
                  >
                    <option value="">全部区域</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="schools-datadesk-controlblock">
                <span>目标层级</span>
                <label className="schools-datadesk-searchfield schools-datadesk-searchfield-select" htmlFor="simulator-tier">
                  <span className="visually-hidden">目标层级</span>
                  <select id="simulator-tier" value={targetTier} onChange={(event) => setTargetTier(event.target.value)}>
                    <option value="">全部层级</option>
                    {TIER_OPTIONS.map((tier) => (
                      <option key={tier.value} value={tier.value}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <button className="schools-datadesk-button schools-datadesk-button-secondary" type="button" onClick={resetFilters}>
              清空筛选条件
            </button>
          </section>
        </aside>

        <section className="schools-simulator-results" aria-label="推荐结果">
          <div className="schools-datadesk-results-head">
            <span className="overview-label">Recommendation Desk</span>
            <h2>推荐结果</h2>
            <p>
              {selectedJuniorId
                ? `已生成 ${recommendations.length} 所高中候选学校。`
                : '选择初中后，这里会显示官方对口、集团延续、层级匹配和本区候选。'}
            </p>
          </div>

          {!selectedJuniorId ? (
            <div className="schools-simulator-empty">
              <strong>先选择当前初中</strong>
              <p>模拟结果会按匹配度排序，并按推荐来源分组。</p>
            </div>
          ) : null}

          {selectedJuniorId && recommendations.length === 0 ? (
            <div className="schools-simulator-empty">
              <strong>暂无匹配学校</strong>
              <p>可以放宽区域或层级条件，再重新查看候选清单。</p>
            </div>
          ) : null}

          {selectedJuniorId && recommendations.length > 0 ? (
            <div className="schools-simulator-groups">
              {(Object.keys(CATEGORY_CONFIG) as RecommendationResult['category'][]).map((category) => {
                const results = groupedResults[category];
                if (!results?.length) {
                  return null;
                }

                const config = CATEGORY_CONFIG[category];

                return (
                  <section className="schools-simulator-group" key={category}>
                    <div className="schools-simulator-group-head">
                      <span className={`schools-simulator-badge schools-simulator-badge-${config.className}`}>{config.label}</span>
                      <span>{results.length} 所</span>
                    </div>

                    <div className="schools-simulator-cardgrid">
                      {results.map((result) => (
                        <article className="schools-simulator-card" key={`${category}-${result.school.id}`}>
                          <div className="schools-simulator-card-head">
                            <div>
                              <span>{result.school.districtName}</span>
                              <h3>{result.school.name}</h3>
                            </div>
                            <strong>{result.school.tier}</strong>
                          </div>

                          <div className="schools-simulator-card-meta">
                            {result.school.address ? <p>{result.school.address}</p> : null}
                            {result.school.phone ? <p>{result.school.phone}</p> : null}
                            {result.school.group ? <p>{result.school.group}</p> : null}
                          </div>

                          <div className="schools-simulator-match">
                            <p>{result.reason}</p>
                            <div className="schools-simulator-score" aria-label={`匹配度 ${result.matchScore}%`}>
                              <span style={{ width: `${result.matchScore}%` }} />
                            </div>
                            <strong>{result.matchScore}% 匹配</strong>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
