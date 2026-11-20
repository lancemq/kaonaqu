// 检查并按需拉起 kaonaqu pg 隧道（15432 → 服务器 127.0.0.1:5432）。
// 供自动化任务第 -1 步调用：隧道断则自动重连，幂等可重复跑。
// 退出码 0 = 隧道就绪；1 = 拉起失败。
const { execFileSync, spawn } = require('child_process');

function tunnelAlive() {
  try {
    const out = execFileSync('lsof', ['-nP', '-iTCP:15432', '-sTCP:LISTEN'], { encoding: 'utf8' });
    return out.includes('LISTEN');
  } catch { return false; }
}

function pgHealthy() {
  try {
    execFileSync('node', ['-e', `
const {Client}=require('${__dirname}/../node_modules/pg');
const c=new Client({connectionString:'postgres://kaonaqu:Knq_2026_Prod_8848@127.0.0.1:15432/kaonaqu',connectionTimeoutMillis:6000});
c.connect().then(async()=>{await c.query('SELECT 1');await c.end();process.exit(0);}).catch(e=>{console.error(e.message);process.exit(1);});
`], { stdio: 'pipe', timeout: 20000 });
    return true;
  } catch { return false; }
}

function main() {
  if (tunnelAlive() && pgHealthy()) {
    console.log('TUNNEL OK (already up)');
    return 0;
  }
  // 清理僵尸
  try { execFileSync('pkill', ['-f', '15432:127.0.0.1:5432']); } catch {}
  const sleepMs = 1000;
  const child = spawn('/usr/bin/ssh', [
    '-N', '-o', 'BatchMode=yes', '-o', 'ServerAliveInterval=30',
    '-o', 'ServerAliveCountMax=3', '-o', 'ExitOnForwardFailure=yes',
    '-o', 'ConnectTimeout=15',
    '-L', '127.0.0.1:15432:127.0.0.1:5432',
    'ubuntu@124.221.252.243'
  ], { detached: true, stdio: 'ignore' });
  child.unref();
  // 等待就绪
  for (let i = 0; i < 10; i++) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, sleepMs);
    if (tunnelAlive() && pgHealthy()) {
      console.log('TUNNEL OK (restarted pid=' + child.pid + ')');
      return 0;
    }
  }
  console.error('TUNNEL FAIL: 重连后仍不可用');
  return 1;
}
process.exit(main());
