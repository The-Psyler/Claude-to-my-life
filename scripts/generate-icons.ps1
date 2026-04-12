Add-Type -AssemblyName System.Drawing

function New-Icon($size, $fontSize, $path) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $g.Clear([System.Drawing.Color]::FromArgb(83, 74, 183))

    $font = New-Object System.Drawing.Font('Segoe UI', $fontSize, [System.Drawing.FontStyle]::Bold)
    $brush = [System.Drawing.Brushes]::White
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)

    $g.DrawString('CTML', $font, $brush, $rect, $sf)
    $g.Dispose()
    $font.Dispose()

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $path ($size x $size)"
}

$iconsDir = Join-Path (Join-Path (Join-Path $PSScriptRoot '..') 'static') 'icons'
New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

New-Icon -size 192 -fontSize 42 -path (Join-Path $iconsDir 'icon-192.png')
New-Icon -size 512 -fontSize 110 -path (Join-Path $iconsDir 'icon-512.png')

Write-Host 'Done.'
