# Fix homepage links that were missed due to file lock
$root = "d:\Apps\sqltips-static"
$postCategories = @{
    "difference-between-sql-and-plsql" = "sql"
    "how-to-use-pivot-in-sql-easy-to-follow-examples-and-tips" = "sql"
    "introduction-to-sql-what-it-is-and-why-you-should-learn-it" = "sql"
    "mastering-normalization-in-sql-explained-with-powerful-examples" = "sql"
    "mastering-sql-window-functions-types-and-uses-with-examples" = "sql"
    "sql-query-design-patterns-writing-efficient-queries" = "sql"
    "top-10-common-oracle-errors-and-proven-ways-to-fix-them" = "sql"
    "top-10-sql-window-function-queries" = "sql"
    "forward-and-backward-navigation-in-oracle-pl-sql-expert-examples" = "plsql"
    "oracle-database-architecture-the-hidden-engine-of-data-powerhouse" = "plsql"
    "understanding-oracle-triggers-a-comprehensive-guide-with-examples" = "plsql"
    "what-are-the-triggers-in-plsql-how-do-they-work" = "plsql"
    "mastering-postgresql-architecture-6-powerful-steps-to-optimize-performance-scalability" = "postgresql"
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

$content = Get-Content -Path "$root\index.html" -Raw -Encoding UTF8
foreach ($post in $postCategories.Keys) {
    $cat = $postCategories[$post]
    $content = $content -replace "href=""/$post/""", "href=""/posts/$cat/$post/"""
    $content = $content -replace "href=""/$post""", "href=""/posts/$cat/$post/"""
}
Set-Content -Path "$root\index.html" -Value $content -Encoding UTF8 -NoNewline
Write-Host "Homepage links updated!"
