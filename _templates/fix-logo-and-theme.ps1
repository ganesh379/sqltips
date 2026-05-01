# Fix Logo: Replace img logo with inline SVG logo
# Fix Theme: Override dark GeneratePress vars in inline CSS
$root = "d:\Apps\sqltips-static"
$allHtml = Get-ChildItem -Path $root -Filter "*.html" -Recurse -File

# New SVG logo - teal database with SQL Tips text
$svgLogo = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 60" width="200" height="44" class="sqltips-svg-logo"><defs><linearGradient id="tealGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#00e5bf"/><stop offset="100%" style="stop-color:#00a88a"/></linearGradient></defs><ellipse cx="30" cy="12" rx="18" ry="7" fill="url(#tealGrad)" opacity="0.9"/><path d="M12 12v8c0 3.9 8 7 18 7s18-3.1 18-7v-8" fill="none" stroke="url(#tealGrad)" stroke-width="2.5"/><ellipse cx="30" cy="20" rx="18" ry="7" fill="none" stroke="url(#tealGrad)" stroke-width="0.5" opacity="0.4"/><path d="M12 20v8c0 3.9 8 7 18 7s18-3.1 18-7v-8" fill="none" stroke="url(#tealGrad)" stroke-width="2.5"/><ellipse cx="30" cy="28" rx="18" ry="7" fill="none" stroke="url(#tealGrad)" stroke-width="0.5" opacity="0.4"/><path d="M12 28v8c0 3.9 8 7 18 7s18-3.1 18-7v-8" fill="none" stroke="url(#tealGrad)" stroke-width="2.5"/><ellipse cx="30" cy="36" rx="18" ry="7" fill="none" stroke="url(#tealGrad)" stroke-width="0.5" opacity="0.3"/><text x="68" y="25" font-family="Inter,Poppins,Arial,sans-serif" font-size="22" font-weight="800" fill="#ffffff" letter-spacing="-0.5">SQL</text><text x="68" y="46" font-family="Inter,Poppins,Arial,sans-serif" font-size="18" font-weight="500" fill="#00c9a7" letter-spacing="3">TIPS</text></svg>
'@

$count = 0
foreach ($file in $allHtml) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $original = $content

    # Replace the img-based logo with SVG logo
    # Pattern: <a href="/" rel="home"><img class="header-image is-logo-image" ... ></a>
    $content = $content -replace '<a href="/" rel="home">\s*<img class="header-image is-logo-image"[^>]*>\s*</a>', "<a href=""/"" rel=""home"">$svgLogo</a>"

    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $count++
        Write-Host "UPDATED: $($file.FullName)"
    }
}

Write-Host "`n=== SVG logo applied to $count files ==="
