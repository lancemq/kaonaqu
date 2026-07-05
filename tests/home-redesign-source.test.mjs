import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageSource = await readFile(new URL('../app/page.js', import.meta.url), 'utf8');
const homeCss = await readFile(new URL('../styles/channels/home.css', import.meta.url), 'utf8');

test('home page uses the aerial redesign shell instead of the old SiteShell prototype', () => {
  assert.match(pageSource, /className="home-aerial-page"/);
  assert.doesNotMatch(pageSource, /<SiteShell/);
  assert.doesNotMatch(pageSource, /home-prototype/);
});

test('home theme css is scoped to the aerial redesign', () => {
  assert.match(homeCss, /body\[data-page="home"\] \.home-aerial-page/);
  assert.doesNotMatch(homeCss, /home-prototype/);
});

test('home page includes the Pencil news specials entry section', () => {
  assert.match(pageSource, /const NEWS_SPECIALS = \[/);
  assert.match(pageSource, /className="home-news-specials-slab"/);
  assert.match(pageSource, /TOPIC ENTRIES/);
  assert.match(pageSource, /新闻专题/);
  assert.match(pageSource, /\/news\/sports-reform/);
  assert.match(pageSource, /\/news\/zhongkao-special/);
  assert.match(pageSource, /\/news\/gaokao-special/);
  assert.match(pageSource, /\/news\/policy-glossary/);
  assert.match(homeCss, /body\[data-page="home"\] \.home-news-specials-grid/);
});
