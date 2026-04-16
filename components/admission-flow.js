'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export default function AdmissionFlowClient({ schools }) {
  const [isLoading, setIsLoading] = useState(true);

  // Prepare data for ECharts Sankey
  const sankeyData = useMemo(() => {
    const nodes = [];
    const links = [];
    const nodeSet = new Set();
    let totalRoutes = 0;

    // Collect all routes
    schools.forEach(school => {
      if ((school.schoolStage === 'junior' || school.schoolStage === 'complete') && school.admissionRoutes) {
        school.admissionRoutes.forEach(route => {
          const sourceName = school.name;
          const targetName = route.high_school_name;

          if (!nodeSet.has(sourceName)) {
            nodes.push({ name: sourceName });
            nodeSet.add(sourceName);
          }
          if (!nodeSet.has(targetName)) {
            nodes.push({ name: targetName });
            nodeSet.add(targetName);
          }

          links.push({
            source: sourceName,
            target: targetName,
            value: route.count || 1
          });
          totalRoutes++;
        });
      }
    });

    return { nodes, links, totalRoutes, juniorCount: nodes.filter(n => {
      const school = schools.find(s => s.name === n.name);
      return school && (school.schoolStage === 'junior' || school.schoolStage === 'complete');
    }).length };
  }, [schools]);

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: function(params) {
        if (params.value) {
          return `<strong style="font-size:14px">${params.source}</strong> → <strong style="font-size:14px">${params.target}</strong><br/>升学人数: ${params.value}`;
        }
        return `<strong style="font-size:14px">${params.name}</strong><br/>${params.value ? '升学人数: ' + params.value : '学校节点'}`;
      }
    },
    animationDurationUpdate: 150,
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: {
          focus: 'adjacency'
        },
        data: sankeyData.nodes,
        links: sankeyData.links,
        levels: [
          {
            depth: 0,
            itemStyle: { color: '#4a6fa5' },
            lineStyle: { color: 'source', opacity: 0.4 },
            label: { fontSize: 11 }
          },
          {
            depth: 1,
            itemStyle: { color: '#6f7d3b' },
            lineStyle: { color: 'source', opacity: 0.4 },
            label: { fontSize: 11 }
          }
        ],
        lineStyle: {
          curveness: 0.5,
          width: 2
        },
        nodeGap: 8,
        nodeWidth: 15,
        label: {
          position: 'right',
          fontSize: 11,
          color: '#22241d'
        },
        left: '10%',
        right: '10%',
        top: '8%',
        bottom: '8%'
      }
    ]
  };

  if (sankeyData.totalRoutes === 0) {
    return (
      <div className="schools-visualization-chart-empty">
        <div className="empty-icon">📈</div>
        <h3>暂无升学流向数据</h3>
        <p>当前收录的学校中，暂未包含初升高对口升学路线数据。</p>
      </div>
    );
  }

  return (
    <div className="schools-visualization-chart-wrapper">
      <div className="schools-visualization-chart-stats">
        <span>初中学校: <strong>{sankeyData.juniorCount}</strong></span>
        <span>升学路线: <strong>{sankeyData.totalRoutes}</strong></span>
      </div>
      <ReactECharts
        option={option}
        style={{ height: '650px', width: '100%' }}
        theme="light"
        showLoading={isLoading}
        loadingOption={{
          text: '正在加载桑基图数据...',
          color: '#6f7d3b',
          textColor: '#22241d',
          maskColor: 'rgba(244, 239, 225, 0.8)'
        }}
        opts={{ renderer: 'svg' }}
        onReady={() => setIsLoading(false)}
      />
      <div className="schools-visualization-chart-hint">
        💡 交互提示：左侧为初中，右侧为高中，线条宽度表示对口关系的数量，鼠标悬停查看详情
      </div>
    </div>
  );
}
