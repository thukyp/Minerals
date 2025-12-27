# PowerShell script để deploy lên Vercel
# Sử dụng: .\scripts\deploy-vercel.ps1

Write-Host "🚀 Bắt đầu deploy lên Vercel..." -ForegroundColor Green

# Kiểm tra Vercel CLI
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI chưa được cài đặt" -ForegroundColor Red
    Write-Host "📦 Đang cài đặt Vercel CLI..." -ForegroundColor Yellow
    npm i -g vercel
}

# Đăng nhập (nếu chưa)
Write-Host "🔐 Kiểm tra đăng nhập..." -ForegroundColor Cyan
vercel whoami
if ($LASTEXITCODE -ne 0) {
    vercel login
}

# Deploy
Write-Host "📤 Đang deploy..." -ForegroundColor Cyan
vercel --prod

Write-Host "✅ Hoàn thành!" -ForegroundColor Green


