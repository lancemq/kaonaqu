'use client';

import { useState } from 'react';
import { RegionLink } from './region-link';
import { TIER_LABELS, TOP_TIER_SET, getDistrictLabel, getSchoolStage, getSchoolType } from '../lib/groups-data.mjs';

// 教育集团卡（client 岛）：仅管理成员校展开/收起，其余纯展示。
export default function GroupsCard({ group, districts }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className={`school-group-card${group.hasTopTier ? ' school-group-card-strong' : ''}`}>
      <button className="school-group-card-toggle" type="button" onClick={() => setIsExpanded(!isExpanded)} aria-expanded={isExpanded}>
        <span>{isExpanded ? '收起成员校' : '展开成员校'}</span>
      </button>
      <div className="school-group-card-head">
        <div>
          <p className="schools-datadesk-cardkicker">{group.districts.slice(0, 3).join(' / ') || '区域待补充'}</p>
          <h3>{group.name}</h3>
        </div>
        <div className="school-group-count">
          <strong>{group.schoolCount}</strong>
          <span>所学校</span>
        </div>
      </div>
      <p className="school-group-summary">{group.summary}</p>
      <div className="school-group-tags" aria-label={`${group.name}覆盖梯队`}>
        {group.tiers.length ? group.tiers.slice(0, 6).map((tier) => (
          <span key={tier} className={TOP_TIER_SET.has(tier) ? 'school-group-tag school-group-tag-strong' : 'school-group-tag'}>{TIER_LABELS[tier] || tier}</span>
        )) : <span className="school-group-tag school-group-tag-muted">—</span>}
      </div>
      <div className="school-group-meta">
        <span>{group.stages.join('、') || '—'}</span>
        <span>{group.districtIds.length} 个区域</span>
      </div>

      {isExpanded ? (
        <div className="school-group-members">
          {group.schools.map((school) => (
            <RegionLink key={school.id} className="school-group-member" href={`/schools/${school.id}`}>
              <div>
                <strong>{school.name}</strong>
                <span>{getDistrictLabel(districts, school.districtId)} · {getSchoolStage(school)} · {getSchoolType(school)}</span>
              </div>
              <span>{school.eliteCohort || school.schoolKeyLevel ? (TIER_LABELS[school.eliteCohort || school.schoolKeyLevel] || school.eliteCohort || school.schoolKeyLevel) : '详情'}</span>
            </RegionLink>
          ))}
        </div>
      ) : null}
    </article>
  );
}
