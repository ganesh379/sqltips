#!/usr/bin/env python3
"""
SQL Tips — SEO normaliser
=========================

The site is a static export of a WordPress install. The exporter rewrites
every absolute URL to a root-relative one ("/foo/"), which quietly breaks
three things that matter for search and sharing:

  1. Sitemaps      <loc> MUST be absolute per the sitemaps.org protocol.
                   Relative values make the whole sitemap invalid, so Google
                   discovers nothing from it.
  2. Open Graph    og:url / og:image MUST be absolute. Relative values mean
                   no preview image on WhatsApp, LinkedIn, X or Facebook.
  3. JSON-LD       @id / url values should be absolute so entities resolve
                   and rich results can be attributed to the site.

It also fixes a second problem: post URLs in the sitemap still point at the
pre-restructure paths ("/slug/"), which now 301-redirect to
"/posts/<category>/<slug>/". A sitemap should list final canonical URLs,
never redirects.

The script is IDEMPOTENT — running it twice changes nothing the second time,
so it is safe to re-run after every fresh WordPress export.

Usage:
    python _tools/seo_fix.py --check     # report only, change nothing
    python _tools/seo_fix.py             # apply fixes
"""

import argparse
import io
import json
import os
import re
import sys
from datetime import datetime, timezone

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

SITE = "https://sqltips.in"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Directories that hold vendored WordPress assets or tooling — never rewritten.
SKIP_DIRS = {".git", "wp-content", "wp-includes", "_tools", "node_modules"}

# Attributes whose value must be an absolute URL for crawlers/scrapers.
ABSOLUTE_META = [
    ('<link rel="canonical" href="', '"'),
    ('<meta property="og:url" content="', '"'),
    ('<meta property="og:image" content="', '"'),
    ('<meta property="og:image:secure_url" content="', '"'),
    ('<meta name="twitter:image" content="', '"'),
]


def is_relative(url):
    """True for root-relative paths we should absolutise."""
    if not url:
        return False
    if url.startswith("//"):          # protocol-relative — leave alone
        return False
    return url.startswith("/")


def absolutise(url):
    return SITE + url if is_relative(url) else url


# --------------------------------------------------------------------------
# HTML
# --------------------------------------------------------------------------

def iter_html_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if name.endswith(".html"):
                yield os.path.join(dirpath, name)


def url_for(path):
    """Canonical site URL for a file on disk."""
    rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def fix_meta(text):
    """Absolutise canonical / og / twitter URL attributes."""
    changes = 0
    for prefix, terminator in ABSOLUTE_META:
        out = []
        pos = 0
        while True:
            start = text.find(prefix, pos)
            if start == -1:
                out.append(text[pos:])
                break
            value_start = start + len(prefix)
            value_end = text.find(terminator, value_start)
            if value_end == -1:
                out.append(text[pos:])
                break
            value = text[value_start:value_end]
            out.append(text[pos:value_start])
            if is_relative(value):
                out.append(absolutise(value))
                changes += 1
            else:
                out.append(value)
            pos = value_end
        text = "".join(out)
    return text, changes


JSONLD_RE = re.compile(
    r'(<script[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)',
    re.DOTALL | re.IGNORECASE,
)


def _unescape(s):
    return (
        s.replace("&quot;", '"')
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
    )


def repair_json(raw):
    """Escape stray double quotes inside JSON-LD string values.

    Rank Math interpolates post excerpts into the schema without escaping, so
    a sentence like:  Ever wondered what happens when you hit "Execute"?
    produces structurally invalid JSON and Google discards the ENTIRE block —
    the page loses every rich-result signal it had.

    Walks the text tracking string state. A quote encountered inside a string
    is a real terminator only if the next non-space character is one of
    , : } ]  — otherwise it is literal content and gets escaped.

    Returns the repaired text, or None when nothing needed repairing.
    """
    try:
        json.loads(raw)
        return None                     # already valid, leave it untouched
    except ValueError:
        pass

    out = []
    in_string = False
    escaped = False
    changed = False

    for i, ch in enumerate(raw):
        if escaped:
            out.append(ch)
            escaped = False
            continue
        if ch == "\\":
            out.append(ch)
            escaped = True
            continue

        if ch == '"':
            if not in_string:
                in_string = True
                out.append(ch)
                continue
            # inside a string: is this a genuine terminator?
            j = i + 1
            while j < len(raw) and raw[j] in " \t\r\n":
                j += 1
            if j < len(raw) and raw[j] in ",:}]":
                in_string = False
                out.append(ch)
            else:
                out.append('\\"')       # literal quote in the content
                changed = True
            continue

        out.append(ch)

    repaired = "".join(out)
    if not changed:
        return None
    try:
        json.loads(repaired)
    except ValueError:
        return None                     # could not fix it safely — leave as-is
    return repaired


