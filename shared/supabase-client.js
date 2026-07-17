// Supabase 客户端初始化（CommonJS，供 data-store.js 与迁移脚本使用）

const { createClient } = require('@supabase/supabase-js');

// 支持：手动配置（KNQ_）、Vercel Supabase 集成（knq_ 前缀）、无前缀（SUPABASE_）
const SUPABASE_URL =
  process.env.KNQ_SUPABASE_URL ||
  process.env.KNQ_KAONA_SUPABASE_URL ||
  process.env.knq_SUPABASE_URL ||
  process.env.knq_KNQ_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const SERVICE_ROLE_KEY =
  process.env.KNQ_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.KNQ_SUPABASE_SECRET_KEY ||
  process.env.knq_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.knq_KNQ_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  '';

const ANON_KEY =
  process.env.KNQ_SUPABASE_ANON_KEY ||
  process.env.KNQ_KAONA_SUPABASE_ANON_KEY ||
  process.env.knq_SUPABASE_ANON_KEY ||
  process.env.knq_KNQ_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  '';

const SCHOOLS_TABLE = process.env.SUPABASE_SCHOOLS_TABLE || 'schools';
const SCHOOL_CONTENTS_TABLE = process.env.SUPABASE_SCHOOL_CONTENTS_TABLE || 'school_contents';
const NEWS_TABLE = process.env.SUPABASE_NEWS_TABLE || 'news';

// Next.js Data Cache 包装：给 Supabase 查询附加持久化缓存（Vercel 跨实例共享），
// 替代已移除的失效文件系统 json 缓存（serverless 上写不进、读不到、跨实例不共享）。
// - 仅对 GET（select）生效：Supabase 写操作是 POST，Next 默认不缓存 POST，无副作用。
// - 在非 Next 运行时（如迁移脚本）globalThis.fetch 未被 patch，next 选项被忽略，自动降级为不缓存。
// - 写操作后列表至多 60s 才刷新（revalidate），如需更强一致性可在写路径调 revalidateTag('supabase-data')。
function cachedFetch(input, init = {}) {
  // 每次调用读取当前 globalThis.fetch：Next 运行期已被 patch，能正确处理 next 缓存选项；
  // 非 Next 环境（迁移脚本）则为原生 fetch，忽略 next（自动降级为不缓存）。
  const fetchFn = globalThis.fetch;
  return fetchFn(input, {
    ...init,
    next: {
      ...(init.next || {}),
      revalidate: 60,
      tags: ['supabase-data']
    }
  });
}

let _serviceClient = null;
let _anonClient = null;

/**
 * 获取 service_role 客户端（服务端专用，有写权限）
 */
function getServiceClient() {
  if (!_serviceClient) {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error('Supabase service_role 配置缺失：需要 KNQ_SUPABASE_URL 和 KNQ_SUPABASE_SERVICE_ROLE_KEY');
    }
    _serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: cachedFetch }
    });
  }
  return _serviceClient;
}

/**
 * 获取 anon 客户端（只读）
 */
function getAnonClient() {
  if (!_anonClient) {
    if (!SUPABASE_URL || !ANON_KEY) {
      throw new Error('Supabase anon 配置缺失：需要 KNQ_SUPABASE_URL 和 KNQ_SUPABASE_ANON_KEY');
    }
    _anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return _anonClient;
}

function isSupabaseConfigured() {
  return !!(SUPABASE_URL && SERVICE_ROLE_KEY);
}

module.exports = {
  getServiceClient,
  getAnonClient,
  isSupabaseConfigured,
  SCHOOLS_TABLE,
  SCHOOL_CONTENTS_TABLE,
  NEWS_TABLE,
  SUPABASE_URL
};
