'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';

// Dynamically import ECharts to avoid SSR issues
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export default function GroupGraphClient({ schools }) {
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Prepare data for ECharts Graph
  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];
    const categories = [];

    // Group schools by group
    const groupsMap = {};
    schools.forEach(school => {
      if (school.group) {
        if (!groupsMap[school.group]) {
          groupsMap[school.group] = [];
        }
        groupsMap[school.group].push(school);
      }
    });

    // Filter out groups with very few schools to keep the graph clean
    const significantGroups = Object.entries(groupsMap)
      .filter(([_, members]) => members.length >= 3)
      .map(([name, members]) => ({ name, members }));

    // Add group nodes
    significantGroups.forEach((group, index) => {
      nodes.push({
        id: group.name,
        name: group.name,
        category: 0,
        symbolSize: Math.min(40, 10 + group.members.length),
        draggable: true,
        label: { show: true, position: 'right' },
        itemStyle: { color: '#8884d8' }
      });
      categories.push({ name: '教育集团' });

      // Add school nodes
      group.members.forEach(school => {
        nodes.push({
          id: school.id,
          name: school.name,
          category: 1,
          symbolSize: 6,
          draggable: true,
          label: { show: false, position: 'right' },
          itemStyle: { color: '#82ca9d' },
          group: group.name
        });
        
        links.push({
          source: group.name,
          target: school.id
        });
      });
    });

    return {
      nodes,
      links,
      categories: [{ name: '教育集团' }, { name: '学校' }]
    };
  }, [schools]);

  const option = {
    title: {
      text: '上海教育集团关系图谱',
      subtext: '显示包含 3 所及以上成员校的教育集团',
      left: 'center',
      textStyle: { fontSize: 16, color: '#333' }
    },
    tooltip: {},
    legend: [{
      data: graphData.categories.map(a => a.name),
      selectedMode: 'single',
      bottom: 10
    }],
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: graphData.nodes,
        links: graphData.links,
        categories: graphData.categories,
        roam: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}'
        },
        force: {
          repulsion: 100,
          edgeLength: [30, 100],
          gravity: 0.1
        },
        lineStyle: {
          color: 'source',
          curveness: 0.3
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 4 }
        }
      }
    ]
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <ReactECharts 
        option={option} 
        style={{ height: '600px', width: '100%' }} 
        theme="light"
        showLoading={true}
        opts={{ renderer: 'svg' }}
      />
      <div className="mt-4 text-sm text-gray-500 text-center">
        💡 提示：滚轮缩放，拖拽节点调整布局，点击集团节点可高亮关联学校
      </div>
    </div>
  );
}
