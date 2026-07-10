// 共享：结构化 JSON content 渲染（与 news 详情 block 格式一致）
// block 类型：heading(level) / paragraph / list(ordered,items) / quote / divider
// inline 格式（链接 / 加粗 / 斜体）复用 policy 风格解析。
//
// renderBlocks(blocks, options?) ：
//   - 默认返回扁平的 JSX 节点数组（news 用法）。
//   - 传 { sectionClass } 时，按"顶层 heading"把节点分组为 <section className={sectionClass}>，
//     便于学校详情页复用既有的 .school-pencil-section 视觉（标题 + 段落 + 分割线）。

function renderInlineMarkdown(text) {
  const parts = [];
  const value = String(text || '');
  const regex = /\[([^\]]+)\]\(([^)]*)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      parts.push(value.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      parts.push(
        <a key={`link-${match.index}`} className="text-link" href={match[2]} target="_blank" rel="noreferrer">
          {match[1] || match[2]}
        </a>
      );
    } else if (match[3] !== undefined) {
      parts.push(<strong key={`strong-${match.index}`}>{match[3]}</strong>);
    } else {
      parts.push(<em key={`em-${match.index}`}>{match[4]}</em>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts;
}

// 编辑口径导读 section，无独立信息价值，整段跳过（与 news 行为一致）
const SKIP_SECTIONS = new Set([
  '这条信息为什么值得看',
  '适合谁先看',
  '适合谁看',
  '适合谁读'
]);

export function renderBlocks(blocks, options = {}) {
  const { sectionClass } = options;
  if (!Array.isArray(blocks)) return null;

  const elements = [];
  let skipping = false;

  blocks.forEach((block, i) => {
    if (block.type === 'heading' && block.level <= 2) {
      skipping = SKIP_SECTIONS.has(block.text);
    }
    if (skipping) return;

    const key = `block-${i}`;
    let el = null;

    switch (block.type) {
      case 'heading': {
        const text = renderInlineMarkdown(block.text);
        el = block.level <= 2
          ? <h2 key={key} className="rich-block-heading">{text}</h2>
          : <h3 key={key} className="rich-block-subheading">{text}</h3>;
        break;
      }
      case 'paragraph':
        el = <p key={key} className="rich-block-paragraph">{renderInlineMarkdown(block.text)}</p>;
        break;
      case 'list': {
        const Tag = block.ordered ? 'ol' : 'ul';
        el = (
          <Tag key={key} className="rich-block-list">
            {(block.items || []).map((item, j) => (
              <li key={`${key}-${j}`}>{renderInlineMarkdown(item)}</li>
            ))}
          </Tag>
        );
        break;
      }
      case 'quote':
        el = <blockquote key={key} className="rich-block-quote">{renderInlineMarkdown(block.text)}</blockquote>;
        break;
      case 'divider':
        el = <hr key={key} className="rich-block-divider" />;
        break;
      default:
        break;
    }

    if (el) elements.push(el);
  });

  if (!sectionClass) return elements;

  // 按顶层 heading 分组为 <section>
  const grouped = [];
  let section = null;

  for (const el of elements) {
    const isTopHeading =
      el.type === 'h2' && (el.props && el.props.className || '').indexOf('rich-block-heading') !== -1;
    if (isTopHeading) {
      if (section) {
        grouped.push(
          <section key={section.key} className={sectionClass}>{section.children}</section>
        );
      }
      section = { key: `sec-${grouped.length}`, children: [el] };
    } else {
      if (!section) section = { key: `sec-${grouped.length}`, children: [] };
      section.children.push(el);
    }
  }

  if (section) {
    grouped.push(<section key={section.key} className={sectionClass}>{section.children}</section>);
  }

  return grouped;
}

export { renderInlineMarkdown };
