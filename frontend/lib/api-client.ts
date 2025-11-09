// API Client utility for MCP Builder

export async function importOpenAPISpec(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error importing OpenAPI spec:', error);
    throw error;
  }
}

export function parseOpenAPISpec(spec: any): {
  baseUrl: string;
  routes: Array<{ method: string; path: string; description: string }>;
} {
  const baseUrl = spec.servers?.[0]?.url || '';
  const routes: Array<{ method: string; path: string; description: string }> = [];

  if (spec.paths) {
    Object.entries(spec.paths).forEach(([path, pathItem]: [string, any]) => {
      ['get', 'post', 'put', 'delete', 'patch'].forEach((method) => {
        if (pathItem[method]) {
          routes.push({
            method: method.toUpperCase(),
            path,
            description: pathItem[method].summary || pathItem[method].description || '',
          });
        }
      });
    });
  }

  return { baseUrl, routes };
}