def fix_jsonld(text, page_url):
    """Absolutise @id / url / contentUrl inside JSON-LD blocks.

    Operates on the raw JSON text rather than parsing, because these blocks
    are HTML-escaped by the exporter and a parse/re-dump round trip would
    change escaping in ways that are hard to verify.
    """
    counter = {"n": 0, "repaired": 0}

    # Keys whose values are URLs or entity identifiers.
    URL_KEYS = {
        "@id", "url", "contentUrl", "logo", "image",
        "sameAs", "item", "mainEntityOfPage", "thumbnailUrl",
    }

    ENTITIES = [
        ("&quot;", '"'),
        ("&#039;", "'"),
        ("&#39;", "'"),
        ("&apos;", "'"),
        ("&lt;", "<"),
        ("&gt;", ">"),
        ("&nbsp;", " "),
        ("&amp;", "&"),          # must be last so it cannot double-decode
    ]

    def decode_entities(s):
        for entity, char in ENTITIES:
            s = s.replace(entity, char)
        return s

    def transform(node, parent_key=None):
        """Recursively absolutise URLs and decode HTML entities."""
        if isinstance(node, dict):
            return {k: transform(v, k) for k, v in node.items()}
        if isinstance(node, list):
            return [transform(v, parent_key) for v in node]
        if isinstance(node, str):
            value = decode_entities(node)
            if parent_key in URL_KEYS:
                if value == "":
                    value = SITE + "/"
                elif value.startswith("#"):
                    value = SITE + "/" + value
                elif is_relative(value):
                    value = SITE + value
            if value != node:
                counter["n"] += 1
            return value
        return node

    def fix_block(match):
        body = match.group(2).strip()

        # Parse the RAW text: <script> content is never entity-decoded by the
        # HTML parser, so "&quot;" is literal characters inside the string.
        try:
            data = json.loads(body)
        except ValueError:
            # Structurally invalid (Rank Math interpolating an unescaped
            # quote). Try to repair, then parse again.
            repaired = repair_json(body)
            if repaired is None:
                return match.group(0)          # leave untouched, never corrupt
            counter["repaired"] += 1
            data = json.loads(repaired)

        fixed = transform(data)
        # separators keep it compact; ensure_ascii=False preserves real unicode
        dumped = json.dumps(fixed, ensure_ascii=False, separators=(",", ":"))
        # "</script>" inside a JSON string would terminate the block early
        dumped = dumped.replace("</", "<\\/")
        return match.group(1) + dumped + match.group(3)

    return JSONLD_RE.sub(fix_block, text), counter["n"], counter["repaired"]


BREADCRUMB_MARKER = "st-breadcrumb-jsonld"


