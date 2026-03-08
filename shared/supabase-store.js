const TABLES = {
  schools: process.env.SUPABASE_SCHOOLS_TABLE || 'content_schools',
  policies: process.env.SUPABASE_POLICIES_TABLE || 'content_policies',
  news: process.env.SUPABASE_NEWS_TABLE || 'content_news'
};

function getSupabaseUrl() {
  return process.env.SUPABASE_URL
    || process.env.KNQ_SUPABASE_URL
    || process.env.NEXT_PUBLIC_SUPABASE_URL
    || process.env.NEXT_PUBLIC_KNQ_SUPABASE_URL
    || '';
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.KNQ_SUPABASE_SERVICE_ROLE_KEY
    || process.env.KNQ_SUPABASE_SECRET_KEY
    || '';
}

let client;

function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

function getSupabaseClient() {
  const { createClient } = require('@supabase/supabase-js');
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase 服务端配置未完成');
  }

  if (!client) {
    client = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return client;
}

function toStoredRow(record) {
  return {
    id: record.id,
    payload: record,
    updated_at: record.updatedAt || record.publishedAt || new Date().toISOString()
  };
}

function fromStoredRows(rows) {
  return (rows || []).map((row) => row.payload || {}).filter((item) => item && item.id);
}

async function listRecords(datasetName) {
  const supabase = getSupabaseClient();
  const table = TABLES[datasetName];
  const { data, error } = await supabase
    .from(table)
    .select('payload, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Supabase 读取 ${datasetName} 失败: ${error.message}`);
  }

  return fromStoredRows(data);
}

async function replaceRecords(datasetName, records) {
  const supabase = getSupabaseClient();
  const table = TABLES[datasetName];
  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .neq('id', '__never_match__');

  if (deleteError) {
    throw new Error(`Supabase 清空 ${datasetName} 失败: ${deleteError.message}`);
  }

  if (!records.length) {
    return [];
  }

  const { data, error } = await supabase
    .from(table)
    .upsert(records.map(toStoredRow), { onConflict: 'id' })
    .select('payload, updated_at');

  if (error) {
    throw new Error(`Supabase 写入 ${datasetName} 失败: ${error.message}`);
  }

  return fromStoredRows(data);
}

async function upsertRecords(datasetName, records) {
  if (!records.length) {
    return [];
  }

  const supabase = getSupabaseClient();
  const table = TABLES[datasetName];
  const { data, error } = await supabase
    .from(table)
    .upsert(records.map(toStoredRow), { onConflict: 'id' })
    .select('payload, updated_at');

  if (error) {
    throw new Error(`Supabase 增量写入 ${datasetName} 失败: ${error.message}`);
  }

  return fromStoredRows(data);
}

module.exports = {
  TABLES,
  getSupabaseClient,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  hasSupabaseConfig,
  listRecords,
  replaceRecords,
  upsertRecords
};
