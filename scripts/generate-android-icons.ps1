Add-Type -AssemblyName System.Drawing

$sourcePath = (Resolve-Path "public/icons/icon-512x512.png").Path
$source = [System.Drawing.Bitmap]::FromFile($sourcePath)

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

$source.Dispose()
