#!/usr/bin/env python3
"""
SQL Tips — SEO verifier
=======================

Independent check that the site's crawlable metadata is well formed. Run it
after seo_fix.py, and after any fresh WordPress export.

Fails (exit 1) on anything that would actually cost search visibility:
  * JSON-LD that no longer parses
  * sitemap XML that is malformed or contains a relative <loc>
  * canonical / og:url / og:image that is not absolute
  * a canonical that does not match the page's own path (self-reference)
  * a sitemap URL that does not correspond to a real file

Usage:
    python _tools/seo_verify.py
"""

import io
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

SITE = "https://sqltips.in"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# _templates holds the new-post scaffold with {{PLACEHOLDER}} tokens; it is not
# a real page and Firebase excludes it from deploys, so it is not verified.
SKIP_DIRS = {".git", "wp-content", "wp-includes", "_tools", "_templates", "node_modules"}

JSONLD_RE = re.compile(
    r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
    re.DOTALL | re.IGNORECASE,
)

errors = []
warnings = []
stats = {
    "pages": 0,
    "jsonld_blocks": 0,
    "breadcrumbs": 0,
    "canonicals": 0,
    "og_images": 0,
    "sitemap_urls": 0,
}


def iter_html():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if name.endswith(".html"):
                yield os.path.join(dirpath, name)


def url_for(path):
    rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def unescape(s):
    return (
        s.replace("&quot;", '"')
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
    )


def check_html():
    for path in iter_html():
        rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
        if rel == "404.html":
            continue
        stats["pages"] += 1
        text = io.open(path, encoding="utf-8", errors="ignore").read()

        # --- JSON-LD parses -------------------------------------------------
        # NOTE: parse the RAW text. The content of a <script> element is not
        # HTML-entity-decoded by parsers, so "&quot;" inside a JSON string is
        # literal text, not a quote character. Unescaping before parsing would
        # wrongly report valid blocks as broken.
        for block in JSONLD_RE.findall(text):
            stats["jsonld_blocks"] += 1
            raw = block.strip()
            try:
                data = json.loads(raw)
            except Exception as exc:
                errors.append("%s: JSON-LD does not parse (%s)" % (rel, exc))
                continue
            if isinstance(data, dict) and data.get("@type") == "BreadcrumbList":
                stats["breadcrumbs"] += 1
            # entities that survive into the data itself are a content bug:
            # Google would read the description as literally "&quot;".
            if re.search(r"&(quot|amp|#0?39|apos|lt|gt);", raw):
                warnings.append("%s: HTML entities inside JSON-LD values" % rel)

        # --- canonical ------------------------------------------------------
        m = re.search(r'<link rel="canonical" href="([^"]*)"', text)
        if not m:
            warnings.append("%s: no canonical tag" % rel)
        else:
            stats["canonicals"] += 1
            href = m.group(1)
            if not href.startswith("http"):
                errors.append("%s: canonical is not absolute -> %s" % (rel, href))
            elif href != SITE + url_for(path):
                errors.append(
                    "%s: canonical does not self-reference\n     got %s\n     want %s"
                    % (rel, href, SITE + url_for(path))
                )

        # --- social URLs ----------------------------------------------------
        for prop, label in (
            ('og:url', "og:url"),
            ('og:image', "og:image"),
            ('og:image:secure_url', "og:image:secure_url"),
        ):
            for value in re.findall(
                r'<meta property="%s" content="([^"]*)"' % re.escape(prop), text
            ):
                if prop == "og:image":
                    stats["og_images"] += 1
                if not value.startswith("http"):
                    errors.append("%s: %s is not absolute -> %s" % (rel, label, value))

        for value in re.findall(r'<meta name="twitter:image" content="([^"]*)"', text):
            if not value.startswith("http"):
                errors.append("%s: twitter:image is not absolute -> %s" % (rel, value))


