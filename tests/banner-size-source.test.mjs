import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const homeCss = await readFile(new URL('../styles/theme-home.css', import.meta.url), 'utf8');
const newsCss = await readFile(new URL('../styles/theme-news.css', import.meta.url), 'utf8');

test('home banner matches latest Pencil hero height', () => {
  assert.match(homeCss, /--home-hero-height:\s*460px;/);
  assert.match(homeCss, /--home-hero-padding:\s*80px 80px 60px;/);
});

test('news banner matches latest Pencil hero height', () => {
  assert.match(newsCss, /--news-hero-height:\s*360px;/);
  assert.match(newsCss, /--news-hero-padding:\s*60px 80px;/);
});
