'use client';

import { useState, useMemo } from 'react';
import { 
  getAllJuniorHighs, 
  getAllDistricts, 
  buildRecommendations,
  type RecommendationResult 
} from '../../../lib/simulator-engine';

const CATEGORY_CONFIG = {
  official_route: {
    label: '🎯 官方对口',
    color: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  group_continuation: {
    label: '🏫 集团直升',
    color: 'bg-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  tier_match: {
    label: '📊 层级匹配',
    color: 'bg-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
  same_district: {
    label: '📍 本区学校',
    color: 'bg-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
  },
};

export default function SimulatorPage() {
  const juniorHighs = useMemo(() => getAllJuniorHighs(), []);
  const districts = useMemo(() => getAllDistricts(), []);

  const [selectedJuniorId, setSelectedJuniorId] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [targetTier, setTargetTier] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedJunior = juniorHighs.find(j => j.id === selectedJuniorId);

  const recommendations = useMemo(() => {
    if (!selectedJuniorId) return [];
    return buildRecommendations(
      selectedJuniorId,
      selectedDistrict || undefined,
      targetTier || undefined
    );
  }, [selectedJuniorId, selectedDistrict, targetTier]);

  // Group recommendations by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, RecommendationResult[]> = {};
    recommendations.forEach(r => {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    });
    return groups;
  }, [recommendations]);

  const filteredJuniorHighs = useMemo(() => {
    if (!searchTerm) return juniorHighs;
    const term = searchTerm.toLowerCase();
    return juniorHighs.filter(j => 
      j.name.toLowerCase().includes(term) || 
      j.districtName.toLowerCase().includes(term)
    );
  }, [juniorHighs, searchTerm]);

  const tierOptions = [
    { value: '四校', label: '四校（顶尖）' },
    { value: '八大', label: '八大（重点）' },
    { value: '市实验性示范性高中', label: '市实验性示范性' },
    { value: '四校分校', label: '四校分校' },
    { value: '八大分校', label: '八大分校' },
    { value: '一般高中', label: '一般高中' },
  ];

  return (
    <main className="page-shell">
      <section className="prose-section">
        <h1 className="prose-heading-xl">🎓 初升高志愿模拟填报</h1>
        <p className="prose-paragraph">
          基于官方对口路线、教育集团关系和学校层级匹配，为您提供智能化的高中升学推荐。
          <span className="text-sm text-gray-500 ml-2">数据截止至 2026 年 4 月</span>
        </p>
      </section>

      <section className="prose-section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Select Junior High */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm">1</span>
              选择你的初中学校
            </h2>
            
            <input
              type="text"
              placeholder="🔍 搜索学校名称或区域..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedJuniorId}
              onChange={(e) => setSelectedJuniorId(e.target.value)}
            >
              <option value="">-- 请选择初中 --</option>
              {filteredJuniorHighs.map(j => (
                <option key={j.id} value={j.id}>
                  [{j.districtName}] {j.name}
                </option>
              ))}
            </select>
            
            {selectedJunior && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">已选择：</p>
                <p className="text-lg font-semibold text-blue-900">{selectedJunior.name}</p>
                <p className="text-sm text-blue-600">区域：{selectedJunior.districtName} | 类型：{selectedJunior.tier}</p>
                {selectedJunior.group && (
                  <p className="text-sm text-blue-600">集团：{selectedJunior.group}</p>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Preferences */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm">2</span>
              设置筛选条件（可选）
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标区域</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="">全部区域</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标层级</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={targetTier}
                  onChange={(e) => setTargetTier(e.target.value)}
                >
                  <option value="">全部层级</option>
                  {tierOptions.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p>💡 <strong>提示：</strong>不设置筛选条件将显示所有匹配的高中学校，包括官方对口、集团直升、层级匹配和本区学校。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {selectedJuniorId && recommendations.length > 0 && (
        <section className="prose-section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              📋 推荐结果
              <span className="ml-2 text-base font-normal text-gray-500">
                ({recommendations.length} 所学校)
              </span>
            </h2>
          </div>

          <div className="space-y-8">
            {Object.entries(CATEGORY_CONFIG).map(([catKey, config]) => {
              const results = groupedResults[catKey];
              if (!results || results.length === 0) return null;
              
              return (
                <div key={catKey}>
                  <div className="flex items-center mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">({results.length} 所)</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((r) => (
                      <div
                        key={r.school.id}
                        className={`${config.bg} ${config.border} border rounded-lg p-4 hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{r.school.name}</h3>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.text} ${config.bg} border ${config.border}`}>
                            {r.school.tier}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>📍 {r.school.districtName}</p>
                          {r.school.address && <p>🏠 {r.school.address}</p>}
                          {r.school.phone && <p>📞 {r.school.phone}</p>}
                          {r.school.group && <p>🏫 {r.school.group}</p>}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">💡 {r.reason}</p>
                          <div className="mt-2 flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${config.color}`} 
                                style={{ width: `${r.matchScore}%` }}
                              />
                            </div>
                            <span className="ml-2 text-xs font-medium text-gray-600">
                              {r.matchScore}% 匹配
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {selectedJuniorId && recommendations.length === 0 && (
        <section className="prose-section">
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600 text-lg">暂无匹配的高中学校推荐</p>
            <p className="text-gray-500 text-sm mt-2">请尝试调整筛选条件或选择其他初中学校</p>
          </div>
        </section>
      )}

      {!selectedJuniorId && (
        <section className="prose-section">
          <div className="bg-blue-50 rounded-lg p-8 text-center border border-blue-200">
            <p className="text-blue-800 text-lg">👈 请先选择你的初中学校以获取推荐</p>
          </div>
        </section>
      )}
    </main>
  );
}
