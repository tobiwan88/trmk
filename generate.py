import os
import shutil
import re
from datetime import datetime
from collections import defaultdict
import jinja2
import markdown
import yaml
import html

BLOG_ENTRIES_DIR = "blog_entries"
TEMPLATES_DIR = "templates"
OUTPUT_DIR = "blog"
STATIC_DIR = "static"
SUPPORTED_LANGUAGES = ["en", "de"]
OG_IMAGE_WIDTH = "1200"
OG_IMAGE_HEIGHT = "630"
OG_IMAGE_URL = "https://www.trmk.de/og-image.png"
SITE_URL = "https://www.trmk.de"

def strip_html(content):
    return re.sub(r'<[^>]+>', '', content).strip()

def extract_description(content, max_len=155):
    text = strip_html(content)
    if len(text) > max_len:
        desc = text[:max_len]
        last_space = desc.rfind(' ')
        if last_space > 100:
            desc = desc[:last_space]
        desc += '…'
    else:
        desc = text
    return desc

def demote_headings(html_content):
    def replace_heading(m):
        tag = m.group(1)
        level = int(m.group(1))
        new_level = level + 1
        if new_level > 6:
            new_level = 6
        return m.group(0).replace(f'<h{level}', f'<h{new_level}').replace(f'</h{level}>', f'</h{new_level}>')
    return re.sub(r'</?h(\d)[^>]*>', lambda m: replace_heading(m), html_content)

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
        post_pages.append({'loc': post_url, 'lastmod': lastmod, 'priority': '0.7', 'changefreq': 'monthly'})

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

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
        lines.append('  </url>')

    lines.append('</urlset>')
    return '\n'.join(lines)

def main():
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)

    env = jinja2.Environment(loader=jinja2.FileSystemLoader(TEMPLATES_DIR))
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

            html_content = demote_headings(html_content)
            html_content = add_lazy_loading(html_content)

            post = {
                "title": frontmatter.get("title", "Untitled"),
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

        post_output_path = os.path.join(OUTPUT_DIR, f"{post['slug']}.html")
        with open(post_output_path, "w", encoding="utf-8") as out_f:
            out_f.write(post_template.render(post=post, **context))

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
            title=newest_post['title'],
            description=newest_post['description'],
            template_type='index',
            page_url=f"{SITE_URL}/blog/",
            hreflang_entries=hreflang_entries
        )
        context['is_post'] = False
        context['latest_post'] = newest_post

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
                                          og_image_height=OG_IMAGE_HEIGHT,
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
        description="All blog posts by Tobias R.M.K. Meyer, covering embedded systems, firmware development, and software engineering.",
        template_type='archive', page_url=archive_url, hreflang_entries=hreflang_entries
    )
    context['is_post'] = False
    with open(archive_output_path, "w", encoding="utf-8") as f:
        f.write(archive_template.render(posts=posts, **context))

    sitemap_content = generate_sitemap(posts)
    sitemap_path = os.path.join(os.path.dirname(__file__), "sitemap.xml")
    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write(sitemap_content)

    if os.path.exists(STATIC_DIR):
        shutil.copytree(STATIC_DIR, os.path.join(OUTPUT_DIR, STATIC_DIR))

    print("✅ Blog generated successfully!")
    print(f"   Generated {len(posts)} posts in {len(SUPPORTED_LANGUAGES)} languages")
    for lang in SUPPORTED_LANGUAGES:
        count = len(posts_by_lang.get(lang, []))
        print(f"   - {lang.upper()}: {count} posts")
    print("   sitemap.xml updated")


if __name__ == "__main__":
    main()