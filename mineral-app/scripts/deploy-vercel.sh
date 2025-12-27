#!/bin/bash

# Script để deploy lên Vercel
# Sử dụng: bash scripts/deploy-vercel.sh

echo "🚀 Bắt đầu deploy lên Vercel..."

# Kiểm tra Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI chưa được cài đặt"
    echo "📦 Đang cài đặt Vercel CLI..."
    npm i -g vercel
fi

# Đăng nhập (nếu chưa)
echo "🔐 Kiểm tra đăng nhập..."
vercel whoami || vercel login

# Deploy
echo "📤 Đang deploy..."
vercel --prod

echo "✅ Hoàn thành!"


