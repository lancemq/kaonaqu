const {
  createNews,
  createSchool,
  deleteNews,
  deleteSchool,
  getNewsById,
  getSchoolById,
  listDistricts,
  listNews,
  listSchools,
  searchSchools,
  updateNews,
  updateSchool
} = require('./content-service');
const { DEFAULT_REGION } = require('./region-config');

function methodNotAllowed() {
  const error = new Error('Method not allowed');
  error.statusCode = 405;
  throw error;
}

async function routeCollection(method, id, handlers) {
  if (method === 'GET') {
    return id ? handlers.get(id) : handlers.list();
  }
  if (method === 'POST') {
    return handlers.create();
  }
  if (method === 'PUT') {
    if (!id) {
      const error = new Error('缺少 id');
      error.statusCode = 400;
      throw error;
    }
    return handlers.update(id);
  }
  if (method === 'DELETE') {
    if (!id) {
      const error = new Error('缺少 id');
      error.statusCode = 400;
      throw error;
    }
    return handlers.remove(id);
  }

  methodNotAllowed();
}

async function handleApiRequest({ method, pathname, query = {}, body = null }) {
  // 地区维度：从 query.region 提取，兜底 DEFAULT_REGION（上海）。
  // 写操作的 region 优先取 body.region，其次 query.region；update 不注入 region
  // （地区是学校固有属性，更新其他字段不应改动 region，保留原值）。
  const region = (query.region && String(query.region).trim()) || DEFAULT_REGION;
  const writeRegion = (body && body.region && String(body.region).trim()) || region;

  if (pathname === '/api/districts') {
    if (method !== 'GET') {
      methodNotAllowed();
    }
    return { statusCode: 200, payload: await listDistricts(region) };
  }

  if (pathname === '/api/search') {
    if (method !== 'GET') {
      methodNotAllowed();
    }

    return {
      statusCode: 200,
      payload: await searchSchools(query.q || '', { ...query, region })
    };
  }

  if (pathname === '/api/schools') {
    const id = query.id || query.schoolId || null;
    const payload = await routeCollection(method, id, {
      list: () => listSchools({ ...query, region }),
      get: async (itemId) => {
        const school = await getSchoolById(itemId);
        if (!school) {
          const error = new Error('学校不存在');
          error.statusCode = 404;
          throw error;
        }
        return school;
      },
      create: () => createSchool({ ...(body || {}), region: writeRegion }),
      update: (itemId) => updateSchool(itemId, body || {}),
      remove: async (itemId) => {
        await deleteSchool(itemId);
        return { ok: true, id: itemId };
      }
    });

    return { statusCode: method === 'POST' ? 201 : 200, payload };
  }

  if (pathname === '/api/policies') {
    const id = query.id || query.policyId || null;
    if (id) {
      const policy = await getNewsById(id);
      if (!policy) {
        const error = new Error('政策不存在');
        error.statusCode = 404;
        throw error;
      }
      return { statusCode: 200, payload: policy };
    }
    return { statusCode: 200, payload: await listNews({ ...query, region, newsType: 'policy' }) };
  }

  if (pathname === '/api/news') {
    const id = query.id || query.newsId || null;
    const payload = await routeCollection(method, id, {
      list: () => listNews({ ...query, region }),
      get: async (itemId) => {
        const news = await getNewsById(itemId);
        if (!news) {
          const error = new Error('新闻不存在');
          error.statusCode = 404;
          throw error;
        }
        return news;
      },
      create: () => createNews({ ...(body || {}), region: writeRegion }),
      update: (itemId) => updateNews(itemId, body || {}),
      remove: async (itemId) => {
        await deleteNews(itemId);
        return { ok: true, id: itemId };
      }
    });

    return { statusCode: method === 'POST' ? 201 : 200, payload };
  }

  const error = new Error('API endpoint not found');
  error.statusCode = 404;
  throw error;
}

module.exports = {
  handleApiRequest
};
