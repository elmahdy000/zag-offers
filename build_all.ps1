Write-Host "Building zag_offers_app..."
Set-Location "d:\offers\zag_offers_app"
flutter build apk
if ($LASTEXITCODE -ne 0) { throw "Build failed for zag_offers_app" }

Write-Host "Building zag_offers_vendor_app..."
Set-Location "d:\offers\zag_offers_vendor_app"
flutter build apk
if ($LASTEXITCODE -ne 0) { throw "Build failed for zag_offers_vendor_app" }

Write-Host "Building zag_offers_admin_app..."
Set-Location "d:\offers\zag_offers_admin_app"
flutter build apk
if ($LASTEXITCODE -ne 0) { throw "Build failed for zag_offers_admin_app" }

Write-Host "All apps built successfully!"
