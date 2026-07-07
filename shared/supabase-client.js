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
      auth: { persistSession: false, autoRefreshToken: false }
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
  SUPABASE_URL
};
