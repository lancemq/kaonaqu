// 数据层冒烟：wuxi/nanjing 经新架构 data-store 读库
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '../.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim().replace(/^['"]|['"]$/g, '');
  if (process.env[m[1]] === undefined) process.env[m[1]] = v;
}
const { loadSchoolsList } = require('../shared/data-store');
(async () => {
  const [wx, nj] = await Promise.all([loadSchoolsList('wuxi'), loadSchoolsList('nanjing')]);
  console.log('wuxi:', wx.length, ' nanjing:', nj.length);
  if (wx.length) console.log('wuxi 样本:', wx.slice(0, 2).map(s => `${s.id}/${s.districtName || '?'}/${s.schoolKeyLevel}`).join(' | '));
  process.exit(wx.length > 0 ? 0 : 1);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
