function stripMarkdown(markdown = '') {
  return String(markdown || '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\-\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function readPolicyPlainText(itemOrId) {
  const content = typeof itemOrId === 'object' ? (itemOrId?.content || '') : '';
  // 兼容 block 数组：转文本后再 stripMarkdown
  const text = Array.isArray(content)
    ? content.map((b) => b.text || (Array.isArray(b.items) ? b.items.join(' ') : '')).join('\n')
    : content;
  return stripMarkdown(text);
}
