// KaTeX 公式渲染（服务端预渲染，零客户端 JS）
// 在知识页服务端组件中使用：katex.renderToString 在构建/预渲染期生成 HTML，
// 配合 katex CSS（在路由页 import 'katex/dist/katex.min.css'）完成样式。
import katex from 'katex';

const KATEX_OPTS = { displayMode: false, throwOnError: false, output: 'htmlAndMathml' };

// 解析文本中的行内公式 $...$（用于学科主题页 rich text 与结构化页 intro）。
// 无 $ 时原样返回字符串；含 $ 时返回 React 节点数组。
export function renderInlineMath(text) {
  if (typeof text !== 'string' || text.indexOf('$') < 0) return text;
  const out = [];
  const regex = /\$([^$]+)\$/g;
  let last = 0;
  let match;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    let html;
    try {
      html = katex.renderToString(match[1], KATEX_OPTS);
    } catch {
      html = match[1];
    }
    out.push(
      <span className="kb-math-inline" key={`math-${i++}`} dangerouslySetInnerHTML={{ __html: html }} />
    );
    last = regex.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// 公式展示块（display 或 inline）
export function MathBlock({ tex = '', display = true, caption }) {
  let html;
  try {
    html = katex.renderToString(tex, { ...KATEX_OPTS, displayMode: Boolean(display) });
  } catch {
    html = `<span class="kb-math-error">${String(tex)}</span>`;
  }
  return (
    <figure className={`knowledge-math${display ? ' is-display' : ' is-inline'}`}>
      <span className="knowledge-math-render" dangerouslySetInnerHTML={{ __html: html }} />
      {caption ? <figcaption className="knowledge-math-caption">{caption}</figcaption> : null}
    </figure>
  );
}
