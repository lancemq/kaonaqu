'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export default function AdmissionFlowClient({ schools }) {
  // Prepare data for ECharts Sankey
  const sankeyData = useMemo(() => {
    const nodes = [];
    const links = [];
    const nodeSet = new Set();

    // Collect all routes
    schools.forEach(school => {
      if (school.schoolStage === 'junior' || school.schoolStage === 'complete') {
        if (school.admissionRoutes) {
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
              value: 1
            });
          });
        }
      }
    });

    // Aggregate links (multiple schools might route to same high school, but here we have distinct links from specific junior high)
    // Actually, if multiple junior highs go to same high school, they are separate links.
    // But we can aggregate if we want to show volume. For now, 1 per route is fine.

    return { nodes, links };
  }, [schools]);

  const option = {
    title: {
      text: '初升高对口升学流向图',
      subtext: '基于已收录的对口路线数据 (Sankey Diagram)',
      left: 'center',
      textStyle: { fontSize: 16, color: '#333' }
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
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
            itemStyle: { color: '#8884d8' },
            lineStyle: { color: 'source', opacity: 0.6 }
          },
          {
            depth: 1,
            itemStyle: { color: '#82ca9d' },
            lineStyle: { color: 'source', opacity: 0.6 }
          }
        ],
        lineStyle: {
          curveness: 0.5
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
        💡 提示：左侧为初中，右侧为高中，线条宽度表示对口关系的数量
      </div>
    </div>
  );
}
