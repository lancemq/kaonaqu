// pg 连接池单例（CommonJS，供 data-store / university-store 及迁移脚本使用）。
// 取代已废弃的 PostgREST over fetch 层。目标库为自建 PostgreSQL
//（服务器 124.221.252.243，本地开发可用直连串 POSTGRES_URL_NON_POOLING）。
//
// 连接串来源（优先级）：
//   DATABASE_URL           —— 生产首选（服务器部署用，标准 postgres:// URL）
//   POSTGRES_URL_NON_POOLING —— 本地开发/迁移（直连串，剥 sslmode 用）
//   POSTGRES_URL           —— pooled 连接兜底
//
// SSL：默认拒绝自签证书失败（生产 pg 建议 accept_invalid_certificates 或正规 CA）。
// 本地连远端库需要 ssl={rejectUnauthorized:false}，由 PG_SSL_REJECT_UNAUTHORIZED=0 控制。
const fs = require('fs');
const path = require('path');

// node 脚本（非 Next 运行时）手工加载 .env.local；Next 运行时 env 已注入，跳过。
// 只在 DATABASE_URL 与 POSTGRES_URL 都未配置时尝试读取，避免覆盖运行时注入值。
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.POSTGRES_URL_NON_POOLING) {
  const p = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(p)) {
    for (const l of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  }
}

function rawConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    ''
  );
}

// 连接串可能带 ?sslmode=require&supa=... 等参数；pg 驱动对 sslmode=require
// 会强制证书校验，pooler 证书链在本地 node 常校验失败 → 连接拒。
// 这里统一剥掉 sslmode 与 supa 参数，SSL 行为由 sslConfig() 显式控制。
function normalizeConnectionString(raw) {
  let url = String(raw || '').trim();
  if (!url) return '';
  url = url.replace(/[?&]sslmode=[^&]*/g, (m) => (m.startsWith('?') ? '?' : '&') === '?' ? '?' : '&');
  // 上面 replace 简洁性不足，改为显式两步：剥参数后清理悬空 &/?
  url = url.replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]supa=[^&]*/g, '');
  url = url.replace(/\?&+/, '?').replace(/&&+/, '&').replace(/[?&]$/, '');
  return url;
}

function sslConfig() {
  // PG_SSL_REJECT_UNAUTHORIZED=0 → 不校验证书（本地连远端库 / 自签部署）
  // 默认（生产正规 CA 或本机内网）走系统校验
  if (String(process.env.PG_SSL_REJECT_UNAUTHORIZED || '') === '0') {
    return { rejectUnauthorized: false };
  }
  // 本地开发连远端库也常无 CA：DATABASE_URL 含 localhost/127.0.0.1 时不加密
  return undefined;
}

let _pool = null;

function getPool() {
  if (_pool) return _pool;
  const cs = normalizeConnectionString(rawConnectionString());
  if (!cs) {
    throw new Error(
      'pg 连接串缺失：需要 DATABASE_URL（生产）或 POSTGRES_URL_NON_POOLING / POSTGRES_URL（本地开发）'
    );
  }
  const { Pool } = require('pg');
  _pool = new Pool({
    connectionString: cs,
    ssl: sslConfig(),
    max: Number(process.env.PG_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
  // 空闲错误只记日志，不让进程崩
  _pool.on('error', (err) => {
    console.error('[pg-pool] idle client error:', err.message);
  });
  return _pool;
}

// 查询便捷封装：query(sql, params) -> rows[]
async function query(sql, params = []) {
  const pool = getPool();
  const { rows } = await pool.query(sql, params);
  return rows;
}

// 数据库是否已配置的运行时开关
function isPgConfigured() {
  return !!rawConnectionString();
}

module.exports = {
  getPool,
  query,
  isPgConfigured,
  normalizeConnectionString,
  rawConnectionString
};
