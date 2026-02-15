# trmk.de - Personal Website

Personal homepage and blog of Tobias R.M.K. Meyer - Engineering Manager & Embedded Software Developer.

🌐 **Live Site:** [www.trmk.de](https://www.trmk.de)

## Overview

This is a **100% static website** with no backend scripts, no databases, and no server-side processing. All pages are pre-generated HTML/CSS/JavaScript files, making the site fast, secure, and easy to host.

### Key Features

- ✅ **Static HTML/CSS/JavaScript** - No backend, no potential security risks
- ✅ **Multilingual** - English/German support with automatic browser detection
- ✅ **Responsive Design** - Mobile-first, works on all devices
- ✅ **PWA-ready** - Progressive Web App with offline support
- ✅ **SEO Optimized** - Open Graph, Twitter Cards, Schema.org markup
- ✅ **Accessible** - ARIA labels, semantic HTML, skip links
- ✅ **Dark Mode** - Automatic based on system preference
- ✅ **Static Blog Generator** - Python script generates blog posts from Markdown

## Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **W3.CSS** - Lightweight CSS framework
- **JavaScript (ES6+)** - Vanilla JS for interactivity and i18n
- **FontAwesome** - Icon library
- **Lato Font** - Typography

### Blog Generator
- **Python 3** - Static site generator
- **Jinja2** - Template engine
- **Markdown** - Blog post format
- **PyYAML** - Frontmatter parsing

### No Backend
- ❌ No server-side scripts (PHP, Node.js, etc.)
- ❌ No databases
- ❌ No user authentication
- ❌ No form processing on the server
- ✅ Pure static files served via CDN/web server

## Project Structure

```
trmk/
├── index.html              # Homepage
├── cv.html                 # Curriculum Vitae
├── freelancing.html        # Consulting services page
├── blog/                   # Generated blog (static HTML)
│   ├── index.html
│   ├── archive.html
│   └── *.html              # Individual blog posts
├── blog_entries/           # Blog source files (Markdown)
│   ├── en/                 # English posts
│   │   └── YYYY-MM-DD-slug.md
│   └── de/                 # German posts
│       └── YYYY-MM-DD-slug.md
├── templates/              # Jinja2 templates for blog
│   ├── base.html
│   ├── post.html
│   ├── index.html
│   └── archive.html
├── js/                     # JavaScript
│   ├── i18n.js             # Internationalization
│   └── translations.js     # EN/DE translations
├── css/                    # Stylesheets
│   ├── w3.css
│   ├── lato.css
│   └── modern-enhancements.css
├── pictures/               # Images
├── fonts/                  # Web fonts
└── generate.py             # Blog generator script
```

## Blog System

### Overview

The blog is generated using a Python script (`generate.py`) that converts Markdown files into static HTML pages. **No dynamic server-side processing** - all blog pages are pre-generated.

### Creating a New Blog Post

1. **Create Markdown file** in the appropriate language directory:

   **English post:**
   ```bash
   blog_entries/en/2026-03-15-my-new-post.md
   ```

   **German post:**
   ```bash
   blog_entries/de/2026-03-15-my-new-post.md
   ```

2. **Write content** with YAML frontmatter:

   ```markdown
   ---
   title: "My New Blog Post"
   date: "2026-03-15"
   ---

   Your post content here in Markdown format.

   ## Heading

   - List item 1
   - List item 2

   **Bold text** and *italic text*.
   ```

3. **Generate static blog:**

   ```bash
   # Activate virtual environment
   source "$(pyenv root)/versions/misc/bin/activate"

   # Generate blog
   python3 generate.py
   ```

4. **Deploy** - Upload the `blog/` directory to your web server

### Multilingual Posts

To create translations, use the **same filename** in both language directories:

```
blog_entries/
├── en/2026-03-15-my-post.md    # English version
└── de/2026-03-15-my-post.md    # German version
```

The generator automatically:
- Detects translations by matching filenames
- Creates language-specific URLs (`my-post-en.html`, `my-post-de.html`)
- Adds language switcher to posts with translations
- Shows language badges in archive listing

### Blog Generator Details

**What it does:**
1. Scans `blog_entries/en/` and `blog_entries/de/` for Markdown files
2. Parses YAML frontmatter (title, date)
3. Converts Markdown to HTML
4. Applies templates (base.html, post.html, archive.html)
5. Generates static HTML files in `blog/` directory
6. Links translations together
7. Creates index and archive pages

**Security:**
- ✅ Runs locally on your machine (not on server)
- ✅ Generates static HTML (no runtime code execution)
- ✅ No user input processing
- ✅ No database queries
- ✅ No potential for injection attacks
- ✅ Safe to deploy anywhere

## Development

### Prerequisites

```bash
# Python 3.x with pyenv
pyenv install 3.12.0
pyenv virtualenv 3.12.0 misc
pyenv activate misc

# Install dependencies
pip install -r requirements.txt
```

### Local Development

```bash
# Serve locally (any static server works)
python3 -m http.server 8000
# or
npx serve .

# Visit: http://localhost:8000
```

### Blog Workflow

```bash
# 1. Edit blog posts
vim blog_entries/en/2026-03-15-new-post.md
vim blog_entries/de/2026-03-15-new-post.md

# 2. Generate blog
python3 generate.py

# 3. Preview locally
python3 -m http.server 8000

# 4. Deploy (upload to server/CDN)
# - Upload entire directory to web server
# - Or use git push to GitHub Pages
# - Or deploy to Netlify/Vercel
```

## Deployment

### Static Hosting Options

This site can be hosted on **any static web server**:

- ✅ **GitHub Pages** - Free hosting for static sites
- ✅ **Netlify** - Free tier with automatic deploys
- ✅ **Vercel** - Fast CDN with serverless edge
- ✅ **AWS S3 + CloudFront** - Scalable cloud hosting
- ✅ **Traditional web hosting** - Any Apache/Nginx server
- ✅ **Cloudflare Pages** - Free with global CDN

### Example: Deploy to GitHub Pages

```bash
# Ensure blog is generated
python3 generate.py

# Commit and push
git add .
git commit -m "Update blog"
git push origin main

# GitHub Pages will automatically serve the site
```

## Security

### Why This Site Is Secure

1. **No Backend Code**
   - No PHP, Python, Node.js, or other server-side scripts in production
   - No code execution on the server
   - No attack surface for remote code execution

2. **No Database**
   - No SQL injection possible
   - No database credentials to leak
   - No sensitive data stored server-side

3. **No User Input**
   - No forms that process data server-side
   - No authentication system to compromise
   - No session management

4. **Static Files Only**
   - HTML, CSS, JavaScript, images
   - Served directly by web server/CDN
   - Same files everyone receives

5. **Build-Time Generation**
   - Blog posts generated locally, not on server
   - Content reviewed before deployment
   - No runtime markdown parsing

6. **No Third-Party Dependencies in Production**
   - All JavaScript is self-hosted (i18n.js, translations.js)
   - Fonts are self-hosted
   - No CDN dependencies that could be compromised

### Best Practices Applied

- ✅ HTTPS enforced (via server/CDN configuration)
- ✅ Content Security Policy headers (configured on server)
- ✅ No inline scripts (all JS in separate files)
- ✅ ARIA labels for accessibility
- ✅ Regular dependency updates (Python packages for generator)

## Internationalization (i18n)

### Automatic Language Detection

The site automatically detects the user's browser language and shows content in English or German.

**Priority:**
1. User's explicit choice (stored in `localStorage`)
2. Browser language setting (`navigator.language`)
3. Default: English

### Adding Translations

All translations are in `js/translations.js`:

```javascript
const translations = {
  en: {
    nav: { about: "ABOUT", ... },
    blog: { publishedOn: "Published on", ... }
  },
  de: {
    nav: { about: "ÜBER MICH", ... },
    blog: { publishedOn: "Veröffentlicht am", ... }
  }
};
```

HTML elements use `data-i18n` attributes:

```html
<span data-i18n="nav.about">ABOUT</span>
```

## License

© 2026 Tobias R.M.K. Meyer. All rights reserved.

This is a personal website. The code structure and generator scripts are available for reference, but please do not copy content or design wholesale.

## Contact

- **Website:** [www.trmk.de](https://www.trmk.de)
- **Email:** tobias.meyer@trmk.de
- **LinkedIn:** [linkedin.com/in/tobias-meyer-07413656](https://de.linkedin.com/in/tobias-meyer-07413656)
- **GitHub:** [github.com/tobiwan88](https://github.com/tobiwan88)

---

**Built with ❤️ using static HTML, CSS, and JavaScript. No frameworks, no backend, no bloat.**
