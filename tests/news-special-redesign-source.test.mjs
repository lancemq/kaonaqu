import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const topicPages = [
  'app/news/zhongkao-special/page.js',
  'app/news/gaokao-special/page.js'
];

const policyToolPages = [
  'app/news/policy-faq/page.js',
  'app/news/policy-glossary/page.js'
];

test('admission timeline uses the Pencil dual-track schedule redesign', () => {
  const source = readFileSync('app/news/admission-timeline/page.js', 'utf8');
  const styles = readFileSync('styles/pages/news-special.css', 'utf8');

  assert.match(source, /className="admission-timeline-page"/);
  assert.match(source, /DUAL TRACK TIMELINE/);
  assert.match(source, /admission-timeline-spine/);
  assert.match(source, /getTimelineTrack/);
  assert.match(source, /is-\$\{track\}/);
  assert.match(styles, /\.admission-timeline-row/);
  assert.doesNotMatch(source, /NewsAerialHero/);
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
