import test from 'node:test';
import assert from 'node:assert/strict';
import { getKnowledgePage, listKnowledgeSlugs } from '../lib/knowledge-content.mjs';

test('resolves the knowledge index page as a structured Next.js page model', async () => {
  const page = await getKnowledgePage([]);

  assert.equal(page.slug, 'index');
  assert.equal(page.href, '/knowledge');
  assert.equal(page.renderMode, 'structured');
  assert.match(page.title, /知识/);
  assert.equal(page.hero.title, '按学段、按年级、按学科查看上海学习内容');
  assert.equal(page.sections.some((section) => section.type === 'cardGrid' && section.id === 'junior'), true);
  assert.deepEqual(page.breadcrumbItems, [{ label: '知识体系' }]);
});

test('resolves grade 8 as structured data with subject links', async () => {
  const page = await getKnowledgePage(['grade-8']);

  assert.equal(page.slug, 'grade-8');
  assert.equal(page.renderMode, 'structured');
  assert.equal(page.hero.kicker, '八年级专题页');
  const subjectSection = page.sections.find((section) => section.id === 'grade8-subjects');
  assert.equal(subjectSection.cards.length, 7);
  assert.equal(subjectSection.cards.some((card) => card.href === '/knowledge/physics-grade8'), true);
});

test('resolves subject pages and preserves legacy content fragments for now', async () => {
  const page = await getKnowledgePage(['physics-grade8']);

  assert.equal(page.slug, 'physics-grade8');
  assert.equal(page.renderMode, 'html');
  assert.equal(page.href, '/knowledge/physics-grade8');
  assert.match(page.title, /物理/);
  assert.ok(page.contentHtml.includes('沪科版'));
  assert.ok(page.breadcrumbItems.some((item) => item.label === '知识体系'));
});

test('returns null for unknown or unsafe knowledge slugs', async () => {
  assert.equal(await getKnowledgePage(['missing-page']), null);
  assert.equal(await getKnowledgePage(['..', 'package.json']), null);
});

test('lists known knowledge slugs for static params', async () => {
  const slugs = await listKnowledgeSlugs();

  assert.ok(slugs.some((item) => item.slug.length === 0));
  assert.ok(slugs.some((item) => item.slug.join('/') === 'grade-8'));
  assert.ok(slugs.some((item) => item.slug.join('/') === 'physics-grade8'));
});
