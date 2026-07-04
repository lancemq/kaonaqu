// CSS 死代码清理脚本（postcss AST 版）
// 用法: node scripts/cleanup-css.cjs          (dry-run)
//       node scripts/cleanup-css.cjs --apply   (写文件)
const postcss = require('postcss');
const fs = require('fs');

const APPLY = process.argv.includes('--apply');

const FILES = [
  'styles/theme-schools.css',
  'styles/base.css',
  'styles/theme-news.css',
  'styles/index.css',
];

const deadPrefixes = [
  'school-rich-', 'district-datadesk-', 'district-index-',
  'schools-compare-datadesk-', 'quota-', 'group-badge-',
  'map-link-button', 'schools-datadesk-advanced-',
  'schools-datadesk-cardquality', 'schools-datadesk-card-wrapper',
  'home-prototype-', 'home-editorial-', 'home-decision-',
  'home-cta-button', 'home-hero-density-', 'home-hero-route-',
  'home-hero-tag-', 'home-hero-micro-note', 'home-side-timeline',
  'prototype-side-', 'prototype-page-footer', 'prototype-kicker-row',
  'brand-', 'masthead-', 'compare-bag-dock-',
];

const deadExact = [
  'compare-card', 'compare-grid', 'compare-card-link', 'compare-card-head',
  'compare-points', 'compare-card-actions',
  'school-direction-row', 'school-card-footnote',
  'school-detail-facts', 'school-detail-note',
  'button', 'button-secondary',
  'schools-compare-suggestions', 'schools-compare-selected-tags',
  'schools-compare-selected-tag', 'schools-compare-maplink',
  'schools-compare-tag', 'schools-compare-tag-group',
  'schools-compare-facts', 'schools-compare-contact',
  'schools-compare-tags', 'schools-compare-tag-empty',
  'breadcrumb', 'hero', 'panel', 'layout', 'action-button',
  'top-cta', 'module-link', 'direction-chip', 'stage-badge',
  'relation-badge', 'empty-state', 'fatal-error',
  'meta-chip', 'quick-chip', 'newsroom-edition', 'newsroom-kicker',
  'news-detail-article-hero', 'news-special-hero',
  'news-special-hero-timeline', 'school-prototype-hero',
  'news-special-aerial-cards', 'cross-channel-panel-school-side',
  'page-shell', 'top-links', 'topbar', 'topbar-desk', 'desk-label', 'compare-bag-dock',
];

const alive = [
  'schools-datadesk-cardkicker',
  'school-datadesk-detail-article',
  'highlight-card',
  'news-special-faq-body',
  'news-glossary-process-card',
  'news-glossary-relation-card',
];

function isDeadSelector(sel) {
  for (const a of alive) {
    if (sel.includes(a)) return false;
  }
  if (/\.schools-datadesk-(?!cardkicker)/.test(sel)) return true;
  if (/\.school-datadesk-detail-(?!article)/.test(sel)) return true;
  if (/\.schools-compare-tier-\d+/.test(sel)) return true;
  for (const p of deadPrefixes) {
    if (sel.includes('.' + p)) return true;
  }
  for (const e of deadExact) {
    const re = new RegExp('\\.' + e.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '(?![\\w-])');
    if (re.test(sel)) return true;
  }
  return false;
}

let totalBefore = 0;
let totalAfter = 0;
for (const file of FILES) {
  const before = fs.readFileSync(file, 'utf8');
  const root = postcss.parse(before);
  let removed = 0;
  let partial = 0;
  root.walkRules((rule) => {
    const aliveSels = rule.selectors.filter((s) => !isDeadSelector(s));
    if (aliveSels.length === 0) {
      rule.remove();
      removed += 1;
    } else if (aliveSels.length < rule.selectors.length) {
      rule.selectors = aliveSels;
      partial += 1;
    }
  });
  // 删除变空的 @media / @supports
  root.walkAtRules((atRule) => {
    if ((atRule.name === 'media' || atRule.name === 'supports') && atRule.nodes.length === 0) {
      atRule.remove();
    }
  });
  const after = root.toString();
  const beforeLines = before.split('\n').length;
  const afterLines = after.split('\n').length;
  totalBefore += beforeLines;
  totalAfter += afterLines;
  console.log(`${file}: ${beforeLines} → ${afterLines} (删规则 ${removed}, 部分重写 ${partial})`);
  if (APPLY) fs.writeFileSync(file, after);
}
console.log(`\n合计: ${totalBefore} → ${totalAfter} (减 ${totalBefore - totalAfter} 行)`);
if (!APPLY) console.log('（dry-run，未写文件。加 --apply 实际执行）');
