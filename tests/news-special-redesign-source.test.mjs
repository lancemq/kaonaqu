import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const aerialPages = [
  'app/news/policy-deep-dive/page.js'
];

const topicPages = [
  'app/news/zhongkao-special/page.js',
  'app/news/gaokao-special/page.js'
];

const policyToolPages = [
  'app/news/policy-faq/page.js',
  'app/news/policy-glossary/page.js'
];

test('news special pages use the aerial redesign shell', () => {
  for (const page of aerialPages) {
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

test('admission topic pages use the Pencil topic shell', () => {
  const shell = readFileSync('components/news-topic-special-ui.js', 'utf8');
  const styles = readFileSync('styles/pages/news-special.css', 'utf8');
  assert.match(shell, /NewsAerialNav/);
  assert.match(shell, /NewsAerialFooter/);
  assert.match(shell, /className=\{`special-page/);
  assert.match(styles, /\.special-page\.is-zhongkao \.special-hero::before/);

  for (const page of topicPages) {
    const source = readFileSync(page, 'utf8');
    assert.match(source, /NewsTopicSpecialPage/);
    assert.match(source, /variant="(?:zhongkao|gaokao)"/);
    assert.doesNotMatch(source, /<SiteShell/);
    assert.doesNotMatch(source, /prototype-page-footer/);
    assert.doesNotMatch(source, /school-prototype-hero/);
  }
});

test('policy tool pages use the Pencil policy shell', () => {
  const shell = readFileSync('components/news-policy-tool-ui.js', 'utf8');
  assert.match(shell, /NewsAerialNav/);
  assert.match(shell, /NewsAerialFooter/);
  assert.match(shell, /className=\{`special-page/);

  for (const page of policyToolPages) {
    const source = readFileSync(page, 'utf8');
    assert.match(source, /PolicyToolShell/);
    assert.match(source, /variant="(?:faq|glossary)"/);
    assert.doesNotMatch(source, /<SiteShell/);
    assert.doesNotMatch(source, /prototype-page-footer/);
    assert.doesNotMatch(source, /school-prototype-hero/);
  }
});
