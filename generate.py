import os
import shutil
import re
from datetime import datetime
from collections import defaultdict
import jinja2
import markdown
import yaml
import html
import json
import math

BLOG_ENTRIES_DIR = "blog_entries"
TEMPLATES_DIR = "templates"
OUTPUT_DIR = "blog"
STATIC_DIR = "static"
SUPPORTED_LANGUAGES = ["en", "de"]
OG_IMAGE_WIDTH = "1200"
OG_IMAGE_HEIGHT = "630"
OG_IMAGE_URL = "https://www.trmk.de/og/blog.png"
SITE_AUTHOR = "Tobias R.M.K. Meyer"
WORDS_PER_MINUTE = 200
# Labels rendered into a post in the post's own language (no client-side switch needed)
POST_LABELS = {
    "en": {"min_read": "min read", "older": "Older", "newer": "Newer", "all_posts": "All posts",
           "translation": "Also in", "published": "Published", "lang_name": {"en": "English", "de": "Deutsch"}},
    "de": {"min_read": "Min. Lesezeit", "older": "Älter", "newer": "Neuer", "all_posts": "Alle Beiträge",
           "translation": "Auch auf", "published": "Veröffentlicht", "lang_name": {"en": "English", "de": "Deutsch"}},
}
FEED_INFO = {
    "en": {"file": "feed.xml", "title": "Tobias R.M.K. Meyer - Blog",
           "description": "Build logs about embedded systems, Zephyr, hardware and working with AI tools."},
    "de": {"file": "feed-de.xml", "title": "Tobias R.M.K. Meyer - Blog (Deutsch)",
           "description": "Bau-Logbücher über Embedded-Systeme, Zephyr, Hardware und das Arbeiten mit KI-Werkzeugen."},
}
SITE_URL = "https://www.trmk.de"
PERSON_ID = f"{SITE_URL}/#person"

def strip_html(content):
    return re.sub(r'<[^>]+>', '', content).strip()

def extract_description(content, max_len=155):
    # Headings repeat the title or are section labels; describe the post from its prose only.
    # Entities from the Markdown HTML (e.g. &amp;) are kept, since templates insert this as-is.
    body = re.sub(r'<h[1-6][^>]*>.*?</h[1-6]>', ' ', content, flags=re.S)
    body = re.sub(r'<pre[^>]*>.*?</pre>', ' ', body, flags=re.S)
    text = re.sub(r'\s+', ' ', strip_html(body)).strip()
    if len(text) > max_len:
        desc = text[:max_len]
        last_space = desc.rfind(' ')
        if last_space > 100:
            desc = desc[:last_space]
        desc += '…'
    else:
        desc = text
    return desc

def _norm(text):
    return re.sub(r'[^a-z0-9äöüß]+', '', html.unescape(text).lower())

def drop_title_heading(html_content, title):
    """Remove a leading <h1> that repeats the frontmatter title (it is already the page headline)."""
    m = re.match(r'\s*<h1[^>]*>(.*?)</h1>\s*', html_content, re.S)
    if m and _norm(strip_html(m.group(1))) == _norm(title):
        return html_content[m.end():]
    return html_content

def reading_minutes(html_content):
    words = len(strip_html(html_content).split())
    return max(1, math.ceil(words / WORDS_PER_MINUTE))

def json_ld(data):
    """Serialise structured data safely for embedding in a <script> tag."""
    return json.dumps(data, ensure_ascii=False, indent=2).replace('</', '<\\/')

def post_json_ld(post, page_url):
    return json_ld({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": html.unescape(post["title"]),
        "description": html.unescape(post["description"]),
        "datePublished": post["date"],
        "inLanguage": post["lang"],
        "wordCount": post["words"],
        "timeRequired": f"PT{post['minutes']}M",
        "url": page_url,
        "mainEntityOfPage": {"@type": "WebPage", "@id": page_url},
        "image": OG_IMAGE_URL,
        "author": {"@type": "Person", "@id": PERSON_ID, "name": SITE_AUTHOR, "url": f"{SITE_URL}/"},
        "publisher": {"@type": "Person", "@id": PERSON_ID, "name": SITE_AUTHOR, "url": f"{SITE_URL}/"},
        "isPartOf": {"@type": "Blog", "@id": f"{SITE_URL}/blog/#blog"},
    })

