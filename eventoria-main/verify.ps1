# Eventoria - Quick Verification Script
# Run this to verify all checks pass before submission

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Eventoria - Pre-Submission Checks" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$StartTime = Get-Date

# Check 1: Node.js Version
Write-Host "1 Checking Node.js version..." -ForegroundColor Yellow
$NodeCheck = Get-Command node -ErrorAction SilentlyContinue
if ($NodeCheck) {
    $NodeVersion = node --version
    Write-Host "   OK Node.js $NodeVersion detected" -ForegroundColor Green
} else {
    Write-Host "   FAIL Node.js not found!" -ForegroundColor Red
    $ErrorCount++
}
Write-Host ""

# Check 2: Dependencies
Write-Host "2 Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "   OK package.json found" -ForegroundColor Green
} else {
    Write-Host "   FAIL package.json not found!" -ForegroundColor Red
    $ErrorCount++
}
Write-Host ""

# Check 3: Environment Variables
Write-Host "3 Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "   OK .env.local found" -ForegroundColor Green
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "GEMINI_API_KEY") {
        Write-Host "   OK GEMINI_API_KEY configured" -ForegroundColor Green
    } else {
        Write-Host "   WARN GEMINI_API_KEY not set (will use fallback)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   WARN .env.local not found (optional for testing)" -ForegroundColor Yellow
}
Write-Host ""

# Check 4: Critical Files
Write-Host "4 Verifying critical code fixes..." -ForegroundColor Yellow

# Cache hash function
if (Test-Path "lib/cache.ts") {
    $content = Get-Content "lib/cache.ts" -Raw
    if ($content -match "simpleHash") {
        Write-Host "   OK Cache key hashing in lib/cache.ts" -ForegroundColor Green
    } else {
        Write-Host "   FAIL Missing cache key hashing" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "   FAIL File not found: lib/cache.ts" -ForegroundColor Red
    $ErrorCount++
}

# IP validation
if (Test-Path "lib/rate-limiter.ts") {
    $content = Get-Content "lib/rate-limiter.ts" -Raw
    if ($content -match "isValidIpFormat") {
        Write-Host "   OK IP validation in lib/rate-limiter.ts" -ForegroundColor Green
    } else {
        Write-Host "   FAIL Missing IP validation" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "   FAIL File not found: lib/rate-limiter.ts" -ForegroundColor Red
    $ErrorCount++
}

# CSP conditional
if (Test-Path "next.config.ts") {
    $content = Get-Content "next.config.ts" -Raw
    if ($content -match "NODE_ENV") {
        Write-Host "   OK CSP conditional in next.config.ts" -ForegroundColor Green
    } else {
        Write-Host "   FAIL Missing CSP conditional" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "   FAIL File not found: next.config.ts" -ForegroundColor Red
    $ErrorCount++
}

# Cache includes date
if (Test-Path "app/api/plan/route.ts") {
    $content = Get-Content "app/api/plan/route.ts" -Raw
    if ($content -match "date: planRequest.date") {
        Write-Host "   OK Cache includes date in app/api/plan/route.ts" -ForegroundColor Green
    } else {
        Write-Host "   FAIL Cache missing date field" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "   FAIL File not found: app/api/plan/route.ts" -ForegroundColor Red
    $ErrorCount++
}

Write-Host ""

# Check 5: Core Documentation Files
Write-Host "5 Verifying core documentation..." -ForegroundColor Yellow

$docFiles = @(
    "README.md",
    "ACCESSIBILITY.md",
    "CHANGELOG.md",
    "AGENTS.md"
)

foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        $size = (Get-Item $doc).Length
        $sizeKB = [math]::Round($size/1KB, 1)
        Write-Host "   OK $doc ($sizeKB KB)" -ForegroundColor Green
    } else {
        Write-Host "   FAIL Missing: $doc" -ForegroundColor Red
        $ErrorCount++
    }
}
Write-Host ""

# Check 6: Security Headers
Write-Host "6 Verifying security configuration..." -ForegroundColor Yellow
$nextConfig = Get-Content "next.config.ts" -Raw

if ($nextConfig -match "Strict-Transport-Security") {
    Write-Host "   OK HSTS configured" -ForegroundColor Green
} else {
    Write-Host "   FAIL Missing HSTS" -ForegroundColor Red
    $ErrorCount++
}

if ($nextConfig -match "X-Frame-Options") {
    Write-Host "   OK Clickjacking protection configured" -ForegroundColor Green
} else {
    Write-Host "   FAIL Missing X-Frame-Options" -ForegroundColor Red
    $ErrorCount++
}

if ($nextConfig -match "Content-Security-Policy") {
    Write-Host "   OK CSP configured" -ForegroundColor Green
} else {
    Write-Host "   FAIL Missing CSP" -ForegroundColor Red
    $ErrorCount++
}

if ($nextConfig -match "X-Content-Type-Options") {
    Write-Host "   OK MIME sniffing protection configured" -ForegroundColor Green
} else {
    Write-Host "   FAIL Missing X-Content-Type-Options" -ForegroundColor Red
    $ErrorCount++
}
Write-Host ""

# Check 7: Test Files
Write-Host "7 Checking test coverage..." -ForegroundColor Yellow
$testFiles = Get-ChildItem -Path "__tests__" -Filter "*.test.ts" -Recurse -ErrorAction SilentlyContinue

if ($testFiles) {
    $testCount = $testFiles.Count
    Write-Host "   OK $testCount test files found" -ForegroundColor Green
} else {
    Write-Host "   WARN No test files found in __tests__/" -ForegroundColor Yellow
}
Write-Host ""

# Summary
$Duration = ((Get-Date) - $StartTime).TotalSeconds
$DurationRounded = [math]::Round($Duration, 1)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verification Complete" -ForegroundColor Cyan
Write-Host "  Duration: $DurationRounded seconds" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($ErrorCount -eq 0) {
    Write-Host "ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your application is ready for submission:" -ForegroundColor White
    Write-Host "  1. All code fixes verified OK" -ForegroundColor Green
    Write-Host "  2. Documentation complete OK" -ForegroundColor Green
    Write-Host "  3. Security configured OK" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  - Deploy to Vercel and update the Live Demo URL in README.md" -ForegroundColor White
    Write-Host "  - Run npm test to verify all unit tests pass" -ForegroundColor White
    Write-Host "  - Optional: Record 2-3 minute demo video" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "$ErrorCount CHECK(S) FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the issues above before submission." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
