import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { checkWriteAuth, getCorsOrigin, corsHeaders, safeEqualToken } = require('../shared/api-auth');

function makeRequest({ authorization, origin } = {}) {
  const headers = new Headers();
  if (authorization !== undefined) headers.set('authorization', authorization);
  if (origin !== undefined) headers.set('origin', origin);
  return { headers };
}

// 防御：每个 test 自行恢复 env，避免相互污染。
function withEnv(overrides, fn) {
  const saved = {};
  for (const [k, v] of Object.entries(overrides)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test('GET 请求不鉴权（即使未配置 token）', () => {
  withEnv({ KNQ_ADMIN_TOKEN: undefined }, () => {
    const req = makeRequest({});
    assert.equal(checkWriteAuth(req, 'GET'), null);
  });
});

test('OPTIONS 预检不鉴权', () => {
  withEnv({ KNQ_ADMIN_TOKEN: undefined }, () => {
    const req = makeRequest({});
    assert.equal(checkWriteAuth(req, 'OPTIONS'), null);
  });
});

test('未配置 KNQ_ADMIN_TOKEN 时写操作 fail-closed 403', () => {
  withEnv({ KNQ_ADMIN_TOKEN: undefined }, () => {
    const req = makeRequest({ authorization: 'Bearer anything' });
    const result = checkWriteAuth(req, 'POST');
    assert.equal(result.statusCode, 403);
    assert.equal(result.code, 'AUTH_NOT_CONFIGURED');
  });
});

test('无 Authorization header -> 401', () => {
  withEnv({ KNQ_ADMIN_TOKEN: 'secret-token' }, () => {
    const req = makeRequest({});
    const result = checkWriteAuth(req, 'POST');
    assert.equal(result.statusCode, 401);
    assert.equal(result.code, 'UNAUTHORIZED');
  });
});

test('Authorization 非 Bearer 格式 -> 401', () => {
  withEnv({ KNQ_ADMIN_TOKEN: 'secret-token' }, () => {
    const req = makeRequest({ authorization: 'Basic abc123' });
    const result = checkWriteAuth(req, 'PUT');
    assert.equal(result.statusCode, 401);
    assert.equal(result.code, 'UNAUTHORIZED');
  });
});

test('Bearer 前缀大小写不敏感（小写 bearer 也能解析）', () => {
  // 即便用小写 bearer，正则 /i 应能解析出 token；与正确 token 匹配应通过。
  withEnv({ KNQ_ADMIN_TOKEN: 'secret-token' }, () => {
    const req = makeRequest({ authorization: 'bearer secret-token' });
    assert.equal(checkWriteAuth(req, 'POST'), null);
  });
});

test('错误 token -> 403', () => {
  withEnv({ KNQ_ADMIN_TOKEN: 'secret-token' }, () => {
    const req = makeRequest({ authorization: 'Bearer wrong-token' });
    const result = checkWriteAuth(req, 'DELETE');
    assert.equal(result.statusCode, 403);
    assert.equal(result.code, 'FORBIDDEN');
  });
});

test('正确 token 通过 POST/PUT/DELETE', () => {
  withEnv({ KNQ_ADMIN_TOKEN: 'secret-token' }, () => {
    const req = makeRequest({ authorization: 'Bearer secret-token' });
    assert.equal(checkWriteAuth(req, 'POST'), null);
    assert.equal(checkWriteAuth(req, 'PUT'), null);
    assert.equal(checkWriteAuth(req, 'DELETE'), null);
  });
});

test('token 带前后空白仍可匹配（trim）', () => {
  withEnv({ KNQ_ADMIN_TOKEN: 'secret-token' }, () => {
    const req = makeRequest({ authorization: 'Bearer   secret-token   ' });
    assert.equal(checkWriteAuth(req, 'POST'), null);
  });
});

test('safeEqualToken 长度不同返回 false', () => {
  assert.equal(safeEqualToken('abc', 'abcd'), false);
  assert.equal(safeEqualToken('', 'abcd'), false);
  assert.equal(safeEqualToken('abc', 'abc'), true);
});

// === CORS ===

test('CORS 白名单内 Origin 返回具体值', () => {
  withEnv({ KNQ_API_ALLOW_ORIGINS: undefined }, () => {
    const req = makeRequest({ origin: 'http://localhost:3000' });
    assert.equal(getCorsOrigin(req), 'http://localhost:3000');
  });
});

test('CORS 默认白名单含 kaonaqu.xyz', () => {
  withEnv({ KNQ_API_ALLOW_ORIGINS: undefined }, () => {
    const req = makeRequest({ origin: 'https://kaonaqu.xyz' });
    assert.equal(getCorsOrigin(req), 'https://kaonaqu.xyz');
  });
});

test('CORS 白名单外 Origin 返回 null', () => {
  withEnv({ KNQ_API_ALLOW_ORIGINS: undefined }, () => {
    const req = makeRequest({ origin: 'https://evil.com' });
    assert.equal(getCorsOrigin(req), null);
  });
});

test('CORS 无 Origin header 返回 null', () => {
  withEnv({ KNQ_API_ALLOW_ORIGINS: undefined }, () => {
    const req = makeRequest({});
    assert.equal(getCorsOrigin(req), null);
  });
});

test('CORS 自定义白名单（逗号分隔含空白）', () => {
  withEnv({ KNQ_API_ALLOW_ORIGINS: 'https://a.com , https://b.com ' }, () => {
    assert.equal(getCorsOrigin(makeRequest({ origin: 'https://a.com' })), 'https://a.com');
    assert.equal(getCorsOrigin(makeRequest({ origin: 'https://b.com' })), 'https://b.com');
    assert.equal(getCorsOrigin(makeRequest({ origin: 'https://c.com' })), null);
  });
});

test('corsHeaders 包含必要字段', () => {
  const h = corsHeaders('http://localhost:3000');
  assert.equal(h['Access-Control-Allow-Origin'], 'http://localhost:3000');
  assert.equal(h['Access-Control-Allow-Credentials'], 'false');
  assert.ok(h['Access-Control-Allow-Methods'].includes('POST'));
  assert.ok(h['Access-Control-Allow-Methods'].includes('OPTIONS'));
  assert.ok(h['Access-Control-Allow-Headers'].includes('Authorization'));
  assert.ok(h['Access-Control-Allow-Headers'].includes('Content-Type'));
  assert.equal(h['Vary'], 'Origin');
});

test('corsHeaders 无 origin 时 ACAO 为空字符串（不下发 *）', () => {
  const h = corsHeaders(null);
  assert.equal(h['Access-Control-Allow-Origin'], '');
});
