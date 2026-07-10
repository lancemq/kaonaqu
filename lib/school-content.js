// 从学校 content (jsonb) 结构化 blocks 提取展示文本。
// content 由 description / achievements 迁移而来，结构约定（898 所均稳定）：
//   heading("学校概览") -> paragraph | list
//   heading("办学成就") -> list | paragraph
// 详情页正文已统一读 content（renderBlocks），本文件让卡片简介 / SEO 摘要 /
// 区页兜底 / taxonomy 特色推断 也只读 content，避免与 description/achievements 双源不一致。

const OVERVIEW_HEADING = '学校概览';
const ACHIEVEMENT_HEADING = '办学成就';

function blockText(block) {
  if (!block) return '';
  if (block.type === 'list' && Array.isArray(block.items)) {
    return block.items.filter((x) => x != null && String(x).trim()).join('、');
  }
  return block.text || '';
}

// 取某个 heading 之后、到下一个 heading 之前的第一段有内容文本
function textAfterHeading(blocks, headingText) {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'heading' && b.text === headingText) {
      for (let j = i + 1; j < blocks.length; j++) {
        if (blocks[j].type === 'heading') break;
        const t = blockText(blocks[j]);
        if (t) return t;
      }
      return '';
    }
  }
  return '';
}

// 学校概览正文（用于卡片简介 / SEO 摘要 / 区页兜底）
export function getSchoolOverview(school) {
  const blocks = Array.isArray(school?.content) ? school.content : [];
  const direct = textAfterHeading(blocks, OVERVIEW_HEADING);
  if (direct) return direct;
  // 兜底：任意第一个 paragraph
  const p = blocks.find((b) => b.type === 'paragraph');
  return p ? blockText(p) : '';
}

// 办学成就文本（用于 taxonomy 特色推断）
export function getSchoolAchievementsText(school) {
  const blocks = Array.isArray(school?.content) ? school.content : [];
  return textAfterHeading(blocks, ACHIEVEMENT_HEADING);
}