def build_breadcrumb(path, text):
    """BreadcrumbList JSON-LD for a post, so Google can render the trail.

    Only for /posts/<category>/<slug>/ pages, where the hierarchy is real.
    """
    rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
    parts = rel.split("/")
    if len(parts) != 4 or parts[0] != "posts" or parts[3] != "index.html":
        return None

    category_slug, slug = parts[1], parts[2]

    # Human-readable category name straight from the page's own category link
    m = re.search(
        r'<div class="gp-custom-category-section">.*?<a href="[^"]*">([^<]+)</a>',
        text,
        re.DOTALL,
    )
    category_name = m.group(1).strip() if m else category_slug.replace("-", " ").title()

    m = re.search(r'<h1 class="entry-title"[^>]*>(.*?)</h1>', text, re.DOTALL)
    title = re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else slug.replace("-", " ")

    crumbs = [
        ("Home", SITE + "/"),
        (category_name, "%s/category/%s/" % (SITE, category_slug)),
        (title, "%s/posts/%s/%s/" % (SITE, category_slug, slug)),
    ]

    items = [
        {
            "@type": "ListItem",
            "position": i + 1,
            "name": name,
            "item": url,
        }
        for i, (name, url) in enumerate(crumbs)
    ]

    data = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items,
    }
    return (
        '<script type="application/ld+json" class="%s">%s</script>'
        % (BREADCRUMB_MARKER, json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    )


LANDING_H3_RE = re.compile(r'<h3(\s+class="wp-block-heading")>(.*?)</h3>', re.DOTALL)

# Match the WHOLE heading element, not just its opening tag.
# A closing </h1> carries no class attribute, so rewriting only the opening
# tag silently produces "<h2 ...>text</h1>" — invalid, unbalanced markup.
# The alternation on the opening tag name also repairs any file already left
# in that mismatched state.
CARD_HEADING_RE = re.compile(
    r'<h[12](\s+class="gb-headline[^>]*)>(.*?)</h1>',
    re.DOTALL | re.IGNORECASE,
)


def demote_card_headings(text):
    """Post-card titles in a query loop must not be <h1>.

    /interview-questions/ shipped ten <h1> tags — one per card — and no page
    heading at all. Multiple H1s dilute the page's topic and give Google no
    single statement of what the page is about. The visual style comes from
    the .gb-headline-* class, not the tag, so appearance is unchanged.
    """
    return CARD_HEADING_RE.subn(r"<h2\g<1>>\g<2></h2>", text)


def promote_landing_heading(text):
    """Give a topic landing page a real <h1>.

    These pages open with <h3><strong>SQL :</strong></h3> acting as the page
    title while no <h1> exists anywhere. Promote that first heading in place —
    same words, same position, correct level. The stylesheet matches
    h1/h3.wp-block-heading identically so nothing moves visually.
    """
    if re.search(r"<h1[\s>]", text):
        return text, 0

    marker = '<div class="entry-content" itemprop="text">'
    start = text.find(marker)
    if start == -1:
        return text, 0

    m = LANDING_H3_RE.search(text, start, start + 2000)
    if not m:
        return text, 0

    replacement = "<h1%s>%s</h1>" % (m.group(1), m.group(2))
    return text[: m.start()] + replacement + text[m.end():], 1


FEATURED_IMG_RE = re.compile(r'<img\s+class="single-featured-image"([^>]*?)>', re.IGNORECASE)


def add_featured_image_alt(text):
    """Describe the featured image using the post's own title.

    The exporter emits the hero image with no alt attribute, so it is invisible
    to screen readers and contributes nothing to image search.
    """
    if 'class="single-featured-image"' not in text:
        return text, 0

    m = re.search(r'<h1 class="entry-title"[^>]*>(.*?)</h1>', text, re.DOTALL)
    if not m:
        return text, 0

    title = re.sub(r"<[^>]+>", "", m.group(1)).strip()
    title = title.replace('"', "&quot;")
    if not title:
        return text, 0

    count = {"n": 0}

    def repl(match):
        attrs = match.group(1)
        if "alt=" in attrs:
            return match.group(0)
        count["n"] += 1
        return '<img class="single-featured-image" alt="%s"%s>' % (title, attrs)

    return FEATURED_IMG_RE.sub(repl, text), count["n"]


# Rank Math sometimes scrapes a stray UI word as the description. Google may
# then print that word as the entire search snippet.
JUNK_DESCRIPTIONS = {
    "previous", "next", "continue reading", "read more", "home", "...", "",
}

CONTENT_H1_RE = re.compile(
    r'<h1(\s+class="wp-block-heading"[^>]*)>(.*?)</h1>',
    re.DOTALL | re.IGNORECASE,
)


def demote_content_headings(text):
    """A post already has its <h1>: the entry title.

    Any additional <h1> inside the body competes with it. Demote body
    headings to <h2>, which is also what the rest of the posts use.
    """
    if 'class="entry-title"' not in text:
        return text, 0
    return CONTENT_H1_RE.subn(r"<h2\g<1>>\g<2></h2>", text)


def strip_junk_description(text):
    """Remove a meta description that is a scraped UI word, so the
    description generator can replace it with something useful."""
    m = re.search(r'<meta name="description" content="([^"]*)">', text)
    if not m:
        return text, 0
    value = m.group(1).strip().lower()
    if value in JUNK_DESCRIPTIONS or len(value) < 25:
        return text.replace(m.group(0), "", 1), 1
    return text, 0


def fix_paginated_title(text, path):
    """Disambiguate paginated listings.

    /page/2/ and /page/3/ both shipped as "Home - SQL Tips", identical to the
    homepage. Duplicate titles make Google pick one and treat the rest as
    near-duplicates.
    """
    rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
    parts = rel.split("/")
    if "page" not in parts:
        return text, 0
    i = parts.index("page")
    if i + 1 >= len(parts) or not parts[i + 1].isdigit():
        return text, 0
    page_no = parts[i + 1]

    m = re.search(r"<title>(.*?)</title>", text, re.DOTALL)
    if not m:
        return text, 0
    title = re.sub(r"\s+", " ", m.group(1)).strip()
    if re.search(r"\bPage\s*%s\b" % page_no, title):
        return text, 0

    if " - SQL Tips" in title:
        new = title.replace(" - SQL Tips", " - Page %s - SQL Tips" % page_no, 1)
    else:
        new = "%s - Page %s" % (title, page_no)

    text = text.replace(m.group(0), "<title>%s</title>" % new, 1)

    # keep the social title consistent with the browser title
    text = re.sub(
        r'(<meta property="og:title" content=")([^"]*)(">)',
        lambda mm: mm.group(1) + new + mm.group(3),
        text,
        count=1,
    )
    return text, 1


def add_missing_description(text, path):
    """Write a meta description for archive pages that shipped without one.

    Google will invent a snippet when none is supplied, usually by scraping
    whatever text is nearest the top of the page. Supplying a purposeful one
    controls how the result reads and lifts click-through.

    Descriptions are derived from the page's own title and URL, and include the
    page number so paginated variants never collide as duplicates.
    """
    if '<meta name="description"' in text or "</head>" not in text:
        return text, 0

    rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
    parts = rel.split("/")

    m = re.search(r"<title>(.*?)</title>", text, re.DOTALL)
    title = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""
    subject = re.sub(r"\s*[-|]\s*SQL Tips\s*$", "", title).strip()
    subject = re.sub(r"\s+Archives$", "", subject).strip()

    # page number, if this is a paginated variant
    page_no = None
    if "page" in parts:
        i = parts.index("page")
        if i + 1 < len(parts) and parts[i + 1].isdigit():
            page_no = parts[i + 1]

    if parts[0] == "category" or parts[0] == "tag":
        desc = (
            "Browse every %s tutorial, guide and interview question on SQL Tips. "
            "Practical, example-driven articles for developers working with databases."
            % subject
        )
    elif parts[0] == "author":
        who = subject if subject and subject.lower() != "author" else "our authors"
        desc = (
            "Articles written by %s on SQL Tips — hands-on SQL, PL/SQL and "
            "PostgreSQL tutorials, worked examples and interview preparation."
            % who
        )
    elif parts[0] == "page":
        desc = (
            "More SQL, PL/SQL and PostgreSQL tutorials from SQL Tips — "
            "practical guides, worked examples and interview questions."
        )
    elif subject:
        desc = (
            "%s — SQL Tips. Practical SQL, PL/SQL and PostgreSQL tutorials, "
            "worked examples and interview preparation." % subject
        )
    else:
        return text, 0

    if page_no:
        desc = "%s Page %s." % (desc.rstrip("."), page_no)

    desc = desc.replace('"', "&quot;")
    tag = '<meta name="description" content="%s">' % desc
    return text.replace("</head>", tag + "\n</head>", 1), 1


def add_missing_canonical(text, path):
    """Give archive/paginated pages a self-referencing canonical.

    Tag archives and paginated listings shipped without one. Without a
    canonical, Google decides for itself which near-duplicate listing to keep
    and may consolidate the wrong URL.
    """
    if '<link rel="canonical"' in text or "</head>" not in text:
        return text, 0
    tag = '<link rel="canonical" href="%s%s">' % (SITE, url_for(path))
    return text.replace("</head>", tag + "\n</head>", 1), 1


def process_html(check_only):
    meta_fixed = jsonld_fixed = crumbs_added = files_changed = 0
    jsonld_repaired = canonicals_added = 0
    cards_demoted = h1s_promoted = alts_added = descriptions_added = 0
    junk_descriptions_replaced = titles_disambiguated = 0

    for path in iter_html_files():
        original = io.open(path, encoding="utf-8", errors="ignore").read()
        text = original

        text, n_meta = fix_meta(text)
        text, n_ld, n_repair = fix_jsonld(text, url_for(path))
        text, n_canon = add_missing_canonical(text, path)
        # strip a scraped junk description first so the generator can replace it
        text, n_junk = strip_junk_description(text)
        text, n_desc = add_missing_description(text, path)
        text, n_title = fix_paginated_title(text, path)

        # heading hierarchy: demote card <h1>s BEFORE promoting the page
        # heading, so the "does an h1 already exist?" test sees the truth.
        text, n_cards = demote_card_headings(text)
        text, n_body = demote_content_headings(text)
        text, n_h1 = promote_landing_heading(text)
        text, n_alt = add_featured_image_alt(text)

        jsonld_repaired += n_repair
        canonicals_added += n_canon
        descriptions_added += n_desc
        junk_descriptions_replaced += n_junk
        titles_disambiguated += n_title
        cards_demoted += n_body
        cards_demoted += n_cards
        h1s_promoted += n_h1
        alts_added += n_alt

        n_crumb = 0
        if BREADCRUMB_MARKER not in text:
            crumb = build_breadcrumb(path, text)
            if crumb and "</head>" in text:
                text = text.replace("</head>", crumb + "\n</head>", 1)
                n_crumb = 1

        meta_fixed += n_meta
        jsonld_fixed += n_ld
        crumbs_added += n_crumb

        if text != original:
            files_changed += 1
            if not check_only:
                io.open(path, "w", encoding="utf-8", newline="").write(text)

    return {
        "files_changed": files_changed,
        "meta_urls_absolutised": meta_fixed,
        "jsonld_urls_absolutised": jsonld_fixed,
        "jsonld_blocks_repaired": jsonld_repaired,
        "canonicals_added": canonicals_added,
        "descriptions_added": descriptions_added,
        "junk_descriptions_replaced": junk_descriptions_replaced,
        "paginated_titles_fixed": titles_disambiguated,
        "breadcrumbs_added": crumbs_added,
        "card_h1s_demoted_to_h2": cards_demoted,
        "landing_h1s_promoted": h1s_promoted,
        "featured_image_alts_added": alts_added,
    }


# --------------------------------------------------------------------------
# Sitemaps
# --------------------------------------------------------------------------

LOC_RE = re.compile(r"<loc>(.*?)</loc>", re.DOTALL)
URL_BLOCK_RE = re.compile(r"<url>(.*?)</url>", re.DOTALL)


def existing_lastmods():
    """slug -> (lastmod, image) harvested from the exported sitemaps.

    Keeps the real publish/update dates rather than replacing them with the
    export's file mtimes, which would tell Google every page changed today.
    """
    table = {}
    for name in os.listdir(ROOT):
        if not name.endswith("-sitemap.xml"):
            continue
        text = io.open(os.path.join(ROOT, name), encoding="utf-8").read()
        for block in URL_BLOCK_RE.findall(text):
            loc = LOC_RE.search(block)
            if not loc:
                continue
            slug = loc.group(1).strip().rstrip("/").split("/")[-1]
            lastmod = re.search(r"<lastmod>(.*?)</lastmod>", block)
            image = re.search(r"<image:loc>(.*?)</image:loc>", block)
            table[slug] = (
                lastmod.group(1).strip() if lastmod else None,
                image.group(1).strip() if image else None,
            )
    return table


def discover_urls():
    """Group the site's real pages by sitemap, using paths on disk."""
    groups = {"post": [], "page": [], "category": [], "author": []}
    lastmods = existing_lastmods()

    for path in iter_html_files():
        rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
        if rel == "404.html" or not (rel == "index.html" or rel.endswith("/index.html")):
            continue

        url = url_for(path)
        slug = url.rstrip("/").split("/")[-1] or "home"
        lastmod, image = lastmods.get(slug, (None, None))

        if lastmod is None:
            ts = datetime.fromtimestamp(os.path.getmtime(path), tz=timezone.utc)
            lastmod = ts.strftime("%Y-%m-%dT%H:%M:%S+00:00")

        entry = {"url": SITE + url, "lastmod": lastmod, "image": image}

        if rel.startswith("posts/"):
            groups["post"].append(entry)
        elif rel.startswith("category/"):
            groups["category"].append(entry)
        elif rel.startswith("author/"):
            groups["author"].append(entry)
        else:
            groups["page"].append(entry)

    return groups


def render_urlset(entries):
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<?xml-stylesheet type="text/xsl" href="%s/main-sitemap.xsl"?>' % SITE,
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ]
    for e in sorted(entries, key=lambda x: x["url"]):
        lines.append("\t<url>")
        lines.append("\t\t<loc>%s</loc>" % e["url"])
        lines.append("\t\t<lastmod>%s</lastmod>" % e["lastmod"])
        if e.get("image"):
            lines.append("\t\t<image:image>")
            lines.append("\t\t\t<image:loc>%s</image:loc>" % absolutise(e["image"]))
            lines.append("\t\t</image:image>")
        lines.append("\t</url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def render_index(names, groups):
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<?xml-stylesheet type="text/xsl" href="%s/main-sitemap.xsl"?>' % SITE,
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for name in names:
        entries = groups[name]
        if not entries:
            continue
        newest = max(e["lastmod"] for e in entries)
        lines.append("\t<sitemap>")
        lines.append("\t\t<loc>%s/%s-sitemap.xml</loc>" % (SITE, name))
        lines.append("\t\t<lastmod>%s</lastmod>" % newest)
        lines.append("\t</sitemap>")
    lines.append("</sitemapindex>")
    return "\n".join(lines) + "\n"


def process_sitemaps(check_only):
    groups = discover_urls()
    order = ["post", "page", "category", "author"]
    written = {}

    for name in order:
        if not groups[name]:
            continue
        target = os.path.join(ROOT, "%s-sitemap.xml" % name)
        written[name] = len(groups[name])
        if not check_only:
            io.open(target, "w", encoding="utf-8", newline="\n").write(
                render_urlset(groups[name])
            )

    index_xml = render_index(order, groups)
    if not check_only:
        for name in ("sitemap_index.xml", "sitemap.xml"):
            io.open(os.path.join(ROOT, name), "w", encoding="utf-8", newline="\n").write(
                index_xml
            )

    return written


# --------------------------------------------------------------------------
# robots.txt
# --------------------------------------------------------------------------

ROBOTS = """# robots.txt — sqltips.in
# This is a static site: there is no WordPress admin to protect.

User-agent: *
Allow: /

# Crawler traps and duplicate surfaces
Disallow: /*?query-*
Disallow: /*?s=
Disallow: /*?replytocom=
Disallow: /wp-includes/
Disallow: /wp-content/plugins/

# Let crawlers fetch the assets needed to render and judge the page
Allow: /wp-content/uploads/
Allow: /*.css$
Allow: /*.js$
Allow: /*.svg$
Allow: /*.png$
Allow: /*.jpg$
Allow: /*.webp$

# AI crawlers that provide attribution are welcome; adjust to taste.
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: {site}/sitemap_index.xml
Sitemap: {site}/post-sitemap.xml
Sitemap: {site}/page-sitemap.xml
Sitemap: {site}/category-sitemap.xml
Sitemap: {site}/author-sitemap.xml
""".replace("{site}", SITE)


def process_robots(check_only):
    target = os.path.join(ROOT, "robots.txt")
    current = io.open(target, encoding="utf-8").read() if os.path.exists(target) else ""
    if current == ROBOTS:
        return False
    if not check_only:
        io.open(target, "w", encoding="utf-8", newline="\n").write(ROBOTS)
    return True


# --------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Normalise SQL Tips SEO metadata.")
    ap.add_argument("--check", action="store_true", help="report without writing")
    args = ap.parse_args()

    html = process_html(args.check)
    maps = process_sitemaps(args.check)
    robots = process_robots(args.check)

    mode = "WOULD CHANGE" if args.check else "CHANGED"
    print("HTML")
    for k, v in html.items():
        print("  %-26s %s" % (k, v))
    print("SITEMAPS (%s)" % mode)
    for k, v in sorted(maps.items()):
        print("  %-26s %s urls" % (k + "-sitemap.xml", v))
    print("ROBOTS")
    print("  %-26s %s" % ("robots.txt", "updated" if robots else "already current"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
