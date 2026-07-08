/**
 * 修复学校概览：从 Markdown 文件重新提取"学校概览" section，
 * 清除模板句式后更新数据库 description 字段。
 *
 * 用法：node scripts/fix-school-overviews.js [--dry-run]
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { loadDataStore } = require('../shared/data-store');
const { getServiceClient, SCHOOLS_TABLE } = require('../shared/supabase-client');

const TEMPLATE_SENTENCE_RE = /当前先完成官方名单收录|后续可继续补充|待补充|待完善|TODO|占位/;

function extractOverview(markdown) {
  const match = markdown.match(/^## 学校概览\s*\n([\s\S]*?)(?=\n## )/m);
  if (!match) return '';

  // 按行处理：移除梯队标签行、"该校属于/是..."行、空行
  const lines = match[1].split('\n');
  const kept = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\*\*梯队标签：\*\*/.test(trimmed)) continue;
    if (/^该校(?:属于|是)/.test(trimmed)) continue;
    kept.push(trimmed);
  }

  // 按句移除模板句
  const sentences = kept.join(' ').split(/(?<=。)\s*/);
  return sentences
    .filter((s) => {
      const t = s.trim();
      return t && !TEMPLATE_SENTENCE_RE.test(t);
    })
    .join('')
    .trim();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { schools } = await loadDataStore();
  const emptySchools = schools.filter((s) => !s.description || !s.description.trim());

  console.log(`概览为空的学校: ${emptySchools.length}`);

  const dir = 'content/schools';
  const updates = [];

  for (const school of emptySchools) {
    // 查找对应的 Markdown 文件
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    let overview = '';
    for (const file of files) {
      const name = file.replace(/^[^-]+-/, '').replace(/\.md$/, '');
      if (name === school.name) {
        const md = fs.readFileSync(path.join(dir, file), 'utf8');
        overview = extractOverview(md);
        break;
      }
    }
    if (overview) {
      updates.push({ id: school.dbId, slug: school.id, name: school.name, overview });
    }
  }

  console.log(`可修复: ${updates.length}/${emptySchools.length}`);

  if (updates.length) {
    console.log('\n示例:');
    updates.slice(0, 3).forEach((u) => {
      console.log(`  ${u.name} → ${u.overview.slice(0, 60)}...`);
    });
  }

  if (dryRun) {
    console.log('\n[dry-run] 未更新数据库');
    return;
  }

  if (!updates.length) return;

  const client = getServiceClient();
  let success = 0;
  let failed = 0;

  // 批量更新（每批 50）
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);
    const results = await Promise.allSettled(
      batch.map((u) =>
        client.from(SCHOOLS_TABLE).update({ description: u.overview }).eq('id', u.id)
      )
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && !r.value.error) success++;
      else failed++;
    }
  }

  console.log(`\n完成: 成功 ${success}, 失败 ${failed}`);
}

main().catch((err) => {
  console.error('错误:', err);
  process.exit(1);
});
