const DATASET_NAMES = ['districts', 'schools', 'policies', 'news'];
const DEFAULT_PREFIX = process.env.BLOB_DATA_PREFIX || 'runtime-data';
const DEFAULT_ACCESS = process.env.BLOB_ACCESS || 'private';

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function uploadDataToBlob(datasets, prefix = DEFAULT_PREFIX) {
  const { put } = require('@vercel/blob');
  if (!hasBlobToken()) {
    throw new Error('BLOB_READ_WRITE_TOKEN 未配置');
  }

  const uploads = await Promise.all(DATASET_NAMES.map(async (name) => {
    const payload = datasets[name];
    if (!payload) {
      return null;
    }

    const blob = await put(`${prefix}/${name}.json`, JSON.stringify(payload, null, 2), {
      access: DEFAULT_ACCESS,
      addRandomSuffix: false,
      contentType: 'application/json; charset=utf-8',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return { name, url: blob.url };
  }));

  return Object.fromEntries(uploads.filter(Boolean).map((item) => [item.name, item.url]));
}

async function loadDataFromBlob(prefix = DEFAULT_PREFIX) {
  const { list } = require('@vercel/blob');
  if (!hasBlobToken()) {
    return null;
  }

  const { blobs } = await list({
    prefix: `${prefix}/`,
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  const blobMap = new Map(blobs.map((blob) => [blob.pathname, blob]));
  const entries = await Promise.all(DATASET_NAMES.map(async (name) => {
    const blob = blobMap.get(`${prefix}/${name}.json`);
    if (!blob) {
      throw new Error(`Blob 中缺少 ${name}.json`);
    }

    const headers = {};
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      headers.Authorization = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
    }

    const response = await fetch(blob.url, {
      cache: 'no-store',
      headers
    });
    if (!response.ok) {
      throw new Error(`读取 Blob 数据失败: ${name}.json`);
    }

    return [name, await response.json()];
  }));

  return Object.fromEntries(entries);
}

module.exports = {
  DATASET_NAMES,
  DEFAULT_PREFIX,
  DEFAULT_ACCESS,
  hasBlobToken,
  loadDataFromBlob,
  uploadDataToBlob
};
