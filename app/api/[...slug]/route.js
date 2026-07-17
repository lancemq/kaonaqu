import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { handleApiRequest } = require('../../../shared/api-router');
const { checkWriteAuth, getCorsOrigin, corsHeaders } = require('../../../shared/api-auth');

// Route handler 不继承 layout 的 fetchCache 段配置，需单独设置。
// force-cache 使 GET 请求的 Supabase 查询被 Data Cache 缓存（revalidate: 60s），
// 即使 handler 内先访问了 request.method / headers / searchParams 等 Request-time API。
// 写操作（POST/PUT/DELETE）不受影响（非 GET，Data Cache 不缓存）。
export const fetchCache = 'force-cache';

// 写操作（POST/PUT/DELETE）成功后立即失效 Data Cache，确保读自己写一致性。
// tag 与 shared/supabase-client.js cachedFetch 的 tags 对齐。
const SUPABASE_DATA_TAG = 'supabase-data';

function jsonError(statusCode, message, code, corsOrigin) {
  return NextResponse.json(
    { error: message, code },
    { status: statusCode, headers: corsHeaders(corsOrigin) }
  );
}

async function handle(request, paramsPromise) {
  const corsOrigin = getCorsOrigin(request);

  // OPTIONS 预检：始终放行（否则浏览器跨域预检失败），但 ACAO 只在白名单内才下发。
  if (request.method === 'OPTIONS') {
    return NextResponse.json({}, { status: 200, headers: corsHeaders(corsOrigin) });
  }

  // 写操作鉴权闸门：放在业务处理之前。
  const denied = checkWriteAuth(request, request.method);
  if (denied) {
    return jsonError(denied.statusCode, denied.message, denied.code, corsOrigin);
  }

  const params = await paramsPromise;
  const pathname = `/api/${(params.slug || []).join('/')}`;
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const body = request.method === 'GET' || request.method === 'DELETE' ? null : await request.json().catch(() => ({}));

  try {
    const result = await handleApiRequest({
      method: request.method,
      pathname,
      query,
      body
    });

    // 写操作成功后立即失效 Data Cache（异步失效，调用立即返回）。
    // 让后续 GET /api/* 与页面 loadDataStore() 拿到最新数据，避免 60s 延迟。
    if (request.method !== 'GET') {
      revalidateTag(SUPABASE_DATA_TAG);
    }

    return NextResponse.json(result.payload, {
      status: result.statusCode,
      headers: corsHeaders(corsOrigin)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: error.statusCode || 500,
        headers: corsHeaders(corsOrigin)
      }
    );
  }
}

export async function GET(request, context) {
  return handle(request, context.params);
}

export async function POST(request, context) {
  return handle(request, context.params);
}

export async function PUT(request, context) {
  return handle(request, context.params);
}

export async function DELETE(request, context) {
  return handle(request, context.params);
}

export function OPTIONS(request) {
  const corsOrigin = getCorsOrigin(request);
  return NextResponse.json({}, { status: 200, headers: corsHeaders(corsOrigin) });
}
