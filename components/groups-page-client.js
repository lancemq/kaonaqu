'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

const tierLabels = {
  '四校': '四校',
  '四校分校': '四校分校',
  '八大': '八大',
  '八大分校': '八大分校',
  '市实验性示范性高中': '市重点',
  '区重点': '区重点',
  '一般高中': '一般高中',
  '民办高中': '民办高中',
  '国际课程': '国际课程',
  '公办初中': '公办初中',
  '民办初中': '民办初中',
  '公办完全中学': '公办完中',
  '民办完全中学': '民办完中',
  '国际课程': '国际课程',
};

const tierColors = {
  '四校': '#e60012',
  '四校分校': '#ff4d4f',
  '八大': '#fa8c16',
  '八大分校': '#ffa940',
  '市实验性示范性高中': '#722ed1',
  '区重点': '#1890ff',
  '一般高中': '#52c41a',
  '民办高中': '#13c2c2',
  '国际课程': '#eb2f96',
  '公办初中': '#1890ff',
  '民办初中': '#13c2c2',
  '公办完全中学': '#722ed1',
  '民办完全中学': '#eb2f96',
};

export default function GroupsPageClient({ districts, schools, news, initialDistrict, initialStage, initialTier, initialQuery }) {
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [selectedStage, setSelectedStage] = useState(initialStage);
  const [selectedTier, setSelectedTier] = useState(initialTier);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [expandedGroup, setExpandedGroup] = useState(null);

  // 预处理集团数据
  const groupsData = useMemo(() => {
    const groupsMap = {};
    
    for (const school of schools) {
      const group = school.group;
      if (!group) continue;
      
      if (!groupsMap[group]) {
        groupsMap[group] = {
          name: group,
          schools: [],
          districts: new Set(),
          stages: new Set(),
          tiers: new Set(),
          hasTopTier: false,
          schoolCount: 0,
        };
      }
      
      groupsMap[group].schools.push(school);
      groupsMap[group].districts.add(school.districtName);
      groupsMap[group].stages.add(school.schoolStageLabel);
      
      const tier = school.tier;
      if (tier) {
        groupsMap[group].tiers.add(tier);
        if (['四校', '四校分校', '八大', '八大分校', '市实验性示范性高中'].includes(tier)) {
          groupsMap[group].hasTopTier = true;
        }
      }
      groupsMap[group].schoolCount++;
    }
    
    // 转换为数组并排序
    return Object.values(groupsMap)
      .map(g => ({
        ...g,
        districts: Array.from(g.districts),
        stages: Array.from(g.stages),
        tiers: Array.from(g.tiers),
      }))
      .sort((a, b) => {
        // 优先按是否有顶级梯队排序，然后按学校数量排序
        if (a.hasTopTier !== b.hasTopTier) return b.hasTopTier - a.hasTopTier;
        return b.schoolCount - a.schoolCount;
      });
  }, [schools]);

  // 筛选集团
  const filteredGroups = useMemo(() => {
    return groupsData.filter(group => {
      // 区域筛选
      if (selectedDistrict !== 'all' && !group.districts.includes(
        districts.find(d => d.id === selectedDistrict)?.name
      )) {
        return false;
      }
      
      // 学段筛选
      if (selectedStage !== 'all') {
        const stageLabels = {
          'junior': '初中',
          'senior_high': '高中',
          'complete': '完全中学',
        };
        if (!group.stages.includes(stageLabels[selectedStage])) {
          return false;
        }
      }
      
      // 梯队筛选
      if (selectedTier !== 'all') {
        if (!group.tiers.includes(selectedTier)) {
          return false;
        }
      }
      
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          group.name.toLowerCase().includes(query) ||
          group.schools.some(s => s.name.toLowerCase().includes(query)) ||
          group.districts.some(d => d.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [groupsData, selectedDistrict, selectedStage, selectedTier, searchQuery, districts]);

  // 获取所有梯队
  const allTiers = useMemo(() => {
    const tiers = new Set();
    for (const group of groupsData) {
      for (const tier of group.tiers) {
        tiers.add(tier);
      }
    }
    return Array.from(tiers).sort();
  }, [groupsData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="text-purple-600">🏫</span> 上海教育集团
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                按教育集团检索学校，了解各集团成员校分布与梯队构成
              </p>
            </div>
            <Link 
              href="/schools"
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              ← 返回学校列表
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{groupsData.length}</div>
              <div className="text-xs text-gray-600">教育集团</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-indigo-600">{schools.length}</div>
              <div className="text-xs text-gray-600">成员学校</div>
            </div>
            <div className="bg-pink-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-pink-600">{new Set(groupsData.flatMap(g => g.tiers)).size}</div>
              <div className="text-xs text-gray-600">覆盖梯队</div>
            </div>
          </div>
          
          {/* Filters */}
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="搜索集团名称、学校名称或区域..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Filter Row */}
            <div className="flex flex-wrap gap-2">
              {/* District Filter */}
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">全部区域</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              
              {/* Stage Filter */}
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">全部学段</option>
                <option value="junior">初中</option>
                <option value="senior_high">高中</option>
                <option value="complete">完全中学</option>
              </select>
              
              {/* Tier Filter */}
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">全部梯队</option>
                {allTiers.map(tier => (
                  <option key={tier} value={tier}>{tierLabels[tier] || tier}</option>
                ))}
              </select>
              
              {/* Clear Filters */}
              {(selectedDistrict !== 'all' || selectedStage !== 'all' || selectedTier !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedDistrict('all');
                    setSelectedStage('all');
                    setSelectedTier('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  清除筛选
                </button>
              )}
              
              <div className="ml-auto text-sm text-gray-500 flex items-center">
                找到 {filteredGroups.length} 个教育集团
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Groups List */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到匹配的教育集团</h3>
            <p className="text-sm text-gray-500">请尝试调整筛选条件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.name}
                group={group}
                isExpanded={expandedGroup === group.name}
                onToggle={() => setExpandedGroup(expandedGroup === group.name ? null : group.name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupCard({ group, isExpanded, onToggle }) {
  const { name, schools, districts, stages, tiers, hasTopTier, schoolCount } = group;
  
  // 按梯队排序学校
  const tierOrder = ['四校', '四校分校', '八大', '八大分校', '市实验性示范性高中', '区重点', '一般高中', '民办高中', '国际课程', '公办初中', '民办初中', '公办完全中学', '民办完全中学'];
  const sortedSchools = [...schools].sort((a, b) => {
    const tierA = tierOrder.indexOf(a.tier);
    const tierB = tierOrder.indexOf(b.tier);
    return (tierA === -1 ? 999 : tierA) - (tierB === -1 ? 999 : tierB);
  });

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
      hasTopTier ? 'border-purple-200' : 'border-gray-200'
    }`}>
      {/* Card Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {hasTopTier && <span className="text-purple-600 mr-1">⭐</span>}
              {name}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {districts.slice(0, 3).map(d => (
                <span key={d} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {d}
                </span>
              ))}
              {districts.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  +{districts.length - 3}
                </span>
              )}
            </div>
          </div>
          <div className="text-right ml-3">
            <div className="text-2xl font-bold text-purple-600">{schoolCount}</div>
            <div className="text-xs text-gray-500">所学校</div>
          </div>
        </div>
        
        {/* Tiers */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tiers.map(tier => (
            <span
              key={tier}
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: `${tierColors[tier] || '#9ca3af'}15`,
                color: tierColors[tier] || '#6b7280',
              }}
            >
              {tierLabels[tier] || tier}
            </span>
          ))}
        </div>
        
        {/* Stages */}
        <div className="flex flex-wrap gap-1.5">
          {stages.map(stage => (
            <span key={stage} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">
              {stage}
            </span>
          ))}
        </div>
        
        {/* Expand Icon */}
        <div className="mt-3 flex justify-center">
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Expanded School List */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">成员学校列表</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedSchools.map((school) => (
              <Link
                key={school.id}
                href={`/schools/${school.id}`}
                className="flex items-center justify-between p-2.5 bg-white rounded-lg hover:bg-purple-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-700">
                    {school.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {school.districtName} · {school.schoolStageLabel}
                  </div>
                </div>
                {school.tier && (
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium ml-2 flex-shrink-0"
                    style={{
                      backgroundColor: `${tierColors[school.tier] || '#9ca3af'}15`,
                      color: tierColors[school.tier] || '#6b7280',
                    }}
                  >
                    {tierLabels[school.tier] || school.tier}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
