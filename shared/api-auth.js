// API 鉴权与 CORS 工具（CommonJS，供 app/api/[...slug]/route.js 与测试共用）。
// 写操作（POST/PUT/DELETE）必须带合法 Bearer Token；GET/OPTIONS 只读放行。
// 用于直连 service_role Supabase 的写 API 防护，未配置 token 时 fail-closed。

const { timingSafeEqual } = require('crypto');

const DEFAULT_ALLOW_ORIGINS = 'http://localhost:3000,https://kaonaqu.xyz';

function getAdminToken() {
  return process.env.KNQ_ADMIN_TOKEN || '';
}

function getAllowOrigins() {
  return (process.env.KNQ_API_ALLOW_ORIGINS || DEFAULT_ALLOW_ORIGINS)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getCorsOrigin(request) {
  const origin = request.headers.get('origin') || '';
  return getAllowOrigins().includes(origin) ? origin : null;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

// 恒定时间字符串比较，避免时序侧信道泄露 token 长度/前缀信息。
function safeEqualToken(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}

// 返回 null（通过）或 { statusCode, message, code }（拒绝）。
function checkWriteAuth(request, method) {
  if (method === 'GET' || method === 'OPTIONS') return null;

  const token = getAdminToken();
  if (!token) {
    console.error('[api] 写操作被拒：未配置 KNQ_ADMIN_TOKEN（fail-closed）');
    return { statusCode: 403, message: '服务端未启用写操作鉴权', code: 'AUTH_NOT_CONFIGURED' };
  }

  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    return { statusCode: 401, message: '未提供有效的 Authorization Bearer token', code: 'UNAUTHORIZED' };
  }

  if (!safeEqualToken(match[1].trim(), token)) {
    return { statusCode: 403, message: '禁止访问', code: 'FORBIDDEN' };
  }

  return null;
}

module.exports = {
  DEFAULT_ALLOW_ORIGINS,
  getAdminToken,
  getAllowOrigins,
  getCorsOrigin,
  corsHeaders,
  safeEqualToken,
  checkWriteAuth
};
