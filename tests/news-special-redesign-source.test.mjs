import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pages = [
  'app/news/zhongkao-special/page.js',
  'app/news/gaokao-special/page.js',
  'app/news/policy-faq/page.js',
  'app/news/policy-glossary/page.js',
  'app/news/policy-deep-dive/page.js'
];

test('news special pages use the aerial redesign shell', () => {
  for (const page of pages) {
    const source = readFileSync(page, 'utf8');
    assert.match(source, /NewsAerialNav/);
    assert.match(source, /NewsAerialHero/);
    assert.match(source, /NewsAerialFooter/);
    assert.match(source, /className="news-special-aerial-page"/);
    assert.doesNotMatch(source, /<SiteShell/);
    assert.doesNotMatch(source, /prototype-page-footer/);
    assert.doesNotMatch(source, /school-prototype-hero/);
  }
});
