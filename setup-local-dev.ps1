# Setup script for local development (Windows)

Write-Host "Setting up local development environment..." -ForegroundColor Cyan
Write-Host ""

# Create .env.local for local backend
$envContent = @"
# Local Development - Use local backend
BACKEND_URL=http://localhost:8000
"@

Set-Content -Path ".env.local" -Value $envContent

Write-Host "Created .env.local with local backend URL" -ForegroundColor Green
Write-Host ""
Write-Host "To switch back to AWS:" -ForegroundColor Yellow
Write-Host "   Delete .env.local or run: Remove-Item .env.local"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start backend:  cd backend; .\start-backend-local.ps1"
Write-Host "   2. Start frontend: npm run dev"
Write-Host ""


