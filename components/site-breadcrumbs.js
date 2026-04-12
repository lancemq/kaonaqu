'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ROUTE_LABELS = {
  '/news': '新闻政策',
  '/news/admission-timeline': '招生日程',
  '/news/gaokao-special': '高考专题',
  '/news/policy-deep-dive': '政策深读',
  '/news/policy-faq': '高频政策问答',
  '/news/policy-glossary': '政策概念速查',
  '/news/zhongkao-special': '中考专题',
  '/schools': '学校信息',
  '/schools/district': '区域专题',
  '/schools/compare': '学校对比'
};

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function compactLabel(value, maxLength = 30) {
  const label = String(value || '').trim();
  if (!label) {
    return '';
  }
  return label.length > maxLength ? `${label.slice(0, maxLength)}...` : label;
}

function labelFromSegment(segment) {
  return compactLabel(safeDecode(segment).replace(/[-_]+/g, ' '));
}

function buildFallbackItems(pathname) {
  if (!pathname || pathname === '/') {
    return [];
  }

  if (ROUTE_LABELS[pathname]) {
    return [{ label: ROUTE_LABELS[pathname], href: pathname }];
  }

  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) {
    return [];
  }

  if (segments[0] === 'news') {
    if (segments[1] === 'policy' && segments[2]) {
      return [
        { label: '新闻政策', href: '/news' },
        { label: '政策详情', href: '/news/policy-deep-dive' },
        { label: labelFromSegment(segments[2]) }
      ];
    }

    if (segments[1]) {
      return [
        { label: '新闻政策', href: '/news' },
        { label: ROUTE_LABELS[pathname] || labelFromSegment(segments[1]) }
      ];
    }
  }

  if (segments[0] === 'schools') {
    if (segments[1] === 'district' && segments[2]) {
      return [
        { label: '学校信息', href: '/schools' },
        { label: '区级专题' },
        { label: labelFromSegment(segments[2]) }
      ];
    }

    if (segments[1]) {
      return [
        { label: '学校信息', href: '/schools' },
        { label: ROUTE_LABELS[pathname] || labelFromSegment(segments[1]) }
      ];
    }
  }

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    return {
      label: ROUTE_LABELS[href] || labelFromSegment(segment),
      href: index === segments.length - 1 ? undefined : href
    };
  });
}

function normalizeItems(items, pathname) {
  const sourceItems = Array.isArray(items) && items.length ? items : buildFallbackItems(pathname);
  const normalized = sourceItems
    .map((item) => {
      if (typeof item === 'string') {
        return { label: compactLabel(item) };
      }
      return {
        ...item,
        label: compactLabel(item.label)
      };
    })
    .filter((item) => item.label);

  if (!normalized.length) {
    return [];
  }

  return [{ label: '首页', href: '/' }, ...normalized];
}

export default function SiteBreadcrumbs({ items }) {
  const pathname = usePathname();
  const breadcrumbs = normalizeItems(items, pathname);

  if (!breadcrumbs.length) {
    return null;
  }

  return (
    <nav className="site-breadcrumbs" aria-label="面包屑导航">
      <ol>
        {breadcrumbs.map((item, index) => {
          const isCurrent = index === breadcrumbs.length - 1;
          return (
            <li key={`${item.href || item.label}-${index}`}>
              {item.href && !isCurrent ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current={isCurrent ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
