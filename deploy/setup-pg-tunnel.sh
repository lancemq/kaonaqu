#!/bin/bash
# kaonaqu 本机 → 服务器 pg SSH 隧道常驻服务（launchd 托管，开机自启 + 掉线自动重连）
# 用法：bash /Users/maqi/project/kaonaqu/deploy/setup-pg-tunnel.sh
set -e

PLIST="$HOME/Library/LaunchAgents/cn.kaonaqu.pg-tunnel.plist"

cat > "$PLIST" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>cn.kaonaqu.pg-tunnel</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/ssh</string>
    <string>-N</string>
    <string>-o</string>
    <string>BatchMode=yes</string>
    <string>-o</string>
    <string>ServerAliveInterval=30</string>
    <string>-o</string>
    <string>ServerAliveCountMax=3</string>
    <string>-o</string>
    <string>ExitOnForwardFailure=yes</string>
    <string>-o</string>
    <string>ConnectTimeout=15</string>
    <string>-L</string>
    <string>127.0.0.1:15432:127.0.0.1:5432</string>
    <string>ubuntu@124.221.252.243</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/kaonaqu-pg-tunnel.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/kaonaqu-pg-tunnel.log</string>
</dict>
</plist>
EOF

# 清掉可能占用 15432 的旧隧道
pkill -f "15432:127.0.0.1:5432" 2>/dev/null || true
sleep 1

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "launchd 已加载 cn.kaonaqu.pg-tunnel"
sleep 4

# 验证
node -e "
const {Client} = require('/Users/maqi/project/kaonaqu/node_modules/pg');
const c = new Client({connectionString: 'postgres://kaonaqu:Knq_2026_Prod_8848@127.0.0.1:15432/kaonaqu', connectionTimeoutMillis: 6000});
c.connect().then(async () => {
  const s = await c.query('SELECT count(*)::int n FROM schools');
  const u = await c.query('SELECT count(*)::int n FROM universities');
  const n = await c.query('SELECT count(*)::int n FROM news');
  console.log('TUNNEL OK: schools', s.rows[0].n, '| universities', u.rows[0].n, '| news', n.rows[0].n);
  await c.end();
}).catch(e => { console.log('TUNNEL FAIL:', e.message); process.exit(1); });
"
