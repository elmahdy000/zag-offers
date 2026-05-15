@echo off
echo ========================================
echo Zag Offers Deploy Script
echo ========================================
echo.

echo Connecting to server and deploying...
echo.

ssh root@72.62.27.196 "cd /var/www/zag-offers/zag-offers-frontend && npm install && npm run build && cd ../zag-offers-backend && npm install && npx prisma generate && npx prisma db push && npm run build && cd .. && pm2 restart zag-client && pm2 restart zag-vendor && pm2 restart zag-admin"

echo.
echo ========================================
echo Deployment completed!
echo ========================================
pause