def check_content():
    """On-page signals: titles, descriptions, headings, image alt text.

    These are warnings rather than errors — they cost ranking and click-through
    but do not break crawling.
    """
    from collections import Counter

    titles = Counter()
    descriptions = Counter()

    for path in iter_html():
        rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
        if rel == "404.html":
            continue
        text = io.open(path, encoding="utf-8", errors="ignore").read()

        m = re.search(r"<title>(.*?)</title>", text, re.DOTALL)
        title = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""
        m = re.search(r'<meta name="description" content="([^"]*)"', text)
        desc = m.group(1).strip() if m else ""

        if not title:
            warnings.append("%s: no <title>" % rel)
        else:
            titles[title] += 1
            # Google truncates around 60 characters
            if len(title) > 65:
                warnings.append("%s: title is %d chars (truncated in results)" % (rel, len(title)))

        if not desc:
            warnings.append("%s: no meta description" % rel)
        else:
            descriptions[desc] += 1
            if len(desc) > 160:
                warnings.append("%s: meta description is %d chars" % (rel, len(desc)))

        # Unbalanced heading tags are an ERROR: "<h2 ...>text</h1>" makes the
        # document tree ambiguous and misreports the page's structure.
        for level in (1, 2, 3):
            opens = len(re.findall(r"<h%d[\s>]" % level, text))
            closes = len(re.findall(r"</h%d>" % level, text))
            if opens != closes:
                errors.append(
                    "%s: unbalanced <h%d> tags (%d open, %d close)"
                    % (rel, level, opens, closes)
                )

        h1s = re.findall(r"<h1[\s>]", text)
        if len(h1s) == 0:
            warnings.append("%s: no <h1>" % rel)
        elif len(h1s) > 1:
            warnings.append("%s: %d <h1> tags (should be exactly 1)" % (rel, len(h1s)))

        missing_alt = [
            img for img in re.findall(r"<img\s[^>]*>", text) if "alt=" not in img
        ]
        if missing_alt:
            stats["images_missing_alt"] = stats.get("images_missing_alt", 0) + len(missing_alt)
            warnings.append("%s: %d <img> without alt" % (rel, len(missing_alt)))

    for title, count in titles.items():
        if count > 1:
            warnings.append('duplicate <title> on %d pages: "%s"' % (count, title[:70]))
    for desc, count in descriptions.items():
        if count > 1:
            warnings.append('duplicate meta description on %d pages: "%s"' % (count, desc[:70]))


def check_sitemaps():
    for name in sorted(os.listdir(ROOT)):
        if not (name.endswith("sitemap.xml") or name == "sitemap_index.xml"):
            continue
        path = os.path.join(ROOT, name)
        try:
            tree = ET.parse(path)
        except Exception as exc:
            errors.append("%s: malformed XML (%s)" % (name, exc))
            continue

        for loc in tree.getroot().iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc"):
            value = (loc.text or "").strip()
            stats["sitemap_urls"] += 1
            if not value.startswith("http"):
                errors.append("%s: relative <loc> -> %s" % (name, value))
                continue
            if not value.startswith(SITE):
                errors.append("%s: <loc> on wrong host -> %s" % (name, value))
                continue

            # every listed URL must resolve to a real file (no 404s, no redirects)
            rel = value[len(SITE):]
            if rel.endswith(".xml"):
                target = os.path.join(ROOT, rel.lstrip("/"))
            elif rel.endswith("/"):
                target = os.path.join(ROOT, rel.strip("/"), "index.html")
            else:
                target = os.path.join(ROOT, rel.lstrip("/"))
            if not os.path.exists(target):
                errors.append("%s: <loc> has no file on disk -> %s" % (name, value))


def check_robots():
    path = os.path.join(ROOT, "robots.txt")
    if not os.path.exists(path):
        errors.append("robots.txt is missing")
        return
    text = io.open(path, encoding="utf-8").read()
    if "Sitemap:" not in text:
        errors.append("robots.txt does not reference a sitemap")
    for line in text.splitlines():
        if line.startswith("Sitemap:"):
            url = line.split(":", 1)[1].strip()
            if not url.startswith("http"):
                errors.append("robots.txt: sitemap URL is not absolute -> %s" % url)
            local = os.path.join(ROOT, url[len(SITE):].lstrip("/"))
            if url.startswith(SITE) and not os.path.exists(local):
                errors.append("robots.txt: sitemap does not exist -> %s" % url)


def main():
    check_html()
    check_content()
    check_sitemaps()
    check_robots()

    print("Checked:")
    for k, v in stats.items():
        print("  %-16s %s" % (k, v))

    if warnings:
        print("\nWarnings (%d):" % len(warnings))
        for w in warnings[:40]:
            print("  ! " + w)

    if errors:
        print("\nERRORS (%d):" % len(errors))
        for e in errors[:30]:
            print("  x " + e)
        return 1

    print("\nAll SEO metadata checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
