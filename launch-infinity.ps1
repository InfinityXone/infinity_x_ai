# ═══════════════════════════════════════════════════════════════════════
# INFINITY INTELLIGENCE - AUTONOMOUS LAUNCHER
# Starts backend and frontend in separate terminals
# 

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
cd $scriptPath

Clear-Host
Write-Host "
∞ INFINITY INTELLIGENCE LAUNCHER ∞" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
" -ForegroundColor Magenta

# Launch backend in new window
Write-Host "  Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath'; Write-Host '🖥️  BACKEND SERVER' -ForegroundColor Green; pnpm run backend"

Start-Sleep -Seconds 3

# Launch frontend in current window
Write-Host "🎨 Starting Frontend..." -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "✅ Backend: http://localhost:3000" -ForegroundColor Green
Write-Host " Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━
" -ForegroundColor Magenta

pnpm run frontend
