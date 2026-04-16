'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getSchoolDistrictName,
  getSchoolStage,
  getSchoolType,
  getSchoolOwnershipLabel
} from '../lib/site-utils';

// 梯队颜色映射
const tierColors = {
  '四校': 'schools-compare-tier-four',
  '四校分校': 'schools-compare-tier-four-branch',
  '八大': 'schools-compare-tier-eight',
  '八大分校': 'schools-compare-tier-eight-branch',
  '市实验性示范性高中': 'schools-compare-tier-city-demo',
  '区重点': 'schools-compare-tier-district-key',
  '一般高中': 'schools-compare-tier-regular',
  '民办高中': 'schools-compare-tier-private',
  '国际课程': 'schools-compare-tier-international',
  '公办初中': 'schools-compare-tier-public-junior',
  '民办初中': 'schools-compare-tier-private-junior',
};

function formatSchoolUpdate(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '时间待补充';
  }
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (match) {
    const [, year, month, day, hour, minute] = match;
    if (hour && minute) {
      return `${year}.${month}.${day} ${hour}:${minute}`;
    }
    return `${year}.${month}.${day}`;
  }
  return text;
}

export default function SchoolsCompareClient({ schools, initialSchools }) {
  const router = useRouter();

  // 初始选中的学校 ID 列表
  const initialIds = initialSchools ? initialSchools.split(',') : [];
  const [selectedIds, setSelectedIds] = useState(initialIds);
  const [searchQuery, setSearchQuery] = useState('');

  // 获取选中的学校对象
  const selectedSchools = useMemo(() => {
    return selectedIds
      .map(id => schools.find(s => s.id === id))
      .filter(Boolean);
  }, [selectedIds, schools]);

  // 搜索建议
  const suggestions = useMemo(() => {
    if (!searchQuery) return [];
    return schools.filter(s =>
      s.name.includes(searchQuery) && !selectedIds.includes(s.id)
    ).slice(0, 10);
  }, [searchQuery, schools, selectedIds]);

  // 添加学校
  const addSchool = (id) => {
    if (selectedIds.length >= 3) {
      alert('最多只能对比 3 所学校');
      return;
    }
    if (!selectedIds.includes(id)) {
      const newIds = [...selectedIds, id];
      setSelectedIds(newIds);
      router.push(`/schools/compare?schools=${newIds.join(',')}`);
      setSearchQuery('');
    }
  };

  // 移除学校
  const removeSchool = (id) => {
    const newIds = selectedIds.filter(sid => sid !== id);
    setSelectedIds(newIds);
    router.push(`/schools/compare?schools=${newIds.join(',')}`);
  };

  // 清空
  const clearAll = () => {
    setSelectedIds([]);
    router.push('/schools/compare');
  };

  // 生成高德地图链接
  const getMapUrl = (school) => {
    return `https://www.amap.com/search?query=${encodeURIComponent(school.name + ' ' + (school.address || getSchoolDistrictName(school)))}`;
  };

  return (
    <>
      <header className="hero" id="top">
        <section className="schools-compare-datadesk-hero" aria-label="学校多维对比">
          <div className="schools-compare-datadesk-hero-grid">
            <div className="schools-compare-datadesk-intro">
              <p className="overview-label">School Comparison</p>
              <h1>学校多维对比</h1>
              <p className="schools-compare-datadesk-subtitle">最多选择 3 所学校进行全方位参数对比，包括梯队、集团、地址、联系方式与特色标签。</p>
              <div className="schools-compare-datadesk-search-row">
                <label className="schools-compare-datadesk-searchfield" htmlFor="compare-school-search">
                  <span className="visually-hidden">搜索学校添加对比</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"></path>
                  </svg>
                  <input
                    id="compare-school-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="输入学校名称添加对比..."
                  />
                </label>
                <div className="schools-compare-datadesk-status">
                  <span>已选</span>
                  <strong>{selectedIds.length}/3</strong>
                </div>
              </div>
              {suggestions.length > 0 && (
                <ul className="schools-compare-suggestions">
                  {suggestions.map(s => (
                    <li
                      key={s.id}
                      onClick={() => addSchool(s.id)}
                    >
                      <strong>{s.name}</strong>
                      <span>{getSchoolDistrictName(s)} / {getSchoolStage(s)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="schools-compare-datadesk-selected">
                {selectedSchools.length > 0 ? (
                  <>
                    <p className="overview-label">已选学校</p>
                    <div className="schools-compare-selected-tags">
                      {selectedSchools.map(s => (
                        <div key={s.id} className="schools-compare-selected-tag">
                          <strong>{s.name}</strong>
                          <button onClick={() => removeSchool(s.id)} title="移除">×</button>
                        </div>
                      ))}
                    </div>
                    <button className="schools-compare-datadesk-button schools-compare-datadesk-button-secondary" type="button" onClick={clearAll}>清空全部</button>
                  </>
                ) : (
                  <p className="schools-compare-datadesk-empty">暂未选择学校，请在上方搜索添加</p>
                )}
              </div>
            </div>

            <div className="schools-compare-datadesk-summary-grid">
              <article className="schools-compare-datadesk-summary-card">
                <span>对比容量</span>
                <strong>最多 3 所</strong>
                <p>同时对比 3 所学校的核心参数</p>
              </article>
              <article className="schools-compare-datadesk-summary-card">
                <span>数据库总量</span>
                <strong>{schools.length}</strong>
                <p>当前收录可对比学校数量</p>
              </article>
              <article className="schools-compare-datadesk-summary-card">
                <span>对比维度</span>
                <strong>6+</strong>
                <p>梯队、集团、区域、类型、联系方式</p>
              </article>
            </div>
          </div>
        </section>
      </header>

      {/* 对比结果卡片 */}
      {selectedSchools.length > 0 ? (
        <section className="schools-compare-datadesk-results" aria-label="对比结果">
          <div className="schools-compare-datadesk-grid">
            {selectedSchools.map(school => (
              <article key={school.id} className="schools-compare-datadesk-card">
                <div className="schools-compare-datadesk-cardhead">
                  <div className="schools-compare-datadesk-cardhead-main">
                    <Link href={`/schools/${school.id}`} className="schools-compare-datadesk-cardlink">
                      <h3>{school.name}</h3>
                    </Link>
                    <a href={getMapUrl(school)} target="_blank" rel="noopener noreferrer" className="schools-compare-maplink">
                      📍 查看地图
                    </a>
                  </div>
                  <div className="schools-compare-datadesk-cardtags">
                    {school.tier && (
                      <span className={`schools-compare-tag ${tierColors[school.tier] || ''}`}>
                        {school.tier}
                      </span>
                    )}
                    {school.group && (
                      <span className="schools-compare-tag schools-compare-tag-group">
                        {school.group}
                      </span>
                    )}
                  </div>
                </div>

                <div className="schools-compare-datadesk-cardbody">
                  <section className="schools-compare-datadesk-section">
                    <h4>基本信息</h4>
                    <dl className="schools-compare-facts">
                      <div>
                        <dt>区域</dt>
                        <dd>{getSchoolDistrictName(school)}</dd>
                      </div>
                      <div>
                        <dt>类型</dt>
                        <dd>{getSchoolType(school)}</dd>
                      </div>
                      <div>
                        <dt>学段</dt>
                        <dd>{getSchoolStage(school)}</dd>
                      </div>
                      <div>
                        <dt>办学性质</dt>
                        <dd>{getSchoolOwnershipLabel(school)}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="schools-compare-datadesk-section">
                    <h4>联系方式</h4>
                    <div className="schools-compare-contact">
                      {school.address ? (
                        <p><span className="schools-compare-contact-label">地址</span> {school.address}</p>
                      ) : (
                        <p className="schools-compare-contact-empty">地址暂未录入</p>
                      )}
                      {school.phone ? (
                        <p><span className="schools-compare-contact-label">电话</span> {school.phone}</p>
                      ) : (
                        <p className="schools-compare-contact-empty">电话暂未录入</p>
                      )}
                      {school.website ? (
                        <p><span className="schools-compare-contact-label">官网</span> <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-link">{school.website}</a></p>
                      ) : (
                        <p className="schools-compare-contact-empty">官网暂未录入</p>
                      )}
                    </div>
                  </section>

                  <section className="schools-compare-datadesk-section">
                    <h4>特色标签</h4>
                    <div className="schools-compare-tags">
                      {(school.features && school.features.length > 0 ? school.features : school.tags || []).slice(0, 8).map(tag => (
                        <span key={tag} className="schools-compare-tag">
                          {tag}
                        </span>
                      ))}
                      {(school.features?.length || school.tags?.length || 0) === 0 && (
                        <span className="schools-compare-tag-empty">标签待补充</span>
                      )}
                    </div>
                  </section>
                </div>

                <div className="schools-compare-datadesk-cardfoot">
                  <Link href={`/schools/${school.id}`} className="schools-compare-datadesk-button">
                    查看完整详情
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="schools-compare-datadesk-empty-state" aria-label="空状态">
          <div className="schools-compare-datadesk-empty-card">
            <div className="schools-compare-datadesk-empty-icon">⚖️</div>
            <h3>暂无对比数据</h3>
            <p>请搜索并添加学校开始对比</p>
          </div>
        </section>
      )}

      <footer className="prototype-page-footer">
        <span>上海学校数据库 / 学校多维对比</span>
        <span>梯队对比 / 集团对比 / 参数对比 / {schools.length} 所学校</span>
      </footer>
    </>
  );
}
