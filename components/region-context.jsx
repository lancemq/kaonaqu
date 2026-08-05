'use client';

import { createContext, useContext } from 'react';

// 地区上下文：layout（server）取好 regionConfig 后注入，供所有 client 组件
// 通过 useRegion() 读取品牌副标题/地区名等，避免在 client 组件硬编码 "SHANGHAI EDUCATION"。
// 兜底值确保无 Provider 时（如独立测试）不崩溃，回退上海。
const RegionContext = createContext(null);

export function RegionProvider({ region, label, brandSuffix, brandSuffixFull, examTotal, features, children }) {
  return (
    <RegionContext.Provider value={{ region, label, brandSuffix, brandSuffixFull, examTotal, features }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (ctx) return ctx;
  return {
    region: 'shanghai',
    label: '上海',
    brandSuffix: 'SHANGHAI EDUCATION',
    brandSuffixFull: 'SHANGHAI EDUCATION PLATFORM',
    examTotal: { zhongkao: 750, gaokao: 660 },
    features: { schools: true, knowledge: true, compare: true, groups: true, district: true, scoreMatch: true }
  };
}
