// 共享：结构化 JSON content 渲染（news 详情 / 学校详情 / 未来页面同源）。
// block 类型：heading(level) / paragraph / list(ordered,items) / quote / divider
// inline 格式（链接 / 加粗 / 斜体 / 裸网址）统一在此解析，供所有消费方复用。
//
// renderBlocks(blocks, options?) ：
//   - 默认返回扁平的 JSX 节点数组（news 用法）。
//   - 传 { sectionClass } 时，按"顶层 heading"把节点分组为 <section className={sectionClass}>，
//     便于学校详情页复用既有的 .school-pencil-section 视觉（标题 + 段落 + 分割线）。
//   - 传 { topHeadingTag, subHeadingTag } 可覆盖 heading 标签（默认 h2/h3）。
//     新闻详情传 { topHeadingTag: 'h3', subHeadingTag: 'h4' }，避免与页面 h1 标题争层级。

// 将正文里“名称（网址）”形式的裸网址转换为 Markdown 链接 [名称](网址)，
// 使显示只保留可读名称、名称本身为可点击链接、原始网址不出现。
// 覆盖三种形态：引号名称（“名称”/“名称”网站）、《》标题、括号前紧邻的名称。
// 源自原 news 详情渲染逻辑，现提升为共享工具。
function preprocessInlineUrlParens(text) {
  const RE =
    /(([“"])([^”"]+)([”"])([学校官网网站平台]*)|《([^》]+)》|((?<![\p{L}\p{N}])[^\s），。、；：'"“”《》\]/|]+))\s*[（(]\s*(https?:\/\/[^\s），。、；：'"">]+|www\.[^\s），。、；：'"">]+)\s*[）)]/gu;
  return String(text || '').replace(
    RE,
    (m, p1, p2open, p3name, p4close, p5suffix, p6title, p7bare, p8url) => {
      const href = String(p8url || '').startsWith('www.') ? `https://${p8url}` : (p8url || '');
      if (p3name !== undefined) return `${p2open}[${p3name}](${href})${p4close}${p5suffix}`;
      if (p6title !== undefined) return `《[${p6title}](${href})》`;
      if (p7bare !== undefined) return `[${p7bare}](${href})`;
      return m;
    }
  );
}

function renderInlineMarkdown(text) {
  const parts = [];
  const value = preprocessInlineUrlParens(text);
  const regex =
    /\[([^\]]+)\]\(([^)]*)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|(https?:\/\/[^\s）>，。、；：'"">]+)|(www\.[^\s）>，。、；：'"">]+)/g;
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
    } else if (match[4] !== undefined) {
      parts.push(<em key={`em-${match.index}`}>{match[4]}</em>);
    } else if (match[5] !== undefined) {
      parts.push(
        <a key={`link-${match.index}`} className="text-link" href={match[5]} target="_blank" rel="noreferrer">
          {match[5]}
        </a>
      );
    } else if (match[6] !== undefined) {
      const href = `https://${match[6]}`;
      parts.push(
        <a key={`link-${match.index}`} className="text-link" href={href} target="_blank" rel="noreferrer">
          {match[6]}
        </a>
      );
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
  const { sectionClass, topHeadingTag = 'h2', subHeadingTag = 'h3' } = options;
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
        const Tag = block.level <= 2 ? topHeadingTag : subHeadingTag;
        el = (
          <Tag key={key} className={block.level <= 2 ? 'rich-block-heading' : 'rich-block-subheading'}>
            {text}
          </Tag>
        );
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

export { renderInlineMarkdown, preprocessInlineUrlParens };
