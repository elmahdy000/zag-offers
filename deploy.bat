@echo off
echo ========================================
echo Zag Offers Deploy Script
echo ========================================
echo.

echo Connecting to server and deploying...
echo.

ssh root@72.62.27.196 "cd /var/www/zag-offers && bash deploy.sh"

echo.
echo ========================================
echo Deployment completed!
echo ========================================
pause
