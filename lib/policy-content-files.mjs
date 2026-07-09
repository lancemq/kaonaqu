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
  return stripMarkdown(content);
}