def group_articles(posts):
    """One entry per article (translations grouped), newest first; English is the primary version."""
    by_slug = defaultdict(dict)
    for post in posts:
        by_slug[post["base_slug"]][post["lang"]] = post
    articles = []
    for base_slug, versions in by_slug.items():
        primary = versions.get("en") or next(iter(versions.values()))
        articles.append({
            "base_slug": base_slug,
            "date": primary["date"],
            "primary": primary,
            "versions": [versions[l] for l in SUPPORTED_LANGUAGES if l in versions],
        })
    articles.sort(key=lambda a: a["date"], reverse=True)
    return articles

def blog_json_ld(articles, description):
    return json_ld({
        "@context": "https://schema.org",
        "@type": "Blog",
        "@id": f"{SITE_URL}/blog/#blog",
        "name": f"{SITE_AUTHOR} - Blog",
        "description": description,
        "url": f"{SITE_URL}/blog/",
        "inLanguage": SUPPORTED_LANGUAGES,
        "author": {"@type": "Person", "@id": PERSON_ID, "name": SITE_AUTHOR, "url": f"{SITE_URL}/"},
        "blogPost": [{
            "@type": "BlogPosting",
            "headline": html.unescape(v["title"]),
            "url": f"{SITE_URL}/blog/{v['slug']}.html",
            "datePublished": v["date"],
            "inLanguage": v["lang"],
        } for a in articles for v in a["versions"]],
    })

def demote_headings(html_content):
    def replace_heading(m):
        tag = m.group(1)
        level = int(m.group(1))
        new_level = level + 1
        if new_level > 6:
            new_level = 6
        return m.group(0).replace(f'<h{level}', f'<h{new_level}').replace(f'</h{level}>', f'</h{new_level}>')
    return re.sub(r'</?h(\d)[^>]*>', lambda m: replace_heading(m), html_content)

def wrap_code_blocks(html_content):
    """<pre><code class="language-x"> -> labelled code panel (styled in css/blog.css)."""
    def repl(m):
        attrs = m.group(1) or ''
        lang = re.search(r'language-([\w+-]+)', attrs)
        label = lang.group(1) if lang else 'code'
        return (f'<div class="codehilite" data-lang="{html.escape(label)}">'
                f'<pre class="blog-code-block"><code{attrs}>')
    html_content = re.sub(r'<pre><code([^>]*)>', repl, html_content)
    return html_content.replace('</code></pre>', '</code></pre></div>')

def wrap_figures(html_content):
    """A paragraph holding only an image becomes a figure; the alt text is the caption."""
    def repl(m):
        img = m.group(1)
        alt = re.search(r'alt="([^"]*)"', img)
        caption = f'<figcaption>{alt.group(1)}</figcaption>' if alt and alt.group(1) else ''
        return f'<figure class="blog-image-figure">{img}{caption}</figure>'
    return re.sub(r'<p>\s*(<img[^>]*>)\s*</p>', repl, html_content)

def add_lazy_loading(html_content):
    return re.sub(r'<img(?![^>]*loading=)', '<img loading="lazy"', html_content)

def build_hreflang_entries(post, page_url):
    entries = []
    for lang in SUPPORTED_LANGUAGES:
        lang_url = f"{SITE_URL}/blog/{post['slug'].rsplit('-', 1)[0]}-{lang}.html"
        entries.append({
            'lang': lang,
            'url': lang_url
        })
    entries.append({'lang': 'x-default', 'url': page_url})
    return entries

def build_page_context(post, title, description, template_type, page_url, hreflang_entries):
    page_lang = post['lang'] if post else 'en'
    og_type = 'article' if template_type == 'post' else 'website'
    return {
        'page_lang': page_lang,
        'page_url': page_url,
        'canonical_url': page_url,
        'title': title,
        'description': description,
        'og_type': og_type,
        'og_site_name': 'Tobias R.M.K. Meyer',
        'og_image': OG_IMAGE_URL,
        'og_image_width': OG_IMAGE_WIDTH,
        'og_image_height': OG_IMAGE_HEIGHT,
        'hreflang_entries': hreflang_entries,
        'template_type': template_type,
        'site_url': SITE_URL,
    }

