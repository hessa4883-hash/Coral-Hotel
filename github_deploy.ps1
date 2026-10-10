# ========================================================
# سكربت الرفع التلقائي إلى GitHub وتفعيل الرابط المباشر
# فندق كورال السودان (Coral Hotel Sudan)
# ========================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🚀 مرحباً بك في معالج رفع فندق كورال إلى موقع GitHub" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

# 1. التأكد من حفظ التغييرات محلياً في Git
& "C:\Program Files\Git\cmd\git.exe" branch -M main
& "C:\Program Files\Git\cmd\git.exe" add .
& "C:\Program Files\Git\cmd\git.exe" commit -m "Update Coral Hotel Sudan Project" -q

# 2. فحص تسجيل الدخول عبر GitHub CLI
$ghCliPath = "C:\Program Files\GitHub CLI\gh.exe"
$isLoggedIn = $false

if (Test-Path $ghCliPath) {
    try {
        $status = & $ghCliPath auth status 2>&1
        if ($LASTEXITCODE -eq 0) {
            $isLoggedIn = $true
        }
    } catch {}
}

if ($isLoggedIn) {
    Write-Host "✅ تم التعرف على حساب GitHub الخاص بك!" -ForegroundColor Green
    $repoName = "coral-hotel-sudan"
    Write-Host "📦 جاري إنشاء المستودع $repoName على حسابك ورفع الملفات..." -ForegroundColor Cyan
    & $ghCliPath repo create $repoName --public --source=. --remote=origin --push
    Write-Host "🎉 تم الرفع بنجاح إلى GitHub!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ℹ️ لرفع المشروع إلى حسابك الشخصي على GitHub:" -ForegroundColor Yellow
    Write-Host "1. قم بإنشاء مستودع جديد فارغ على github.com باسم: coral-hotel" -ForegroundColor White
    Write-Host "2. انسخ رابط المستودع (مثال: https://github.com/USERNAME/coral-hotel.git)" -ForegroundColor White
    Write-Host ""
    
    $repoUrl = Read-Host "أدخل رابط مستودع GitHub الخاص بك هنا"
    
    if (-not [string]::IsNullOrWhiteSpace($repoUrl)) {
        & "C:\Program Files\Git\cmd\git.exe" remote remove origin 2>$null
        & "C:\Program Files\Git\cmd\git.exe" remote add origin $repoUrl
        Write-Host "جاري رفع الملفات إلى المستودع..." -ForegroundColor Cyan
        & "C:\Program Files\Git\cmd\git.exe" push -u origin main --force
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🎉 تم الرفع بنجاح إلى GitHub!" -ForegroundColor Green
            Write-Host "لتشغيل الرابط المباشر (GitHub Pages):" -ForegroundColor Yellow
            Write-Host "اذهب إلى إعدادات المستودع (Settings) > Pages > اختر الفرع 'main' > اضغط Save." -ForegroundColor Cyan
        } else {
            Write-Host "⚠️ حدث خطأ أثناء الرفع، تأكد من صحة الرابط وبيانات تسجيل الدخول." -ForegroundColor Red
        }
    }
}
