'use client';

// 全站频道菜单（顶部导航 + 页脚）——菜单项顺序与文案的唯一来源。
// 顺序：首页 · 新闻 · 中学 · 高校 · 知识。
// 「高校」紧邻「中学」右侧（学校类频道相邻），地区选择器仍由各页面追加在菜单最右。
// features 传各页的 region features（schools/knowledge 关闭时对应项隐藏，高校为全局频道恒显示）。
// active 传当前频道 key（home/news/schools/universities/knowledge），仅该页高亮。
//
// 高校库内容全国统一（规范地址 /universities），但只要当前 URL 已带地区前缀，
// 菜单里的「高校」就保留该前缀（/nanjing/universities），避免从南京点高校后
// 右上角地区跳回默认地区。无前缀页面（全局 /universities）仍指向规范地址。
import { usePathname } from 'next/navigation';
import { RegionLink } from './region-link';
import { isKnownRegion } from '../shared/region-list.mjs';

const MENU_ITEMS = [
  { key: 'home', href: '/', label: '首页' },
  { key: 'news', href: '/news', label: '新闻' },
  { key: 'schools', href: '/schools', label: '中学', feature: 'schools' },
  { key: 'universities', href: '/universities', label: '高校', keepRegionPrefix: true },
  { key: 'knowledge', href: '/knowledge', label: '知识', feature: 'knowledge' }
];

export function SiteMenuLinks({ features, active = null }) {
  const pathname = usePathname() || '/';
  const firstSegment = pathname.split('/')[1];
  const regionPrefix = firstSegment && isKnownRegion(firstSegment) ? `/${firstSegment}` : '';

  return (
    <>
      {MENU_ITEMS
        .filter((item) => !item.feature || features?.[item.feature] !== false)
        .map((item) => {
          const href = item.keepRegionPrefix && regionPrefix ? `${regionPrefix}${item.href}` : item.href;
          return (
            <RegionLink key={item.key} className={active === item.key ? 'is-active' : undefined} href={href}>
              {item.label}
            </RegionLink>
          );
        })}
    </>
  );
}
