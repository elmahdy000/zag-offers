#!/bin/bash

# Zag Offers Deploy Script
# استخدم هذا السكريبت لتحديث التطبيقات على السيرفر

set -e

echo "🚀 Starting Zag Offers deployment..."

# الانتقال للمجلد الرئيسي
cd /var/www/zag-offers

# سحب آخر التحديثات
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# تحديث و بناء Backend
echo "🔧 Building Backend..."
cd zag-offers-backend
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run build
NODE_ENV=production npx prisma db seed
pm2 restart zag-backend || pm2 start dist/src/main.js --name zag-backend
echo "✅ Backend deployed and seeded successfully"

# تحديث و بناء Client
echo "🎨 Building Client..."
cd ../zag-offers-client
npm install --legacy-peer-deps
npm run build
pm2 restart zag-client || pm2 start node_modules/next/dist/bin/next --name "zag-client" -- start -p 3000
echo "✅ Client deployed successfully"

# تحديث و بناء Vendor
echo "🏪 Building Vendor..."
cd ../zag-offers-vendor
npm install
npm run build
pm2 restart zag-vendor || pm2 start node_modules/next/dist/bin/next --name "zag-vendor" -- start -p 3002
echo "✅ Vendor deployed successfully"

# تحديث و بناء Admin
echo "👨‍💼 Building Admin..."
cd ../zag-offers-admin
npm install
npm run build
pm2 restart zag-admin || pm2 start node_modules/next/dist/bin/next --name "zag-admin" -- start -p 3003
echo "✅ Admin deployed successfully"

# حفظ حالة PM2
echo "💾 Saving PM2 state..."
pm2 save

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
pm2 list
