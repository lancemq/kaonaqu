import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageSource = await readFile(new URL('../app/news/page.js', import.meta.url), 'utf8');
const clientSource = await readFile(new URL('../components/news-page-client.js', import.meta.url), 'utf8');
const newsCss = await readFile(new URL('../styles/channels/news.css', import.meta.url), 'utf8');

test('news page uses the new channel shell instead of the old SiteShell prototype', () => {
  assert.match(pageSource, /className="news-aerial-page"/);
  assert.doesNotMatch(pageSource, /<SiteShell/);
  assert.doesNotMatch(pageSource, /news-channel-hero/);
});

test('news client renders the redesigned list surface', () => {
  assert.match(clientSource, /className="news-aerial-content"/);
  assert.doesNotMatch(clientSource, /news-prototype/);
});

test('news theme css is scoped to the redesigned news page', () => {
  assert.match(newsCss, /body\[data-page="news"\] \.news-aerial-page/);
  assert.doesNotMatch(newsCss, /news-prototype/);
});
