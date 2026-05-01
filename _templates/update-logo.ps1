# Replace old logo with new one across all HTML files
$root = "d:\Apps\sqltips-static"
$allHtml = Get-ChildItem -Path $root -Filter "*.html" -Recurse -File

$count = 0
foreach ($file in $allHtml) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $original = $content

    # Replace all variations of the old logo path
    $content = $content -replace 'src="/wp-content/uploads/2026/02/cropped-Logo\.png"', 'src="/wp-content/uploads/2026/02/sqltips-logo-new.png"'
    $content = $content -replace 'src="/wp-content/uploads/2026/02/cropped-Logo-150x100\.png"', 'src="/wp-content/uploads/2026/02/sqltips-logo-new.png"'
    $content = $content -replace 'src="https://sqltips\.in/wp-content/uploads/2026/02/cropped-Logo\.png"', 'src="/wp-content/uploads/2026/02/sqltips-logo-new.png"'
    $content = $content -replace 'src="https://sqltips\.in/wp-content/uploads/2026/02/cropped-Logo-150x100\.png"', 'src="/wp-content/uploads/2026/02/sqltips-logo-new.png"'

    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $count++
        Write-Host "UPDATED: $($file.FullName)"
    }
}

Write-Host "`n=== Logo updated in $count files ==="
