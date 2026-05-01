# ============================================
# SQL Tips — Inject Redesign CSS + Fix Bugs
# Run from: d:\Apps\sqltips-static
# ============================================

$root = "d:\Apps\sqltips-static"
$cssLink = '<link rel="stylesheet" id="sqltips-redesign-css" href="/sqltips-redesign.css" media="all">'

# Find all index.html files recursively
$htmlFiles = Get-ChildItem -Path $root -Filter "index.html" -Recurse -File
# Also include 404.html
$htmlFiles += Get-Item "$root\404.html" -ErrorAction SilentlyContinue

$count = 0
foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Skip if already injected
    if ($content -match "sqltips-redesign-css") {
        Write-Host "SKIP (already injected): $($file.FullName)"
        continue
    }
    
    # 1. Inject CSS link before </head>
    $content = $content -replace '</head>', "$cssLink`n</head>"
    
    # 2. FIX BUG: meta description "Previous" on homepage only
    if ($file.FullName -eq "$root\index.html") {
        $content = $content -replace '<meta name="description" content="Previous">', '<meta name="description" content="SQL Tips - Learn SQL, PL/SQL, and PostgreSQL with practical tutorials, interview questions, and expert examples. Master database skills.">'
        $content = $content -replace '<meta property="og:description" content="Previous">', '<meta property="og:description" content="SQL Tips - Learn SQL, PL/SQL, and PostgreSQL with practical tutorials, interview questions, and expert examples.">'
        $content = $content -replace '<meta name="twitter:description" content="Previous">', '<meta name="twitter:description" content="SQL Tips - Learn SQL, PL/SQL, and PostgreSQL with practical tutorials, interview questions, and expert examples.">'
    }
    
    # 3. FIX BUG: "Archieves" typo
    $content = $content -replace 'Archieves', 'Archives'
    
    # 4. FIX BUG: negative margin on widgets
    $content = $content -replace 'margin-bottom:-3\.5rem;', 'margin-bottom:1.25rem;'
    
    # 5. FIX BUG: orphaned CSS closing brace - wrap in proper media query
    $content = $content -replace '(?s)/\* Adjust image size to fit mobile screens \*/\s*img \{[^}]+\}\s*\n\s*\n\s*/\* Ensure navigation is mobile-friendly \*/\s*\.navigation-menu \{[^}]+\}\s*\n\s*/\* Remove horizontal scroll on mobile \*/\s*body \{[^}]+\}\s*\}', '@media only screen and (max-width: 768px) {
    img { max-width: 100%; height: auto; }
    .navigation-menu { display: flex; flex-direction: column; }
    body { overflow-x: hidden; }
}'
    
    # 6. FIX: Bottom menu hover color red -> teal
    $content = $content -replace '--wpbottommenu-h-icon-color:\s*#e81700;', '--wpbottommenu-h-icon-color: #00c9a7;'
    
    # 7. Add hero section to homepage only (before Trending heading)
    if ($file.FullName -eq "$root\index.html") {
        $heroHTML = @'
<div class="sqltips-hero">
<h1>Master SQL. <span class="hero-accent">Ace Interviews.</span> Build Databases.</h1>
<p>Your go-to resource for SQL, PL/SQL &amp; PostgreSQL tutorials, tips, and interview prep.</p>
<div class="sqltips-hero-buttons">
<a href="/sql-2/" class="sqltips-hero-btn primary">Browse SQL</a>
<a href="/interview-questions/" class="sqltips-hero-btn secondary">Interview Prep</a>
</div>
</div>

'@
        # Insert hero before the trending heading
        $content = $content -replace '(<h3 class="wp-block-heading uag-hide-mob"><strong>Trending</strong>)', "$heroHTML`$1"
    }
    
    # 8. Add custom footer before the old site-info footer on ALL pages
    $footerHTML = @'
<div class="sqltips-footer-custom">
<div class="sqltips-footer-grid">
<div class="sqltips-footer-col">
<h4>About SQL Tips</h4>
<p>SQL Tips is your go-to resource for learning SQL, PL/SQL, PostgreSQL, and Oracle database concepts. We publish practical tutorials, interview questions, and expert examples to help you master databases.</p>
</div>
<div class="sqltips-footer-col">
<h4>Quick Links</h4>
<ul>
<li><a href="/sql-2/">SQL Tutorials</a></li>
<li><a href="/plsql-2/">PL/SQL Guides</a></li>
<li><a href="/postgresql/">PostgreSQL</a></li>
<li><a href="/interview-questions/">Interview Questions</a></li>
<li><a href="/contact-us/">Contact Us</a></li>
</ul>
</div>
<div class="sqltips-footer-col">
<h4>Popular Posts</h4>
<ul>
<li><a href="/mastering-oracle-sql-joins-the-ultimate-guide-to-data-retrieval-and-performance/">Oracle SQL Joins Guide</a></li>
<li><a href="/mastering-sql-window-functions-types-and-uses-with-examples/">SQL Window Functions</a></li>
<li><a href="/query-optimization-in-sql-best-practices-and-examples/">Query Optimization Tips</a></li>
<li><a href="/what-is-cursor-in-sql-types-examples-benefits/">SQL Cursors Explained</a></li>
</ul>
</div>
</div>
<div class="sqltips-footer-bottom">&copy; 2026 SQL Tips &bull; All Rights Reserved</div>
</div>
'@
        # Only add if not already present
        if ($content -notmatch 'sqltips-footer-custom') {
            $content = $content -replace '(<footer class="site-info")', "$footerHTML`n`$1"
        }
    
    # Save
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    $count++
    Write-Host "UPDATED: $($file.FullName)"
}

Write-Host "`n=== Done! Updated $count files ==="
