// 全站频道菜单（顶部导航 + 页脚）——菜单项顺序与文案的唯一来源。
// 顺序：首页 · 新闻 · 中学 · 高校 · 知识。
// 「高校」紧邻「中学」右侧（学校类频道相邻），地区选择器仍由各页面追加在菜单最右。
// features 传各页的 region features（schools/knowledge 关闭时对应项隐藏，高校为全局频道恒显示）。
// active 传当前频道 key（home/news/schools/universities/knowledge），仅该页高亮。
import { RegionLink } from './region-link';

const MENU_ITEMS = [
  { key: 'home', href: '/', label: '首页' },
  { key: 'news', href: '/news', label: '新闻' },
  { key: 'schools', href: '/schools', label: '中学', feature: 'schools' },
  { key: 'universities', href: '/universities', label: '高校' },
  { key: 'knowledge', href: '/knowledge', label: '知识', feature: 'knowledge' }
];

export function SiteMenuLinks({ features, active = null }) {
  return (
    <>
      {MENU_ITEMS
        .filter((item) => !item.feature || features?.[item.feature] !== false)
        .map((item) => (
          <RegionLink key={item.key} className={active === item.key ? 'is-active' : undefined} href={item.href}>
            {item.label}
          </RegionLink>
        ))}
    </>
  );
}
