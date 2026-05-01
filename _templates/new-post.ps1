# ============================================
# SQL Tips — Create New Blog Post
# Usage: .\new-post.ps1
# ============================================

$root = "d:\Apps\sqltips-static"
$templateFile = "$root\_templates\new-post-template.html"

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  SQL Tips — New Blog Post Creator  " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Get post details
$title = Read-Host "Post Title (e.g., Understanding SQL Indexes)"
$slug = Read-Host "URL Slug (e.g., understanding-sql-indexes)"

Write-Host ""
Write-Host "Categories:" -ForegroundColor Yellow
Write-Host "  1. SQL"
Write-Host "  2. PLSQL"
Write-Host "  3. PostgreSQL"
Write-Host "  4. Interview Questions"
$catChoice = Read-Host "Choose category (1-4)"

switch ($catChoice) {
    "1" { $category = "SQL"; $categorySlug = "sql"; $tag = "sql"; $tagSlug = "sql" }
    "2" { $category = "PLSQL"; $categorySlug = "plsql"; $tag = "plsql"; $tagSlug = "plsql" }
    "3" { $category = "PostgreSQL"; $categorySlug = "postgresql"; $tag = "postgresql"; $tagSlug = "postgresql" }
    "4" { $category = "Interview Questions"; $categorySlug = "interview-questions"; $tag = "interview-questions"; $tagSlug = "interview-questions" }
    default { $category = "SQL"; $categorySlug = "sql"; $tag = "sql"; $tagSlug = "sql" }
}

$metaDesc = Read-Host "Meta Description (150-160 chars)"
$featuredImage = Read-Host "Featured Image path (e.g., 2026/05/my-image.png)"
$readTime = Read-Host "Read Time in minutes (e.g., 5)"

# Auto-generate date
$dateISO = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
$dateDisplay = (Get-Date).ToString("dd/MM/yyyy")

# 2. Create directory inside category folder
$postDir = "$root\posts\$categorySlug\$slug"
if (Test-Path $postDir) {
    Write-Host "ERROR: Directory '$slug' already exists in posts/$categorySlug!" -ForegroundColor Red
    exit 1
}
New-Item -ItemType Directory -Path $postDir -Force | Out-Null

# 3. Copy and fill template
$content = Get-Content -Path $templateFile -Raw -Encoding UTF8

$content = $content -replace '\{\{POST_TITLE\}\}', $title
$content = $content -replace '\{\{POST_SLUG\}\}', $slug
$content = $content -replace '\{\{META_DESCRIPTION\}\}', $metaDesc
$content = $content -replace '\{\{CATEGORY\}\}', $category
$content = $content -replace '\{\{CATEGORY_SLUG\}\}', $categorySlug
$content = $content -replace '\{\{TAG\}\}', $tag
$content = $content -replace '\{\{TAG_SLUG\}\}', $tagSlug
$content = $content -replace '\{\{FEATURED_IMAGE\}\}', $featuredImage
$content = $content -replace '\{\{DATE_ISO\}\}', $dateISO
$content = $content -replace '\{\{DATE_DISPLAY\}\}', $dateDisplay
$content = $content -replace '\{\{READ_TIME\}\}', $readTime
$content = $content -replace '\{\{INTRO_PARAGRAPH\}\}', 'Your introduction paragraph here...'

Set-Content -Path "$postDir\index.html" -Value $content -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "  Post Created Successfully!        " -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Location:  $postDir\index.html" -ForegroundColor White
Write-Host "  Category:  $category" -ForegroundColor White
Write-Host "  URL:       /posts/$categorySlug/$slug/" -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Edit $postDir\index.html — write your content" -ForegroundColor White
Write-Host "  2. Add featured image to /wp-content/uploads/$featuredImage" -ForegroundColor White
Write-Host "  3. Deploy:  firebase deploy" -ForegroundColor White
Write-Host ""
