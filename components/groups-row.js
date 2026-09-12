'use client';

import { useState } from 'react';
import { RegionLink } from './region-link';
import { getDistrictLabel, getSchoolStage, getSchoolType } from '../lib/groups-data.mjs';

// 区域联盟/特色集团行卡（client 岛）：仅管理成员校展开/收起。
export default function GroupsRow({ group, districts }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="school-groups-aerial-row">
      <div>
        <strong>{group.name}</strong>
        <span>{group.districts.slice(0, 4).join(' / ') || '区域待补充'}</span>
      </div>
      <p>{group.summary}</p>
      <button type="button" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? '收起' : '展开'}
      </button>
      {isExpanded ? (
        <div className="school-group-members">
          {group.schools.slice(0, 8).map((school) => (
            <RegionLink key={school.id} href={`/schools/${school.id}`}>
              <strong>{school.name}</strong>
              <span>{getDistrictLabel(districts, school.districtId || school.district)} / {getSchoolStage(school)} / {getSchoolType(school)}</span>
            </RegionLink>
          ))}
        </div>
      ) : null}
    </article>
  );
}
