'use client';

import { useState } from 'react';

function nodePath(parent, label) {
  return parent ? `${parent} / ${label}` : label;
}

function TreeNode({ node, path, collapsed, toggle }) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  if (!hasChildren) {
    return (
      <li className="km-leaf">
        <span className="km-label">{node.label}</span>
      </li>
    );
  }
  const isClosed = collapsed.has(path);
  return (
    <li className="km-branch">
      <div className="km-row">
        <button
          type="button"
          className="km-toggle"
          aria-expanded={!isClosed}
          aria-label={isClosed ? '展开' : '收起'}
          onClick={() => toggle(path)}
        >
          {isClosed ? '+' : '−'}
        </button>
        <span className="km-label">{node.label}</span>
      </div>
      {!isClosed ? (
        <ul className="km-children">
          {node.children.map((child, i) => (
            <TreeNode
              key={i}
              node={child}
              path={nodePath(path, child.label)}
              collapsed={collapsed}
              toggle={toggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function KnowledgeMindMap({ tree, title }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  if (!tree) return null;

  const toggle = (p) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  const collectPaths = (n, p, acc) => {
    if (Array.isArray(n.children) && n.children.length) {
      const np = nodePath(p, n.label);
      acc.add(np);
      n.children.forEach((c) => collectPaths(c, np, acc));
    }
  };

  const collapseAll = () => {
    const all = new Set();
    collectPaths(tree, '', all);
    setCollapsed(all);
  };
  const expandAll = () => setCollapsed(new Set());

  return (
    <section className="knowledge-mindmap" aria-label="知识导图">
      <div className="knowledge-section-head">
        <div className="channel-kicker">
          <span />
          <em>知识导图</em>
        </div>
        <div className="km-controls">
          <button type="button" onClick={expandAll}>展开全部</button>
          <button type="button" onClick={collapseAll}>收起全部</button>
        </div>
      </div>
      <h2>{title || '本页知识结构'}</h2>
      <ul className="km-root">
        <TreeNode node={tree} path={tree.label} collapsed={collapsed} toggle={toggle} />
      </ul>
    </section>
  );
}
