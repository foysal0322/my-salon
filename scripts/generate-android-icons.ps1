Add-Type -AssemblyName System.Drawing

$sourcePath = (Resolve-Path "public/icons/icon-512x512.png").Path
$source = [System.Drawing.Bitmap]::FromFile($sourcePath)

$bgColor = [System.Drawing.ColorTranslator]::FromHtml("#0F534F")

# 1. Launcher Mipmaps
$sizes = @{
    "android/app/src/main/res/mipmap-mdpi" = 48
    "android/app/src/main/res/mipmap-hdpi" = 72
    "android/app/src/main/res/mipmap-xhdpi" = 96
    "android/app/src/main/res/mipmap-xxhdpi" = 144
    "android/app/src/main/res/mipmap-xxxhdpi" = 192
}

foreach ($entry in $sizes.GetEnumerator()) {
    $targetDir = $entry.Key
    $size = $entry.Value
    
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    $dest = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($dest)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($source, 0, 0, $size, $size)
    $graphics.Dispose()

    $dest.Save((Join-Path $targetDir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Save((Join-Path $targetDir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Save((Join-Path $targetDir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Generated $size x $size icons in $targetDir"
}

# 2. Splash Screen Drawables
$splashSizes = @(
    @{ Dir = "android/app/src/main/res/drawable"; W = 480; H = 800; LogoSize = 160 },
    @{ Dir = "android/app/src/main/res/drawable-port-mdpi"; W = 320; H = 480; LogoSize = 120 },
    @{ Dir = "android/app/src/main/res/drawable-port-hdpi"; W = 480; H = 800; LogoSize = 160 },
    @{ Dir = "android/app/src/main/res/drawable-port-xhdpi"; W = 720; H = 1280; LogoSize = 240 },
    @{ Dir = "android/app/src/main/res/drawable-port-xxhdpi"; W = 960; H = 1600; LogoSize = 320 },
    @{ Dir = "android/app/src/main/res/drawable-port-xxxhdpi"; W = 1280; H = 1920; LogoSize = 400 },
    @{ Dir = "android/app/src/main/res/drawable-land-mdpi"; W = 480; H = 320; LogoSize = 120 },
    @{ Dir = "android/app/src/main/res/drawable-land-hdpi"; W = 800; H = 480; LogoSize = 160 },
    @{ Dir = "android/app/src/main/res/drawable-land-xhdpi"; W = 1280; H = 720; LogoSize = 240 },
    @{ Dir = "android/app/src/main/res/drawable-land-xxhdpi"; W = 1600; H = 960; LogoSize = 320 },
    @{ Dir = "android/app/src/main/res/drawable-land-xxxhdpi"; W = 1920; H = 1280; LogoSize = 400 }
)

foreach ($splash in $splashSizes) {
    $dir = $splash.Dir
    $w = $splash.W
    $h = $splash.H
    $logoSize = $splash.LogoSize

    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $dest = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.Clear($bgColor)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $posX = [int](($w - $logoSize) / 2)
    $posY = [int](($h - $logoSize) / 2)

    $g.DrawImage($source, $posX, $posY, $logoSize, $logoSize)
    $g.Dispose()

    $destPath = Join-Path $dir "splash.png"
    $dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Generated splash $w x $h (logo $logoSize px) in $dir"
}

$source.Dispose()
Write-Host "All icons and splash screens successfully generated!"