def generate_sitemap(posts):
    static_pages = [
        {'loc': f'{SITE_URL}/', 'priority': '1.0', 'changefreq': 'weekly'},
        {'loc': f'{SITE_URL}/cv.html', 'priority': '0.8', 'changefreq': 'monthly'},
        {'loc': f'{SITE_URL}/freelancing.html', 'priority': '0.8', 'changefreq': 'monthly'},
    ]
    blog_pages = [
        {'loc': f'{SITE_URL}/blog/', 'priority': '0.9', 'changefreq': 'daily'},
        {'loc': f'{SITE_URL}/blog/archive.html', 'priority': '0.6', 'changefreq': 'weekly'},
    ]
    post_pages = []
    for post in posts:
        post_url = f'{SITE_URL}/blog/{post["slug"]}.html'
        date_obj = datetime.strptime(post['date'], '%Y-%m-%d')
        lastmod = date_obj.strftime('%Y-%m-%d')
        # language alternates: the post itself plus its translations
        alternates = {post['lang']: post_url}
        for other_lang, other_post in post.get('translations', {}).items():
            alternates[other_lang] = f'{SITE_URL}/blog/{other_post["slug"]}.html'
        post_pages.append({'loc': post_url, 'lastmod': lastmod, 'priority': '0.7', 'changefreq': 'monthly',
                           'alternates': alternates if len(alternates) > 1 else {}})

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
             'xmlns:xhtml="http://www.w3.org/1999/xhtml">']

    for page in static_pages:
        lines.append('  <url>')
        lines.append(f'    <loc>{page["loc"]}</loc>')
        lines.append(f'    <changefreq>{page["changefreq"]}</changefreq>')
        lines.append(f'    <priority>{page["priority"]}</priority>')
        lines.append('  </url>')

    for page in blog_pages:
        lines.append('  <url>')
        lines.append(f'    <loc>{page["loc"]}</loc>')
        lines.append(f'    <changefreq>{page["changefreq"]}</changefreq>')
        lines.append(f'    <priority>{page["priority"]}</priority>')
        lines.append('  </url>')

    for page in post_pages:
        lines.append('  <url>')
        lines.append(f'    <loc>{page["loc"]}</loc>')
        lines.append(f'    <lastmod>{page["lastmod"]}</lastmod>')
        lines.append(f'    <changefreq>{page["changefreq"]}</changefreq>')
        lines.append(f'    <priority>{page["priority"]}</priority>')
        for alt_lang, alt_url in sorted(page['alternates'].items()):
            lines.append(f'    <xhtml:link rel="alternate" hreflang="{alt_lang}" href="{alt_url}"/>')
        lines.append('  </url>')

    lines.append('</urlset>')
    return '\n'.join(lines)

def rfc822(date_str):
    return datetime.strptime(date_str, '%Y-%m-%d').strftime('%a, %d %b %Y 00:00:00 +0000')

def generate_feed(lang, lang_posts):
    """RSS 2.0 feed for one language (newest first, as sorted by main())."""
    info = FEED_INFO[lang]
    feed_url = f'{SITE_URL}/blog/{info["file"]}'
    esc = html.escape
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
             '<channel>',
             f'  <title>{esc(info["title"])}</title>',
             f'  <link>{SITE_URL}/blog/</link>',
             f'  <description>{esc(info["description"])}</description>',
             f'  <language>{lang}</language>',
             f'  <atom:link href="{feed_url}" rel="self" type="application/rss+xml"/>']
    if lang_posts:
        lines.append(f'  <lastBuildDate>{rfc822(lang_posts[0]["date"])}</lastBuildDate>')
    for post in lang_posts:
        url = f'{SITE_URL}/blog/{post["slug"]}.html'
        lines += ['  <item>',
                  f'    <title>{esc(html.unescape(post["title"]))}</title>',
                  f'    <link>{url}</link>',
                  f'    <guid isPermaLink="true">{url}</guid>',
                  f'    <pubDate>{rfc822(post["date"])}</pubDate>',
                  f'    <author>tobias.meyer@trmk.de ({esc(SITE_AUTHOR)})</author>',
                  f'    <description>{esc(html.unescape(post["description"]))}</description>',
                  '  </item>']
    lines += ['</channel>', '</rss>']
    return '\n'.join(lines) + '\n'

