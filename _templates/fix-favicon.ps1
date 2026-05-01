# Replace PNG favicon links with SVG favicon across all HTML files
$root = "d:\Apps\sqltips-static"
$allHtml = Get-ChildItem -Path $root -Filter "*.html" -Recurse -File

$count = 0
foreach ($file in $allHtml) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $original = $content

    # Remove old PNG favicon links
    $content = $content -replace '<link rel="icon" href="/wp-content/uploads/2024/09/cropped-new-fev-32x32\.png" sizes="32x32">', '<link rel="icon" type="image/svg+xml" href="/favicon.svg">'
    $content = $content -replace '<link rel="icon" href="/wp-content/uploads/2024/09/cropped-new-fev-192x192\.png" sizes="192x192">', ''
    $content = $content -replace '<link rel="apple-touch-icon" href="/wp-content/uploads/2024/09/cropped-new-fev-180x180\.png">', '<link rel="apple-touch-icon" href="/favicon.svg">'
    $content = $content -replace '<meta name="msapplication-TileImage" content="/wp-content/uploads/2024/09/cropped-new-fev-270x270\.png">', ''

    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $count++
    }
}

Write-Host "SVG favicon applied to $count files"
