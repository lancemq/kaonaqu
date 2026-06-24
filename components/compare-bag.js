'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'kaonaqu:compareBag';
const CHANGE_EVENT = 'compare-bag-change';
const MAX_ITEMS = 4;

function readBag() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (typeof entry === 'string') return { id: entry, name: entry };
        if (entry && typeof entry === 'object' && typeof entry.id === 'string') {
          return { id: entry.id, name: typeof entry.name === 'string' && entry.name ? entry.name : entry.id };
        }
        return null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function writeBag(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // 私密模式 / 配额超限：静默失败，仅本次会话生效
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useCompareBag() {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readBag());
    setReady(true);
    const sync = () => setItems(readBag());
    window.addEventListener('storage', sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const ids = items.map((item) => item.id);

  const has = useCallback((id) => items.some((item) => item.id === id), [items]);

  const remove = useCallback((id) => {
    const current = readBag();
    if (!current.some((item) => item.id === id)) return;
    writeBag(current.filter((item) => item.id !== id));
  }, []);

  const toggle = useCallback((id, name) => {
    if (!id) return { ok: false, reason: 'invalid' };
    const current = readBag();
    if (current.some((item) => item.id === id)) {
      writeBag(current.filter((item) => item.id !== id));
      return { ok: true, action: 'removed' };
    }
    if (current.length >= MAX_ITEMS) return { ok: false, reason: 'full' };
    writeBag([...current, { id, name: name || id }]);
    return { ok: true, action: 'added' };
  }, []);

  const replaceAll = useCallback((nextItems) => {
    const sanitized = [];
    const seen = new Set();
    for (const entry of nextItems || []) {
      const id = typeof entry === 'string' ? entry : entry?.id;
      const name = typeof entry === 'string' ? entry : (entry?.name || id);
      if (!id || seen.has(id)) continue;
      sanitized.push({ id, name });
      seen.add(id);
      if (sanitized.length >= MAX_ITEMS) break;
    }
    writeBag(sanitized);
  }, []);

  const clear = useCallback(() => writeBag([]), []);

  return { items, ids, ready, has, remove, toggle, replaceAll, clear, max: MAX_ITEMS };
}

export default function CompareBagDock() {
  const { items, ready, remove, clear, max } = useCompareBag();
  if (!ready || items.length === 0) return null;

  const target = `/schools/compare?schools=${items.map((item) => encodeURIComponent(item.id)).join(',')}`;

  return (
    <aside className="compare-bag-dock" aria-label="学校比较篮">
      <div className="compare-bag-dock-head">
        <span className="compare-bag-dock-title">比较篮</span>
        <span className="compare-bag-dock-count">{items.length}/{max}</span>
      </div>
      <ul className="compare-bag-dock-list">
        {items.map((item) => (
          <li key={item.id}>
            <span className="compare-bag-dock-name">{item.name}</span>
            <button
              type="button"
              className="compare-bag-dock-remove"
              onClick={() => remove(item.id)}
              aria-label={`从比较篮移除 ${item.name}`}
            >×</button>
          </li>
        ))}
      </ul>
      <div className="compare-bag-dock-actions">
        <Link className="compare-bag-dock-primary" href={target}>进入比较</Link>
        <button type="button" className="compare-bag-dock-secondary" onClick={clear}>清空</button>
      </div>
    </aside>
  );
}