def main():
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)

    env = jinja2.Environment(loader=jinja2.FileSystemLoader(TEMPLATES_DIR))
    # Plain text for HTML attributes: normalise entities, then escape once (quotes included)
    env.filters['attr'] = lambda v: html.escape(html.unescape(str(v)), quote=True)
    post_template = env.get_template("post.html")
    index_template = env.get_template("index.html")
    archive_template = env.get_template("archive.html")

    posts = []
    posts_by_slug = defaultdict(dict)

    for lang in SUPPORTED_LANGUAGES:
        lang_dir = os.path.join(BLOG_ENTRIES_DIR, lang)
        if not os.path.exists(lang_dir):
            print(f"⚠️  Warning: Language directory '{lang}' not found, skipping...")
            continue

        for filename in os.listdir(lang_dir):
            if not filename.endswith(".md"):
                continue

            filepath = os.path.join(lang_dir, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            if content.startswith("---"):
                parts = content.split("---", 2)
                frontmatter = yaml.safe_load(parts[1])
                md_content = parts[2]
            else:
                frontmatter = {}
                md_content = content

            html_content = markdown.markdown(md_content, extensions=['fenced_code', 'tables'])

            match = re.match(r'\d{4}-\d{2}-\d{2}-(.+)\.md', filename)
            if match:
                base_slug = match.group(1)
            else:
                base_slug = os.path.splitext(filename)[0]

            url_slug = f"{base_slug}-{lang}"

            raw_desc = strip_html(html_content)
            description = frontmatter.get('description') or extract_description(html_content)

            title = frontmatter.get("title", "Untitled")
            html_content = drop_title_heading(html_content, title)
            html_content = demote_headings(html_content)
            html_content = add_lazy_loading(html_content)
            html_content = wrap_figures(html_content)
            html_content = wrap_code_blocks(html_content)
            words = len(strip_html(html_content).split())

            post = {
                "title": title,
                "words": words,
                "minutes": reading_minutes(html_content),
                "date": frontmatter.get("date", "No Date"),
                "description": description,
                "content": html_content,
                "slug": url_slug,
                "base_slug": base_slug,
                "lang": lang,
                "translations": {}
            }
            posts.append(post)
            posts_by_slug[base_slug][lang] = post

    for base_slug, translations in posts_by_slug.items():
        for lang, post in translations.items():
            for other_lang, other_post in translations.items():
                if other_lang != lang:
                    post["translations"][other_lang] = other_post

    posts.sort(key=lambda p: (datetime.strptime(p["date"], "%Y-%m-%d"), p["lang"]), reverse=True)

    posts_by_lang = defaultdict(list)
    for post in posts:
        posts_by_lang[post["lang"]].append(post)

    for lang, lang_posts in posts_by_lang.items():
        for i, post in enumerate(lang_posts):
            post["next_post"] = lang_posts[i - 1] if i > 0 else None
            post["previous_post"] = lang_posts[i + 1] if i < len(lang_posts) - 1 else None

    for post in posts:
        post_url = f"{SITE_URL}/blog/{post['slug']}.html"
        hreflang_entries = build_hreflang_entries(post, post_url)

        context = build_page_context(
            post=post,
            title=post['title'],
            description=post['description'],
            template_type='post',
            page_url=post_url,
            hreflang_entries=hreflang_entries
        )
        context['is_post'] = True
        context['labels'] = POST_LABELS.get(post['lang'], POST_LABELS['en'])
        context['ld_json'] = post_json_ld(post, post_url)

        post_output_path = os.path.join(OUTPUT_DIR, f"{post['slug']}.html")
        with open(post_output_path, "w", encoding="utf-8") as out_f:
            out_f.write(post_template.render(post=post, **context))

    articles = group_articles(posts)
    blog_description = FEED_INFO["en"]["description"]

    if posts:
        en_posts = posts_by_lang.get("en", [])
        newest_post = en_posts[0] if en_posts else posts[0]

        newest_url = f"{SITE_URL}/blog/{newest_post['slug']}.html"
        hreflang_entries = [
            {'lang': 'en', 'url': f"{SITE_URL}/blog/"},
            {'lang': 'de', 'url': f"{SITE_URL}/blog/"},
            {'lang': 'x-default', 'url': f"{SITE_URL}/blog/"},
        ]
        context = build_page_context(
            post=newest_post,
            title="Blog",
            description=blog_description,
            template_type='index',
            page_url=f"{SITE_URL}/blog/",
            hreflang_entries=hreflang_entries
        )
        context['is_post'] = False
        context['latest_post'] = newest_post
        context['articles'] = articles
        context['ld_json'] = blog_json_ld(articles, blog_description)

        index_output_path = os.path.join(OUTPUT_DIR, "index.html")
        with open(index_output_path, "w", encoding="utf-8") as f:
            f.write(index_template.render(post=newest_post, **context))
    else:
        index_output_path = os.path.join(OUTPUT_DIR, "index.html")
        with open(index_output_path, "w", encoding="utf-8") as f:
            f.write(index_template.render(title="No Posts Yet", no_posts=True,
                                          page_lang='en', page_url=f"{SITE_URL}/blog/",
                                          canonical_url=f"{SITE_URL}/blog/",
                                          description="No blog posts yet.",
                                          og_type='website', og_site_name='Tobias R.M.K. Meyer',
                                          og_image=OG_IMAGE_URL, og_image_width=OG_IMAGE_WIDTH,
                                          og_image_height=OG_IMAGE_HEIGHT, site_url=SITE_URL,
                                          hreflang_entries=[
                                              {'lang': 'en', 'url': f"{SITE_URL}/blog/"},
                                              {'lang': 'de', 'url': f"{SITE_URL}/blog/"},
                                              {'lang': 'x-default', 'url': f"{SITE_URL}/blog/"},
                                          ], is_post=False))

    archive_output_path = os.path.join(OUTPUT_DIR, "archive.html")
    archive_url = f"{SITE_URL}/blog/archive.html"
    hreflang_entries = [
        {'lang': 'en', 'url': archive_url},
        {'lang': 'de', 'url': archive_url},
        {'lang': 'x-default', 'url': archive_url},
    ]
    context = build_page_context(
        post=None, title="Archive",
        description="All blog posts by Tobias R.M.K. Meyer: embedded systems, Zephyr, hardware and working with AI tools, in English and German.",
        template_type='archive', page_url=archive_url, hreflang_entries=hreflang_entries
    )
    context['is_post'] = False
    years = defaultdict(list)
    for article in articles:
        years[str(article['date'])[:4]].append(article)
    context['articles_by_year'] = sorted(years.items(), reverse=True)
    context['article_count'] = len(articles)
    with open(archive_output_path, "w", encoding="utf-8") as f:
        f.write(archive_template.render(posts=posts, **context))

    sitemap_content = generate_sitemap(posts)
    sitemap_path = "sitemap.xml"
    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write(sitemap_content)

    for lang in SUPPORTED_LANGUAGES:
        with open(os.path.join(OUTPUT_DIR, FEED_INFO[lang]["file"]), "w", encoding="utf-8") as f:
            f.write(generate_feed(lang, posts_by_lang.get(lang, [])))

    # llms.txt: plain-text site summary for AI agents (skipped if the template is absent)
    llms_written = False
    if os.path.exists(os.path.join(TEMPLATES_DIR, "llms.txt")):
        llms = env.get_template("llms.txt").render(posts=posts_by_lang.get("en", []), site_url=SITE_URL)
        with open("llms.txt", "w", encoding="utf-8") as f:
            f.write(llms)
        llms_written = True

    if os.path.exists(STATIC_DIR):
        shutil.copytree(STATIC_DIR, os.path.join(OUTPUT_DIR, STATIC_DIR))

    print("✅ Blog generated successfully!")
    print(f"   Generated {len(posts)} posts in {len(SUPPORTED_LANGUAGES)} languages")
    for lang in SUPPORTED_LANGUAGES:
        count = len(posts_by_lang.get(lang, []))
        print(f"   - {lang.upper()}: {count} posts")
    print("   sitemap.xml + RSS feeds updated")
    if llms_written:
        print("   llms.txt updated")


if __name__ == "__main__":
    main()