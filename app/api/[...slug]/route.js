import { NextResponse } from 'next/server';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { handleApiRequest } = require('../../../shared/api-router');

async function handle(request, paramsPromise) {
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

    return NextResponse.json(result.payload, {
      status: result.statusCode,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: error.statusCode || 500,
        headers: {
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Origin': '*'
        }
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

export function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
