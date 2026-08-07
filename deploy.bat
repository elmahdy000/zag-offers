@echo off
echo ========================================
echo Zag Offers Deploy Script
echo ========================================
echo.

echo Connecting to server and deploying...
echo.

ssh root@72.62.27.196 "cd /var/www/zag-offers && git pull --ff-only origin main && cd zag-offers-backend && npm install && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 restart zag-backend && cd ../zag-offers-client && npm install --legacy-peer-deps && npm run build && pm2 restart zag-client && cd ../zag-offers-vendor && npm install && npm run build && pm2 restart zag-vendor && cd ../zag-offers-admin && npm install && npm run build && pm2 restart zag-admin && pm2 save"

echo.
echo ========================================
echo Deployment completed!
echo ========================================
pause
