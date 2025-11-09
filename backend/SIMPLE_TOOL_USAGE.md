# SimpleToolSpec & SimpleToolExecutor Usage Guide

## Overview

`SimpleToolSpec` and `SimpleToolExecutor` provide a minimal, lightweight way to define and execute HTTP API calls. They're designed to work seamlessly with `HTTPClientService`.

**Key Features:**
- ✅ Minimal schema (just url, method, headers, api_key, type)
- ✅ Automatic parameter routing (query_params for GET, body for POST/PUT)
- ✅ API key injection into headers
- ✅ Comprehensive logging with sensitive data masking
- ✅ Returns full response metadata (status, headers, body, timing)

## Quick Start

### 1. Define a Tool

```python
from dynamic_tools.models.simple_tool import SimpleToolSpec

# Minimal: just URL and method defaults to GET
spec = SimpleToolSpec(url="https://api.example.com/users")

# Or with all options
spec = SimpleToolSpec(
    url="https://api.example.com/users",
    method="GET",
    headers={"Accept": "application/json", "User-Agent": "MyApp/1.0"},
    api_key="sk-1234567890",
    api_key_header="Authorization",
    type="api"
)
```

### 2. Execute the Tool

```python
from dynamic_tools.services.simple_tool_executor import SimpleToolExecutor

executor = SimpleToolExecutor()

# GET request - parameters become query params
response = await executor.execute(
    spec,
    {"page": 1, "limit": 20, "search": "alice"}
)

# Response is HTTPResponseSpec
print(response.status_code)      # 200
print(response.headers)           # {...}
print(response.body)              # {"users": [...]}
print(response.execution_time_ms) # 125.5
```

## HTTP Methods

### GET Request
Parameters are converted to query parameters (all as strings):

```python
spec = SimpleToolSpec(url="https://api.example.com/users", method="GET")
await executor.execute(spec, {"page": 1, "limit": 10})
# URL becomes: https://api.example.com/users?page=1&limit=10
```

### POST Request
Parameters are sent as JSON body:

```python
spec = SimpleToolSpec(
    url="https://api.example.com/users",
    method="POST",
    headers={"Content-Type": "application/json"}
)
await executor.execute(spec, {"name": "Alice", "email": "alice@example.com"})
# Body: {"name": "Alice", "email": "alice@example.com"}
```

### PUT Request
Similar to POST - parameters become JSON body:

```python
spec = SimpleToolSpec(
    url="https://api.example.com/users/123",
    method="PUT"
)
await executor.execute(spec, {"name": "Bob"})
```

### DELETE Request
No body by default:

```python
spec = SimpleToolSpec(
    url="https://api.example.com/users/123",
    method="DELETE"
)
await executor.execute(spec, {})
```

### PATCH Request
Parameters become JSON body:

```python
spec = SimpleToolSpec(
    url="https://api.example.com/users/123",
    method="PATCH"
)
await executor.execute(spec, {"status": "active"})
```

## Authentication

### API Key in Authorization Header

```python
spec = SimpleToolSpec(
    url="https://api.example.com/data",
    method="GET",
    api_key="sk-1234567890"
    # api_key_header defaults to "Authorization"
)
# Header sent: Authorization: sk-1234567890
```

### API Key in Custom Header

```python
spec = SimpleToolSpec(
    url="https://api.example.com/data",
    method="GET",
    api_key="my-api-key",
    api_key_header="X-API-Key"
)
# Header sent: X-API-Key: my-api-key
```

### Custom Headers + API Key

```python
spec = SimpleToolSpec(
    url="https://api.example.com/data",
    method="GET",
    headers={"User-Agent": "MyApp/1.0", "Accept": "application/json"},
    api_key="sk-1234567890",
    api_key_header="Authorization"
)
# Headers sent:
# User-Agent: MyApp/1.0
# Accept: application/json
# Authorization: sk-1234567890
```

## Response Handling

All responses are `HTTPResponseSpec` objects:

```python
response = await executor.execute(spec, params)

# Access response data
status = response.status_code           # int (200, 404, etc)
headers = response.headers              # dict
body = response.body                    # dict or string, depending on Content-Type
timing = response.execution_time_ms     # float

# Check success
if response.status_code == 200:
    data = response.body
    print(f"Request completed in {timing:.2f}ms")
```

### Response Body Parsing

The executor automatically parses response bodies based on Content-Type:

