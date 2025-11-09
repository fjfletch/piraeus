import { MCPIntegration } from '@/types/mcp';

const MCP_STORAGE_PREFIX = 'mcp_';
const MCP_LIST_KEY = 'mcp_list';

export function saveMCPToStorage(mcp: MCPIntegration): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${MCP_STORAGE_PREFIX}${mcp.id}`;
    localStorage.setItem(key, JSON.stringify(mcp));
    
    // Update the list of MCP IDs
    const list = getMCPList();
    if (!list.includes(mcp.id)) {
      list.push(mcp.id);
      localStorage.setItem(MCP_LIST_KEY, JSON.stringify(list));
    }
  } catch (error) {
    console.error('Error saving MCP to storage:', error);
  }
}

export function loadMCPFromStorage(id: string): MCPIntegration | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `${MCP_STORAGE_PREFIX}${id}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as MCPIntegration;
  } catch (error) {
    console.error('Error loading MCP from storage:', error);
    return null;
  }
}

export function getAllMCPs(): MCPIntegration[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const list = getMCPList();
    return list
      .map((id) => loadMCPFromStorage(id))
      .filter((mcp): mcp is MCPIntegration => mcp !== null);
  } catch (error) {
    console.error('Error getting all MCPs:', error);
    return [];
  }
}

export function deleteMCPFromStorage(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${MCP_STORAGE_PREFIX}${id}`;
    localStorage.removeItem(key);
    
    // Update the list
    const list = getMCPList();
    const filtered = list.filter((mcpId) => mcpId !== id);
    localStorage.setItem(MCP_LIST_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting MCP from storage:', error);
  }
}

export function createNewMCP(): MCPIntegration {
  const timestamp = Date.now().toString();
  
  // Sample Weather API
  const weatherAPI = {
    id: `api-weather-${timestamp}`,
    name: 'Weather API',
    baseUrl: 'https://api.weatherapi.com/v1',
    authentication: {
      type: 'api-key' as const,
      config: { keyName: 'key', keyValue: 'YOUR_API_KEY' },
    },
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30,
    routes: [
      {
        id: `route-1-${timestamp}`,
        method: 'GET' as const,
        path: '/current.json',
        description: 'Get current weather for a location',
      },
      {
        id: `route-2-${timestamp}`,
        method: 'GET' as const,
        path: '/forecast.json',
        description: 'Get weather forecast for a location',
      },
    ],
    status: 'disconnected' as const,
  };

  // Sample Calendar API
  const calendarAPI = {
    id: `api-calendar-${timestamp}`,
    name: 'Calendar API',
    baseUrl: 'https://api.example.com/calendar',
    authentication: {
      type: 'bearer' as const,
      config: { token: 'YOUR_BEARER_TOKEN' },
    },
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30,
    routes: [
      {
        id: `route-3-${timestamp}`,
        method: 'POST' as const,
        path: '/events',
        description: 'Create a new calendar event',
        body: '{\n  "title": "Meeting",\n  "date": "2025-01-15",\n  "time": "14:00",\n  "duration": 60\n}',
      },
      {
        id: `route-4-${timestamp}`,
        method: 'GET' as const,
        path: '/events',
        description: 'List all calendar events',
      },
    ],
    status: 'disconnected' as const,
  };

  // Sample Weather Tool
  const weatherTool = {
    id: `tool-weather-${timestamp}`,
    name: 'get_current_weather',
    displayName: 'Get Current Weather',
    description: 'Get the current weather for a specific location. Use this when the user asks about current weather conditions.',
    apiId: weatherAPI.id,
    method: 'GET',
    endpoint: '/current.json',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name or coordinates (e.g., "London" or "48.8567,2.3508")',
        },
      },
      required: ['location'],
    },
    responseHandling: {
      successPath: '$.current',
      errorHandling: {},
    },
    errorGuidance: 'If the location is not found, ask the user to provide a valid city name or coordinates.',
  };

  // Sample Calendar Tool
  const calendarTool = {
    id: `tool-calendar-${timestamp}`,
    name: 'create_event',
    displayName: 'Create Calendar Event',
    description: 'Create a new event in the calendar. Use this when the user wants to schedule a meeting or reminder.',
    apiId: calendarAPI.id,
    method: 'POST',
    endpoint: '/events',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Event title or name',
        },
        date: {
          type: 'string',
          description: 'Event date in YYYY-MM-DD format',
        },
        time: {
          type: 'string',
          description: 'Event time in HH:MM format (24-hour)',
        },
        duration: {
          type: 'number',
          description: 'Duration in minutes',
        },
      },
      required: ['title', 'date', 'time'],
    },
    responseHandling: {
      successPath: '$',
      errorHandling: {},
    },
    errorGuidance: 'If the date/time is invalid or in the past, inform the user and ask for a valid future date.',
  };

  // Sample prompt
  const samplePrompt = {
    id: `prompt-1-${timestamp}`,
    type: 'contextual' as const,
    content: 'When providing weather information, always include temperature, conditions, and any relevant safety advice.',
  };

  return {
    id: timestamp,
    name: 'Sample MCP Integration',
    description: 'A sample MCP with Weather and Calendar integrations',
    version: '1.0.0',
    format: 'gpt-4',
    author: 'MCP Builder',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    published: false,
    apis: [weatherAPI, calendarAPI],
    tools: [weatherTool, calendarTool],
    prompts: [samplePrompt],
    resources: [],
    configuration: {
      globalPrompt: 'You are a helpful AI assistant with access to weather and calendar tools. Use them when appropriate to help users.',
      model: 'gpt-4-turbo',
      temperature: 0.7,
      maxTokens: 2000,
    },
    flow: {
      nodes: [],
      edges: [],
    },
  };
}

function getMCPList(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(MCP_LIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting MCP list:', error);
    return [];
  }
}
