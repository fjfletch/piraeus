import { MCPIntegration } from '@/types/mcp';

export const mockMCPs: MCPIntegration[] = [
  {
    id: '1',
    name: 'Riftbound Tournament API',
    description: 'Access live tournament data, player stats, and match results for Riftbound game',
    version: '1.0.0',
    format: 'mcp/1.0',
    author: 'gamingdev',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    published: true,
    stars: 4.8,
    reviews: 234,
    uses: 1200,
    emoji: '🎮',
    apis: [
      {
        id: 'api1',
        name: 'Riftbound API',
        baseUrl: 'https://api.riftbound.com/v1',
        authentication: {
          type: 'api-key',
          config: { keyName: 'X-API-Key', location: 'header' }
        },
        routes: [
          { id: 'r1', method: 'GET', path: '/tournaments', description: 'List all tournaments' },
          { id: 'r2', method: 'GET', path: '/players/:id', description: 'Get player details' }
        ],
        status: 'connected',
        timeout: 30
      }
    ],
    tools: [
      {
        id: 't1',
        name: 'get_tournament_info',
        displayName: 'Get Tournament Info',
        description: 'Fetch information about a specific tournament',
        apiId: 'api1',
        method: 'GET',
        endpoint: '/tournaments/{tournament_id}',
        inputSchema: {
          type: 'object',
          properties: {
            tournament_id: { type: 'string', description: 'Tournament ID' }
          },
          required: ['tournament_id']
        }
      }
    ],
    prompts: [
      {
        id: 'p1',
        type: 'system',
        content: 'You are a gaming assistant that helps users find tournament information and player stats.'
      }
    ],
    resources: [],
    configuration: {
      globalPrompt: 'Provide helpful gaming tournament information',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000
    }
  },
  {
    id: '2',
    name: 'Shopify Product Manager',
    description: 'Manage products, inventory, and orders from your Shopify store',
    version: '1.0.0',
    format: 'mcp/1.0',
    author: 'ecommerce_pro',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-18T16:20:00Z',
    published: true,
    stars: 4.9,
    reviews: 512,
    uses: 3400,
    emoji: '🛍️',
    apis: [],
    tools: [],
    prompts: [],
    resources: [],
    configuration: {
      globalPrompt: 'Help manage Shopify store operations',
      model: 'gpt-4-turbo',
      temperature: 0.5,
      maxTokens: 1500
    }
  },
  {
    id: '3',
    name: 'Travel Planning Assistant',
    description: 'Get flight info, hotel recommendations, and local attractions',
    version: '1.0.0',
    format: 'mcp/1.0',
    author: 'traveltech',
    createdAt: '2024-01-05T12:00:00Z',
    updatedAt: '2024-01-22T10:15:00Z',
    published: true,
    stars: 4.7,
    reviews: 189,
    uses: 890,
    emoji: '✈️',
    apis: [],
    tools: [],
    prompts: [],
    resources: [],
    configuration: {
      globalPrompt: 'Assist with travel planning and recommendations',
      model: 'claude-3-opus',
      temperature: 0.8,
      maxTokens: 3000
    }
  },
  {
    id: '4',
    name: 'Financial Data Aggregator',
    description: 'Access real-time stock prices, market data, and financial news',
    version: '1.2.0',
    format: 'mcp/1.0',
    author: 'fintech_dev',
    createdAt: '2023-12-20T09:00:00Z',
    updatedAt: '2024-01-25T11:30:00Z',
    published: true,
    stars: 4.9,
    reviews: 678,
    uses: 5200,
    emoji: '💰',
    apis: [],
    tools: [],
    prompts: [],
    resources: [],
    configuration: {
      globalPrompt: 'Provide financial market insights and data',
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 2500
    }
  },
  {
    id: '5',
    name: 'Slack Team Communicator',
    description: 'Send messages, create channels, and manage Slack workspaces',
    version: '1.0.0',
    format: 'mcp/1.0',
    author: 'devops_team',
    createdAt: '2024-01-12T14:00:00Z',
    updatedAt: '2024-01-19T09:45:00Z',
    published: true,
    stars: 4.6,
    reviews: 345,
    uses: 2100,
    emoji: '💬',
    apis: [],
    tools: [],
    prompts: [],
    resources: [],
    configuration: {
      globalPrompt: 'Help manage team communication via Slack',
      model: 'gpt-3.5-turbo',
      temperature: 0.6,
      maxTokens: 1000
    }
  },
  {
    id: '6',
    name: 'GitHub Repository Manager',
    description: 'Manage repositories, issues, pull requests, and CI/CD workflows',
    version: '1.1.0',
    format: 'mcp/1.0',
    author: 'opensource_dev',
    createdAt: '2024-01-08T11:00:00Z',
    updatedAt: '2024-01-24T15:00:00Z',
    published: true,
    stars: 5.0,
    reviews: 892,
    uses: 6700,
    emoji: '💻',
    apis: [],
    tools: [],
    prompts: [],
    resources: [],
    configuration: {
      globalPrompt: 'Assist with GitHub repository management',
      model: 'gpt-4',
      temperature: 0.5,
      maxTokens: 2000
    }
  }
];