- **application/json**: Parsed to Python dict
- **text/plain, text/html, etc**: Kept as string
- **204 No Content**: body is None

## Error Handling

Errors from HTTPClientService are propagated as exceptions:

```python
try:
    response = await executor.execute(spec, params)
except Exception as e:
    print(f"Request failed: {e}")
    # Possible errors:
    # - Connection errors (httpx.NetworkError)
    # - Timeout errors (httpx.TimeoutException)
    # - HTTP errors (httpx.HTTPStatusError)
```

## Logging

The executor includes comprehensive logging:

```
INFO     SimpleToolExecutor.execute() called for GET https://api.example.com/users
DEBUG    Parameters: {'page': '1', 'limit': '10'}  # Query string logged
DEBUG    Built HTTPRequestSpec: GET https://api.example.com/users
INFO     SimpleToolExecutor execution completed in 125.45ms with status 200
```

Sensitive parameters are automatically masked in logs:
- `password`, `token`, `secret`, `api_key`, `apikey`, `key`, `auth`

```
DEBUG    Parameters: {'username': 'alice', 'password': '***REDACTED***', 'token': '***REDACTED***'}
```

## Examples

### Weather API Call

```python
spec = SimpleToolSpec(
    url="https://api.openweathermap.org/data/2.5/weather",
    method="GET",
    api_key="YOUR_API_KEY",
    api_key_header="appid"
)

response = await executor.execute(spec, {
    "q": "London",
    "units": "metric"
})

print(f"Temperature: {response.body['main']['temp']}°C")
```

### REST API with Authentication

```python
spec = SimpleToolSpec(
    url="https://api.example.com/v1/users",
    method="POST",
    headers={
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    api_key="Bearer my-jwt-token",
    api_key_header="Authorization"
)

response = await executor.execute(spec, {
    "name": "John Doe",
    "email": "john@example.com"
})

if response.status_code == 201:
    user_id = response.body["id"]
    print(f"User created with ID: {user_id}")
```

### Pagination Example

```python
spec = SimpleToolSpec(
    url="https://api.example.com/items",
    method="GET"
)

all_items = []
page = 1

while True:
    response = await executor.execute(spec, {"page": page, "limit": 100})
    
    if response.status_code != 200:
        break
    
    items = response.body.get("items", [])
    if not items:
        break
    
    all_items.extend(items)
    page += 1

print(f"Fetched {len(all_items)} items")
```

## Integration with Tool Generator

SimpleToolExecutor can use output from the tool generator:

```python
# After generating a tool config with ToolConfigGenerator
generated_config = await tool_generator.generate_tool_config(
    tool_name="weather",
    tool_description="Get weather for a city",
    api_docs="..."
)

# Extract the API spec from the generated config
api_config = generated_config["api"]

# Create SimpleToolSpec from it
spec = SimpleToolSpec(
    url=api_config["base_url"],
    method=api_config["method"],
    headers=api_config.get("headers"),
    api_key=api_config["auth"].get("secret_ref")  # if configured
)

# Execute with SimpleToolExecutor
response = await executor.execute(spec, user_parameters)
```

## Performance

- **Timeout**: Default 30 seconds (configurable)
- **Retries**: 3 attempts with exponential backoff for 5xx errors
- **Execution Timing**: Included in response (milliseconds)

```python
# Custom timeout and retries
executor = SimpleToolExecutor(timeout=60.0, max_retries=5)
```

## Testing

See `tests/test_simple_tool_executor.py` for comprehensive examples:

```bash
# Run all tests
pytest tests/test_simple_tool_executor.py -v

# Run specific test class
pytest tests/test_simple_tool_executor.py::TestSimpleToolExecutorExecute -v

# Run with coverage
pytest tests/test_simple_tool_executor.py --cov=dynamic_tools
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User Application                                            │
└────────────────────┬────────────────────────────────────────┘
                     │ SimpleToolSpec + Parameters
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ SimpleToolExecutor                                          │
│  • Build HTTPRequestSpec                                    │
│  • Inject API keys                                          │
│  • Route parameters (query/body)                            │
│  • Handle logging                                           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPRequestSpec
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ HTTPClientService                                           │
│  • Execute HTTP request                                     │
│  • Retry logic (5xx errors)                                 │
│  • Parse response                                           │
│  • Track timing                                             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPResponseSpec
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ User Application (receives response)                        │
│  • Status code, headers, body, timing                       │
└─────────────────────────────────────────────────────────────┘
```

