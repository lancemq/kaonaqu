import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';

const specialPages = [
  { file: 'app/[region]/news/zhongkao-special/page.js', variant: 'zhongkao' },
  { file: 'app/[region]/news/gaokao-special/page.js', variant: 'gaokao' }
];

const REGION_CONFIG = 'shared/regions.data.json';
const BUILDER = 'shared/news-special-builder.mjs';
const SHELL = 'components/news-topic-special-ui.js';

test('专题页政策正文来自地区配置，页面不含硬编码上海政策块', () => {
  for (const { file } of specialPages) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /buildSpecialProps/);
    assert.ok(source.includes('/news/suzhou-'), `no suzhou redirect in ${file}`);
    // 政策正文不再内联在页面里（policyBlocks 常量应已移除）
    assert.doesNotMatch(source, /const policyBlocks = \[/);
    assert.doesNotMatch(source, /沪教委规|三大批次依次录取|5等11级/);
  }
});

test('builder 未知地区不 fallback 到上海，总分只从 examTotal 派生', () => {
  const builder = readFileSync(BUILDER, 'utf8');
  assert.match(builder, /loadPolicyConfig\(region, variant\)/);
  assert.match(builder, /regionConfig\?\.examTotal\?\.\[variant\]/);
  assert.match(builder, /const isShanghai = region === 'shanghai'/);
  // 不能存在无条件把上海配置作为默认值的分支
  assert.doesNotMatch(builder, /getSpecialConfig\([^)]*\)\s*\|\|\s*SHANGHAI/);
  assert.doesNotMatch(builder, /\?\?\s*SHANGHAI_/);
});

test('上海政策配置逐块带来源，非上海配置不得引用上海法规', () => {
  for (const { variant } of specialPages) {
    const file = `content/special-policies/shanghai/${variant}.json`;
    assert.ok(existsSync(file), `missing ${file}`);
    const cfg = JSON.parse(readFileSync(file, 'utf8'));
    assert.ok(Array.isArray(cfg.policyBlocks) && cfg.policyBlocks.length > 0);
    for (const block of cfg.policyBlocks) {
      assert.ok(block.id && block.type && block.title, `block incomplete in ${file}`);
    }
  }
  for (const region of ['nanjing', 'wuxi', 'suzhou']) {
    for (const { variant } of specialPages) {
      const file = `content/special-policies/${region}/${variant}.json`;
      if (!existsSync(file)) continue;
      const raw = readFileSync(file, 'utf8');
      assert.doesNotMatch(raw, /沪教委规|上海市高中阶段学校招生办法|上海高考/);
    }
  }
});

test('地区事实源 examTotal 覆盖四城中高考', () => {
  const cfg = JSON.parse(readFileSync(REGION_CONFIG, 'utf8'));
  for (const region of ['shanghai', 'suzhou', 'nanjing', 'wuxi']) {
    const total = cfg.regions[region]?.examTotal;
    assert.ok(total && Number(total.zhongkao) > 0 && Number(total.gaokao) > 0, `${region} examTotal missing`);
  }
  assert.equal(cfg.regions.suzhou.examTotal.zhongkao, 740);
  assert.equal(cfg.regions.nanjing.examTotal.zhongkao, 700);
});

test('体育改革专题页上海口径按地区隔离', () => {
  const source = readFileSync('app/[region]/news/sports-reform/page.js', 'utf8');
  // 页面标题/官方标题/侧栏注释均按 label 派生
  assert.match(source, /const label = config\.label/);
  assert.match(source, /const isShanghai = region === 'shanghai'/);
  assert.match(source, /title=\{`\$\{currentYear\} \$\{label\}体育考试改革专题`\}/);
  assert.match(source, /officialTitle=\{`这几份文件决定了今年\$\{label\}体育考试改革怎么走`\}/);
  // 上海体育 30 分只能出现在 isShanghai 三元/分支内
  assert.match(source, /const keyFacts = isShanghai \? \[/);
  assert.match(source, /sideNotes=\{isShanghai \? \[/);
  assert.match(source, /满分为 30 分/);
  // 官方文件：上海走固定 ID，其他地区动态按官方来源取
  assert.match(source, /const officialFocus = isShanghai/);
  assert.match(source, /\.filter\(\(n\) => n\.source\?\.type === 'official'\)/);
});

test('专题组件对空数组不渲染，杜绝空壳区块', () => {
  const shell = readFileSync(SHELL, 'utf8');
  assert.match(shell, /officialItems\.length > 0/);
  assert.match(shell, /sections\.filter\(\(section\) => section\.items\.length > 0\)/);
  assert.match(shell, /policyItems\.length > 0/);
  assert.match(shell, /sideLinks\.length > 0/);
});
