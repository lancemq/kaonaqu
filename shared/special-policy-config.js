// 地区专题政策配置：从 content/special-policies/{region}/{variant}.json 读取。
// 无配置文件的地区返回 null → 调用方走精简模式（只展示动态新闻 + 事实摘要，
// 绝不 fallback 到上海口径，避免政策数字串区）。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONFIG_ROOT = path.join(ROOT, 'content', 'special-policies');

function getSpecialConfig(region, variant) {
  const file = path.join(CONFIG_ROOT, String(region || ''), `${String(variant || '')}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`专题政策配置解析失败: ${path.relative(ROOT, file)}: ${e.message}`);
  }
}

function hasSpecialConfig(region, variant) {
  const file = path.join(CONFIG_ROOT, String(region || ''), `${String(variant || '')}.json`);
  return fs.existsSync(file);
}

module.exports = { getSpecialConfig, hasSpecialConfig, CONFIG_ROOT };