export const userMCPs: MCPIntegration[] = [
  {
    id: 'user1',
    name: 'My Weather API Integration',
    description: 'Get current weather and forecasts for any location',
    version: '1.0.0',
    format: 'mcp/1.0',
    author: 'me',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-26T14:30:00Z',
    published: false,
    uses: 15,
    apis: [
      {
        id: 'wapi1',
        name: 'OpenWeather API',
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        authentication: {
          type: 'api-key',
          config: { keyName: 'appid', location: 'query' }
        },
        routes: [
          { id: 'wr1', method: 'GET', path: '/weather', description: 'Current weather' },
          { id: 'wr2', method: 'GET', path: '/forecast', description: '5 day forecast' }
        ],
        status: 'connected',
        timeout: 30
      }
    ],
    tools: [
      {
        id: 'wt1',
        name: 'get_current_weather',
        displayName: 'Get Current Weather',
        description: 'Get current weather for a city',
        apiId: 'wapi1',
        method: 'GET',
        endpoint: '/weather',
        inputSchema: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name' },
            units: { type: 'string', description: 'Units (metric/imperial)', default: 'metric' }
          },
          required: ['city']
        }
      }
    ],
    prompts: [
      {
        id: 'wp1',
        type: 'system',
        content: 'You are a weather assistant. Provide clear and helpful weather information.'
      }
    ],
    resources: [],
    configuration: {
      globalPrompt: 'Provide weather information in a friendly manner',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000
    }
  },
  {
    id: 'user2',
    name: 'Recipe Finder',
    description: 'Search recipes and get cooking instructions',
    version: '1.0.0',
    format: 'mcp/1.0',
    author: 'me',
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-25T16:20:00Z',
    published: true,
    uses: 42,
    apis: [
      {
        id: 'rapi1',
        name: 'Spoonacular API',
        baseUrl: 'https://api.spoonacular.com',
        authentication: {
          type: 'api-key',
          config: { keyName: 'apiKey', location: 'query' }
        },
        routes: [
          { id: 'rr1', method: 'GET', path: '/recipes/search', description: 'Search recipes' }
        ],
        status: 'connected',
        timeout: 30
      }
    ],
    tools: [
      {
        id: 'rt1',
        name: 'search_recipes',
        displayName: 'Search Recipes',
        description: 'Search for recipes by ingredients or name',
        apiId: 'rapi1',
        method: 'GET',
        endpoint: '/recipes/search',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' }
          },
          required: ['query']
        }
      }
    ],
    prompts: [],
    resources: [],
    configuration: {
      globalPrompt: 'Help users find delicious recipes',
      model: 'gpt-4',
      temperature: 0.8,
      maxTokens: 1500
    }
  },
  {
    id: 'user3',
    name: 'Task Manager Integration',
    description: 'Manage tasks and to-do lists',
    version: '0.5.0',
    format: 'mcp/1.0',
    author: 'me',
    createdAt: '2024-01-22T11:00:00Z',
    updatedAt: '2024-01-22T11:30:00Z',
    published: false,
    uses: 3,
    apis: [],
    tools: [],
    prompts: [],
    resources: [],
    configuration: {
      globalPrompt: 'Help manage tasks efficiently',
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      maxTokens: 1000
    }
  }
];