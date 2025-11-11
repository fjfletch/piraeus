# Start Backend Server (Windows) - Local Development

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  MCP Factor Backend Server - Local Dev" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python not found!" -ForegroundColor Red
    Write-Host "Please install Python 3.9+ from https://python.org" -ForegroundColor Yellow
    exit 1
}

# Check for required environment variables
$envVarsOk = $true

if (-not $env:SUPABASE_URL) {
    Write-Host "WARNING: SUPABASE_URL not set" -ForegroundColor Yellow
    $envVarsOk = $false
}

if (-not $env:SUPABASE_KEY) {
    Write-Host "WARNING: SUPABASE_KEY not set" -ForegroundColor Yellow
    $envVarsOk = $false
}

if (-not $env:OPENAI_API_KEY -and -not $env:OPENAI-SECRET) {
    Write-Host "WARNING: OPENAI_API_KEY not set (workflow won't work)" -ForegroundColor Yellow
    $envVarsOk = $false
}

if (-not $envVarsOk) {
    Write-Host ""
    Write-Host "Missing environment variables!" -ForegroundColor Red
    Write-Host "Create a .env file in the backend folder with:" -ForegroundColor Yellow
    Write-Host @"
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
"@ -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        exit 1
    }
}

Write-Host ""
Write-Host "Installing/updating dependencies..." -ForegroundColor Cyan

# Install dependencies
python -m pip install -e . --quiet

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Green
Write-Host "  URL: http://localhost:8000" -ForegroundColor White
Write-Host "  Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Health: http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start the server
python -m uvicorn src.dynamic_tools.api.app:app --reload --host 0.0.0.0 --port 8000


