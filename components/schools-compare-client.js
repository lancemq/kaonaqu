'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// 梯队颜色映射
const tierColors = {
  '四校': 'bg-red-100 text-red-800 border-red-200',
  '四校分校': 'bg-red-50 text-red-700 border-red-100',
  '八大': 'bg-orange-100 text-orange-800 border-orange-200',
  '八大分校': 'bg-orange-50 text-orange-700 border-orange-100',
  '市实验性示范性高中': 'bg-purple-100 text-purple-800 border-purple-200',
  '区重点': 'bg-blue-100 text-blue-800 border-blue-200',
  '一般高中': 'bg-green-100 text-green-800 border-green-200',
  '民办高中': 'bg-teal-100 text-teal-800 border-teal-200',
  '国际课程': 'bg-pink-100 text-pink-800 border-pink-200',
  '公办初中': 'bg-blue-50 text-blue-700 border-blue-100',
  '民办初中': 'bg-teal-50 text-teal-700 border-teal-100',
};

export default function SchoolsCompareClient({ schools, initialSchools }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
    return `https://www.amap.com/search?query=${encodeURIComponent(school.name + ' ' + (school.address || school.districtName))}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🆚 学校多维对比</h1>
            <p className="text-sm text-gray-500 mt-1">最多选择 3 所学校进行全方位参数对比</p>
          </div>
          <Link href="/schools" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            ← 返回学校列表
          </Link>
        </div>

        {/* Selection Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="输入学校名称添加对比..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {suggestions.map(s => (
                    <li
                      key={s.id}
                      onClick={() => addSchool(s.id)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                    >
                      {s.name} <span className="text-gray-400 text-xs ml-2">{s.districtName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">已选: {selectedIds.length}/3</span>
              {selectedIds.length > 0 && (
                <button onClick={clearAll} className="text-sm text-red-500 hover:text-red-700">
                  清空
                </button>
              )}
            </div>
          </div>
          
          {/* Selected Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedSchools.map(s => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-100">
                <span className="font-medium truncate max-w-[150px]">{s.name}</span>
                <button onClick={() => removeSchool(s.id)} className="hover:text-red-500">×</button>
              </div>
            ))}
            {selectedSchools.length === 0 && (
              <span className="text-gray-400 text-sm italic">暂未选择学校，请在上方搜索添加</span>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        {selectedSchools.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {selectedSchools.map(school => (
              <div key={school.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <Link href={`/schools/${school.id}`} className="text-lg font-bold text-gray-900 hover:text-purple-600 line-clamp-2">
                      {school.name}
                    </Link>
                    <a href={getMapUrl(school)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline whitespace-nowrap ml-2">
                      📍 查看地图
                    </a>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {school.tier && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${tierColors[school.tier] || 'bg-gray-100 text-gray-600'}`}>
                        {school.tier}
                      </span>
                    )}
                    {school.group && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {school.group}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4 flex-1">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">基本信息</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500 block text-xs">区域</span>
                        <span className="text-gray-900">{school.districtName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs">类型</span>
                        <span className="text-gray-900">{school.schoolTypeLabel}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs">学段</span>
                        <span className="text-gray-900">{school.schoolStageLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">联系方式</div>
                    <div className="text-sm text-gray-700 space-y-1">
                      {school.address ? <p>📍 {school.address}</p> : <p className="text-gray-400">地址暂无</p>}
                      {school.phone ? <p>📞 {school.phone}</p> : <p className="text-gray-400">电话暂无</p>}
                      {school.website ? (
                        <p className="truncate">🌐 <a href={school.website} target="_blank" className="text-blue-500 hover:underline">{school.website}</a></p>
                      ) : <p className="text-gray-400">官网暂无</p>}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">特色标签</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(school.features && school.features.length > 0 ? school.features : school.tags || []).slice(0, 8).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {(school.features?.length || school.tags?.length || 0) > 8 && (
                        <span className="text-xs text-gray-400">...</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto">
                  <Link href={`/schools/${school.id}`} className="block w-full text-center py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                    查看完整详情
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="text-6xl mb-4">⚖️</div>
            <h3 className="text-lg font-medium text-gray-900">暂无对比数据</h3>
            <p className="text-gray-500 mt-2">请搜索并添加学校开始对比</p>
          </div>
        )}

      </div>
    </div>
  );
}
