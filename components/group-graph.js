'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';

// Dynamically import ECharts to avoid SSR issues
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export default function GroupGraphClient({ schools }) {
  const [isLoading, setIsLoading] = useState(true);

  // Prepare data for ECharts Graph
  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];

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
    significantGroups.forEach((group) => {
      nodes.push({
        id: group.name,
        name: group.name,
        category: 0,
        symbolSize: Math.min(60, 20 + group.members.length * 3),
        draggable: true,
        label: {
          show: true,
          position: 'right',
          fontSize: 13,
          fontWeight: 'bold',
          color: '#6f7d3b'
        },
        itemStyle: {
          color: {
            type: 'radial',
            x: 0.5,
            y: 0.5,
            r: 0.5,
            colorStops: [
              { offset: 0, color: '#8fae5c' },
              { offset: 1, color: '#6f7d3b' }
            ]
          }
        }
      });

      // Add school nodes
      group.members.forEach(school => {
        nodes.push({
          id: school.id,
          name: school.name,
          category: 1,
          symbolSize: 8,
          draggable: true,
          label: { show: false, position: 'right', fontSize: 11 },
          itemStyle: { color: '#a8c46b' },
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
      groupCount: significantGroups.length,
      schoolCount: nodes.filter(n => n.category === 1).length
    };
  }, [schools]);

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: function(params) {
        if (params.data.category === 0) {
          return `<strong style="font-size:14px">${params.data.name}</strong><br/>教育集团<br/>成员校数量: ${Math.round((params.data.symbolSize - 20) / 3)}`;
        }
        return `<strong style="font-size:14px">${params.data.name}</strong><br/>所属集团: ${params.data.group}`;
      }
    },
    legend: [{
      data: ['教育集团', '成员学校'],
      selectedMode: 'single',
      bottom: 20,
      textStyle: { fontSize: 12 }
    }],
    animationDurationUpdate: 150,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: graphData.nodes,
        links: graphData.links,
        categories: [
          { name: '教育集团' },
          { name: '成员学校' }
        ],
        roam: true,
        draggable: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}'
        },
        force: {
          repulsion: 200,
          edgeLength: [50, 150],
          gravity: 0.15,
          friction: 0.6,
          layoutAnimation: true
        },
        lineStyle: {
          color: 'source',
          curveness: 0.3,
          width: 2,
          opacity: 0.6
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 5 }
        },
        edgeLabel: {
          show: false
        }
      }
    ]
  };

  if (graphData.groupCount === 0) {
    return (
      <div className="schools-visualization-chart-empty">
        <div className="empty-icon">📊</div>
        <h3>暂无集团关系数据</h3>
        <p>当前收录的学校中，暂未发现包含 3 所及以上成员校的教育集团。</p>
      </div>
    );
  }

  return (
    <div className="schools-visualization-chart-wrapper">
      <div className="schools-visualization-chart-stats">
        <span>集团数量: <strong>{graphData.groupCount}</strong></span>
        <span>成员学校: <strong>{graphData.schoolCount}</strong></span>
      </div>
      <ReactECharts
        option={option}
        style={{ height: '650px', width: '100%' }}
        theme="light"
        showLoading={isLoading}
        loadingOption={{
          text: '正在加载图谱数据...',
          color: '#6f7d3b',
          textColor: '#22241d',
          maskColor: 'rgba(244, 239, 225, 0.8)'
        }}
        opts={{ renderer: 'svg' }}
        onChartReady={() => setIsLoading(false)}
      />
      <div className="schools-visualization-chart-hint">
        💡 交互提示：滚轮缩放，拖拽节点调整布局，点击集团节点可高亮关联学校
      </div>
    </div>
  );
}
