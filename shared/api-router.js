const {
  createNews,
  createPolicy,
  createSchool,
  deleteNews,
  deletePolicy,
  deleteSchool,
  getNewsById,
  getPolicyById,
  getSchoolById,
  listDistricts,
  listNews,
  listPolicies,
  listSchools,
  searchSchools,
  updateNews,
  updatePolicy,
  updateSchool
} = require('./content-service');

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
  if (pathname === '/api/districts') {
    if (method !== 'GET') {
      methodNotAllowed();
    }
    return { statusCode: 200, payload: await listDistricts() };
  }

  if (pathname === '/api/search') {
    if (method !== 'GET') {
      methodNotAllowed();
    }

    return {
      statusCode: 200,
      payload: await searchSchools(query.q || '', query)
    };
  }

  if (pathname === '/api/schools') {
    const id = query.id || query.schoolId || null;
    const payload = await routeCollection(method, id, {
      list: () => listSchools(query),
      get: async (itemId) => {
        const school = await getSchoolById(itemId);
        if (!school) {
          const error = new Error('学校不存在');
          error.statusCode = 404;
          throw error;
        }
        return school;
      },
      create: () => createSchool(body || {}),
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
    const payload = await routeCollection(method, id, {
      list: () => listPolicies(query),
      get: async (itemId) => {
        const policy = await getPolicyById(itemId);
        if (!policy) {
          const error = new Error('政策不存在');
          error.statusCode = 404;
          throw error;
        }
        return policy;
      },
      create: () => createPolicy(body || {}),
      update: (itemId) => updatePolicy(itemId, body || {}),
      remove: async (itemId) => {
        await deletePolicy(itemId);
        return { ok: true, id: itemId };
      }
    });

    return { statusCode: method === 'POST' ? 201 : 200, payload };
  }

  if (pathname === '/api/news') {
    const id = query.id || query.newsId || null;
    const payload = await routeCollection(method, id, {
      list: () => listNews(query),
      get: async (itemId) => {
        const news = await getNewsById(itemId);
        if (!news) {
          const error = new Error('新闻不存在');
          error.statusCode = 404;
          throw error;
        }
        return news;
      },
      create: () => createNews(body || {}),
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
