import os
import shutil
import re
from datetime import datetime
from collections import defaultdict
import jinja2
import markdown
import yaml

# --- Configuration ---
BLOG_ENTRIES_DIR = "blog_entries"
TEMPLATES_DIR = "templates"
OUTPUT_DIR = "blog"
STATIC_DIR = "static"
SUPPORTED_LANGUAGES = ["en", "de"]

# --- Main Script ---
def main():
    """
    Generates the static blog site with multilingual support.
    """
    # Create output directory if it doesn't exist
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)

    # Set up Jinja2 environment
    env = jinja2.Environment(loader=jinja2.FileSystemLoader(TEMPLATES_DIR))
    post_template = env.get_template("post.html")
    index_template = env.get_template("index.html")
    archive_template = env.get_template("archive.html")

    # Process markdown files from language subdirectories
    posts = []
    posts_by_slug = defaultdict(dict)  # {slug: {lang: post}}

    for lang in SUPPORTED_LANGUAGES:
        lang_dir = os.path.join(BLOG_ENTRIES_DIR, lang)
        if not os.path.exists(lang_dir):
            print(f"⚠️  Warning: Language directory '{lang}' not found, skipping...")
            continue

        for filename in os.listdir(lang_dir):
            if filename.endswith(".md"):
                filepath = os.path.join(lang_dir, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                    # --- Parse Frontmatter and Markdown ---
                    if content.startswith("---"):
                        parts = content.split("---", 2)
                        frontmatter = yaml.safe_load(parts[1])
                        md_content = parts[2]
                    else:
                        frontmatter = {}
                        md_content = content

                    # --- Convert Markdown to HTML ---
                    html_content = markdown.markdown(md_content, extensions=['fenced_code', 'tables'])

                    # --- Extract slug from filename ---
                    # Format: YYYY-MM-DD-slug-name.md -> slug-name
                    match = re.match(r'\d{4}-\d{2}-\d{2}-(.+)\.md', filename)
                    if match:
                        base_slug = match.group(1)
                    else:
                        # Fallback: use filename without extension
                        base_slug = os.path.splitext(filename)[0]

                    # Create language-specific slug for URL
                    url_slug = f"{base_slug}-{lang}"

                    # --- Create Post Data ---
                    post = {
                        "title": frontmatter.get("title", "Untitled"),
                        "date": frontmatter.get("date", "No Date"),
                        "content": html_content,
                        "slug": url_slug,  # URL slug with language suffix
                        "base_slug": base_slug,  # Base slug for finding translations
                        "lang": lang,
                        "translations": {}  # Will be filled later
                    }
                    posts.append(post)
                    posts_by_slug[base_slug][lang] = post

    # Link translations together
    for base_slug, translations in posts_by_slug.items():
        for lang, post in translations.items():
            # Add links to all other language versions
            for other_lang, other_post in translations.items():
                if other_lang != lang:
                    post["translations"][other_lang] = other_post

    # Sort posts by date (newest first), then by language for consistency
    posts.sort(key=lambda p: (datetime.strptime(p["date"], "%Y-%m-%d"), p["lang"]), reverse=True)

    # Add previous/next post links (within same language)
    posts_by_lang = defaultdict(list)
    for post in posts:
        posts_by_lang[post["lang"]].append(post)

    for lang, lang_posts in posts_by_lang.items():
        for i, post in enumerate(lang_posts):
            if i > 0:
                post["next_post"] = lang_posts[i - 1]
            else:
                post["next_post"] = None

            if i < len(lang_posts) - 1:
                post["previous_post"] = lang_posts[i + 1]
            else:
                post["previous_post"] = None

            # --- Generate Individual Post Page ---
            post_output_path = os.path.join(OUTPUT_DIR, f"{post['slug']}.html")
            with open(post_output_path, "w", encoding="utf-8") as out_f:
                out_f.write(post_template.render(post=post, title=post['title']))

    # --- Generate Index Pages (one per language + unified) ---
    # Unified index (default English)
    if posts:
        # Get newest post in English, fallback to any language
        en_posts = posts_by_lang.get("en", [])
        newest_post = en_posts[0] if en_posts else posts[0]

        index_output_path = os.path.join(OUTPUT_DIR, "index.html")
        with open(index_output_path, "w", encoding="utf-8") as f:
            f.write(index_template.render(post=newest_post, title=newest_post['title']))
    else:
        # Handle case where there are no posts
        index_output_path = os.path.join(OUTPUT_DIR, "index.html")
        with open(index_output_path, "w", encoding="utf-8") as f:
            f.write(index_template.render(title="No Posts Yet", no_posts=True))

    # --- Generate Archive Page (unified, showing all languages) ---
    archive_output_path = os.path.join(OUTPUT_DIR, "archive.html")
    with open(archive_output_path, "w", encoding="utf-8") as f:
        f.write(archive_template.render(posts=posts, title="Archive"))

    # --- Copy Static Files ---
    if os.path.exists(STATIC_DIR):
        shutil.copytree(STATIC_DIR, os.path.join(OUTPUT_DIR, STATIC_DIR))

    print("✅ Blog generated successfully!")
    print(f"   Generated {len(posts)} posts in {len(SUPPORTED_LANGUAGES)} languages")
    for lang in SUPPORTED_LANGUAGES:
        count = len(posts_by_lang.get(lang, []))
        print(f"   - {lang.upper()}: {count} posts")


if __name__ == "__main__":
    main()
