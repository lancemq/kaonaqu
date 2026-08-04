'use client';

// 自动加 region 前缀的 Link 包装。
// 用法：<RegionLink href="/schools">学校</RegionLink>
//   -> 渲染 <Link href="/shanghai/schools">学校</Link>
// server 组件可直接 import 渲染（client 组件在 server tree 中合法）。
import Link from 'next/link';
import { useRegion } from './region-context';
import { regionPath } from '../shared/region-path.mjs';

export function RegionLink({ href, ...props }) {
  const { region } = useRegion();
  return <Link href={regionPath(href, region)} {...props} />;
}
