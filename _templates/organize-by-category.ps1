# ============================================
# SQL Tips — Organize Posts by Category
# Creates category folders and moves posts
# Updates all internal links + Firebase redirects
# ============================================

$root = "d:\Apps\sqltips-static"

# Category mapping (from article:section meta tags)
$postCategories = @{
    # SQL (8 posts)
    "difference-between-sql-and-plsql" = "sql"
    "how-to-use-pivot-in-sql-easy-to-follow-examples-and-tips" = "sql"
    "introduction-to-sql-what-it-is-and-why-you-should-learn-it" = "sql"
    "mastering-normalization-in-sql-explained-with-powerful-examples" = "sql"
    "mastering-sql-window-functions-types-and-uses-with-examples" = "sql"
    "sql-query-design-patterns-writing-efficient-queries" = "sql"
    "top-10-common-oracle-errors-and-proven-ways-to-fix-them" = "sql"
    "top-10-sql-window-function-queries" = "sql"

    # PLSQL (4 posts)
    "forward-and-backward-navigation-in-oracle-pl-sql-expert-examples" = "plsql"
    "oracle-database-architecture-the-hidden-engine-of-data-powerhouse" = "plsql"
    "understanding-oracle-triggers-a-comprehensive-guide-with-examples" = "plsql"
    "what-are-the-triggers-in-plsql-how-do-they-work" = "plsql"

    # PostgreSQL (1 post)
    "mastering-postgresql-architecture-6-powerful-steps-to-optimize-performance-scalability" = "postgresql"

    # Interview Questions (10 posts)
    "ace-your-pl-sql-interview-questions-for-success-part-4" = "interview-questions"
    "master-oracle-interview-questions-key-concepts-examples-for-2024" = "interview-questions"
    "mastering-oracle-sql-joins-the-ultimate-guide-to-data-retrieval-and-performance" = "interview-questions"
    "plsql-developer-interview-questions" = "interview-questions"
    "plsql-developer-interview-questions-part-2" = "interview-questions"
    "query-optimization-in-sql-best-practices-and-examples" = "interview-questions"
    "sql-queries-for-interview" = "interview-questions"
    "top-10-essential-plsql-developer-interview-questions-part-3-ace-your-interview" = "interview-questions"
    "tricky-sql-queries-for-interview-preparation" = "interview-questions"
    "what-is-cursor-in-sql-types-examples-benefits" = "interview-questions"
}

# Step 1: Create category folders
$categories = @("sql", "plsql", "postgresql", "interview-questions")
foreach ($cat in $categories) {
    $catPath = Join-Path $root "posts\$cat"
    if (-not (Test-Path $catPath)) {
        New-Item -ItemType Directory -Path $catPath -Force | Out-Null
        Write-Host "CREATED folder: posts/$cat" -ForegroundColor Green
    }
}

# Step 2: Move post folders into category directories
$redirects = @()
foreach ($post in $postCategories.Keys) {
    $srcPath = Join-Path $root $post
    $cat = $postCategories[$post]
    $destPath = Join-Path $root "posts\$cat\$post"

    if (Test-Path $srcPath) {
        if (Test-Path $destPath) {
            Write-Host "SKIP (already moved): $post" -ForegroundColor Yellow
        } else {
            Move-Item -Path $srcPath -Destination $destPath -Force
            Write-Host "MOVED: $post -> posts/$cat/$post" -ForegroundColor Cyan
        }
        # Build redirect entry
        $redirects += @{
            source = "/$post/**"
            destination = "/posts/$cat/$post/index.html"
            type = 301
        }
        $redirects += @{
            source = "/$post"
            destination = "/posts/$cat/$post/index.html"
            type = 301
        }
    } else {
        Write-Host "NOT FOUND: $srcPath" -ForegroundColor Red
    }
}

# Step 3: Update all internal links in ALL HTML files
Write-Host "`nUpdating internal links..." -ForegroundColor Yellow
$allHtmlFiles = Get-ChildItem -Path $root -Filter "*.html" -Recurse -File

$linkCount = 0
foreach ($file in $allHtmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $original = $content

    foreach ($post in $postCategories.Keys) {
        $cat = $postCategories[$post]
        # Update href links: /old-slug/ -> /posts/category/old-slug/
        $content = $content -replace "href=""/$post/""", "href=""/posts/$cat/$post/"""
        $content = $content -replace "href=""/$post""", "href=""/posts/$cat/$post/"""
        # Update canonical/og:url references
        $content = $content -replace "content=""/$post/""", "content=""/posts/$cat/$post/"""
    }

    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $linkCount++
    }
}
Write-Host "Updated links in $linkCount files" -ForegroundColor Green

# Step 4: Update firebase.json with redirects
$firebaseFile = Join-Path $root "firebase.json"
$firebaseConfig = @{
    hosting = @{
        public = "."
        ignore = @("firebase.json", "**/.*", "**/node_modules/**", "_templates/**")
        redirects = $redirects
        headers = @(
            @{
                source = "**/*.html"
                headers = @(
                    @{ key = "Cache-Control"; value = "no-cache" }
                )
            }
            @{
                source = "**/*.css"
                headers = @(
                    @{ key = "Cache-Control"; value = "max-age=604800" }
                )
            }
        )
    }
}
$firebaseConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $firebaseFile -Encoding UTF8
Write-Host "`nUpdated firebase.json with $($redirects.Count) redirects" -ForegroundColor Green

# Step 5: Print final structure
Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "  Final Structure" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
foreach ($cat in $categories) {
    $catPath = Join-Path $root "posts\$cat"
    $posts = Get-ChildItem -Path $catPath -Directory -ErrorAction SilentlyContinue
    Write-Host "`n  posts/$cat/ ($($posts.Count) posts)" -ForegroundColor Yellow
    foreach ($p in $posts) {
        Write-Host "    - $($p.Name)" -ForegroundColor White
    }
}
Write-Host "`n=== Done! ===" -ForegroundColor Green
