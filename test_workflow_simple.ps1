# Test Weather Tool Workflow

$backend = "http://3.136.147.20:8000"
$projectId = "00000000-0000-0000-0000-000000000001"

Write-Host "WEATHER TOOL WORKFLOW TEST"
Write-Host "================================"

# Step 1: Get weather tool from database
Write-Host ""
Write-Host "Step 1: Getting Weather tool from database..."
$tools = Invoke-RestMethod -Uri "$backend/api/projects/$projectId/tools" -Method Get
$weatherTool = $tools | Where-Object { $_.name -eq "Weather" } | Select-Object -First 1

if (!$weatherTool) {
    Write-Host "ERROR: Weather tool not found in database!"
    exit 1
}

Write-Host "SUCCESS: Found $($weatherTool.name)"
Write-Host "  URL: $($weatherTool.url)"
Write-Host "  Method: $($weatherTool.method)"

# Step 2: Register tool
Write-Host ""
Write-Host "Step 2: Registering tool..."

$toolConfig = @{
    name = $weatherTool.name
    description = if ($weatherTool.description) { $weatherTool.description } else { "Get weather information" }
    http_spec = @{
        method = $weatherTool.method
        url = $weatherTool.url
        headers = @{}
        query_params = @{}
        body = $null
    }
} | ConvertTo-Json -Depth 5

try {
    $regResult = Invoke-RestMethod -Uri "$backend/tools/register" -Method Post -Body $toolConfig -ContentType "application/json"
    Write-Host "SUCCESS: $($regResult.message)"
} catch {
    Write-Host "WARNING: $($_.Exception.Message)"
}

# Step 3: Check registered tools
Write-Host ""
Write-Host "Step 3: Checking registered tools..."
$registered = Invoke-RestMethod -Uri "$backend/tools" -Method Get
Write-Host "Registered tools: $($registered.tools -join ', ')"

# Step 4: Test workflow
Write-Host ""
Write-Host "Step 4: Testing workflow..."
$workflowRequest = @{
    user_instructions = "What is the weather in Tokyo?"
    tool_ids = @($weatherTool.name)
    format_response = $true
    response_format_instructions = "Format the weather information clearly"
} | ConvertTo-Json

Write-Host "  Request: What is the weather in Tokyo?"
Write-Host "  Tool: $($weatherTool.name)"
Write-Host ""
Write-Host "Calling workflow endpoint..."

try {
    $result = Invoke-RestMethod -Uri "$backend/workflow" -Method Post -Body $workflowRequest -ContentType "application/json" -TimeoutSec 60
    
    Write-Host ""
    Write-Host "================================"
    Write-Host "WORKFLOW SUCCESS!"
    Write-Host "================================"
    
    Write-Host ""
    Write-Host "Status: $($result.status)"
    Write-Host "Selected Tool: $($result.selected_tool)"
    
    if ($result.http_spec) {
        Write-Host ""
        Write-Host "HTTP Request Generated:"
        Write-Host "  Method: $($result.http_spec.method)"
        Write-Host "  URL: $($result.http_spec.url)"
    }
    
    if ($result.raw_response) {
        $rawStr = $result.raw_response | ConvertTo-Json -Compress
        $displayLen = [Math]::Min(200, $rawStr.Length)
        Write-Host ""
        Write-Host "API Response (first 200 chars):"
        Write-Host "  $($rawStr.Substring(0, $displayLen))..."
    }
    
    if ($result.formatted_response) {
        Write-Host ""
        Write-Host "LLM Formatted Response:"
        Write-Host "----------------------------------------"
        Write-Host $result.formatted_response
        Write-Host "----------------------------------------"
    }
    
    Write-Host ""
    Write-Host "================================"
    Write-Host "TEST COMPLETE - SUCCESS!"
    Write-Host "================================"
    
} catch {
    Write-Host ""
    Write-Host "WORKFLOW FAILED:"
    Write-Host "  Error: $($_.Exception.Message)"
}

