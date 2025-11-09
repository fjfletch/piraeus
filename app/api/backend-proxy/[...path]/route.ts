/**
 * Next.js API Route Proxy to AWS Backend
 * Solves Mixed Content issue by proxying HTTPS -> HTTP requests server-side
 */

import { NextRequest, NextResponse } from 'next/server';

// Backend URL - defaults to AWS, can be overridden with BACKEND_URL env var for local development
const BACKEND_URL = process.env.BACKEND_URL || 'http://3.136.147.20:8000';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'POST');
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'DELETE');
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'PUT');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Build target URL
    const path = pathSegments.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ''}`;

    console.log(`[Proxy] ${method} ${targetUrl} (segments: ${JSON.stringify(pathSegments)})`);

    // Get request body if present
    let body = undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch (e) {
        console.error('[Proxy] Error reading body:', e);
      }
    }

    // Forward the request to AWS backend
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body || undefined,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    console.log(`[Proxy] Response: ${response.status}`);

    // Get response data
    const data = await response.text();
    
    // Return response with CORS headers
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy error', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
