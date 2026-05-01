# SQL Tips — How to Create & Deploy a New Blog Post

## Quick Start (3 Steps)

### Step 1: Create the Post
Open PowerShell and run:
```powershell
cd d:\Apps\sqltips-static
powershell -ExecutionPolicy Bypass -File "_templates\new-post.ps1"
```
It will ask you:
- **Post Title** → e.g., "Understanding SQL Indexes"
- **URL Slug** → e.g., "understanding-sql-indexes"
- **Category** → Choose 1-4 (SQL / PLSQL / PostgreSQL / Interview Questions)
- **Meta Description** → 150-160 chars for SEO
- **Featured Image** → path under wp-content/uploads/ (e.g., "2026/05/sql-indexes.png")
- **Read Time** → e.g., "5"

This creates: `d:\Apps\sqltips-static\understanding-sql-indexes\index.html`

### Step 2: Write Your Content
Open the created `index.html` and edit the content section between these markers:
```html
<!-- WRITE YOUR BLOG POST CONTENT BELOW THIS LINE -->
...your content here...
<!-- END OF BLOG POST CONTENT -->
```

Available HTML blocks you can use:

**Paragraph:**
```html
<p>Your text here...</p>
```

**Heading (H2 for sections, H3 for sub-sections):**
```html
<h2 class="wp-block-heading">Section Title</h2>
<h3 class="wp-block-heading">Sub-section Title</h3>
```

**SQL Code Block:**
```html
<pre class="wp-block-code"><code>SELECT * FROM employees
WHERE department_id = 10;</code></pre>
```

**Table:**
```html
<figure class="wp-block-table">
<table>
<thead><tr><th>Column 1</th><th>Column 2</th></tr></thead>
<tbody>
<tr><td>Data</td><td>Data</td></tr>
</tbody>
</table>
</figure>
```

**Image:**
```html
<figure class="wp-block-image size-large">
<img src="/wp-content/uploads/2026/05/your-image.png" alt="Description">
</figure>
```

**Bullet List:**
```html
<ul class="wp-block-list">
<li>Point 1</li>
<li>Point 2</li>
</ul>
```

**Bold/Inline Code:**
```html
<p>Use <strong>bold</strong> and <code>inline code</code> like this.</p>
```

### Step 3: Deploy to Firebase
```powershell
cd d:\Apps\sqltips-static
firebase deploy
```

That's it! Your post is live.

---

## File Organization

Posts are stored as folders at the root level:
```
d:\Apps\sqltips-static\
├── understanding-sql-indexes\        ← NEW POST
│   └── index.html
├── mastering-oracle-sql-joins-...\   ← Existing post
│   └── index.html
├── sql-2\                            ← SQL category page
│   └── index.html
├── plsql-2\                          ← PLSQL category page
│   └── index.html
├── postgresql\                       ← PostgreSQL category page
│   └── index.html
├── interview-questions\              ← Interview category page
│   └── index.html
├── sqltips-redesign.css              ← Global styles (shared)
├── _templates\                       ← Templates & scripts
│   ├── new-post-template.html
│   ├── new-post.ps1
│   └── inject-redesign.ps1
└── wp-content\uploads\               ← Images go here
```

## Adding Featured Images

1. Create your image (recommended: **1200x628px**, PNG or WebP)
2. Save it to: `d:\Apps\sqltips-static\wp-content\uploads\2026\05\` (year/month)
3. Reference it in the script as: `2026/05/your-image.png`

## Checklist Before Publishing

- [ ] Title includes main keyword
- [ ] Meta description is 150-160 characters
- [ ] Featured image is 1200x628px and compressed
- [ ] Content has proper H2/H3 heading hierarchy
- [ ] All code blocks use `<pre class="wp-block-code"><code>...</code></pre>`
- [ ] Internal links to 2-3 related posts
- [ ] Alt text on all images
- [ ] URL slug is clean and readable
- [ ] Tested locally: `cmd /c "npx -y serve -l 3456 -s ."`
