# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Static personal portfolio website** for Tobias R.M.K. Meyer - Engineering Manager and embedded systems developer. Built with vanilla HTML, CSS, and JavaScript. **No build process, no backend, no database.**

## Architecture

### Technology Stack
- **HTML5** - Semantic markup with ARIA accessibility
- **W3.CSS** - Lightweight responsive framework
- **Vanilla JavaScript (ES6+)** - No frameworks
- **Python 3** - Static blog generator (runs locally, not on server)
- **Jinja2** - Blog templating
- **Markdown** - Blog post format

### Project Structure

```
trmk/
├── index.html              # Homepage (parallax, about, portfolio, contact)
├── cv.html                 # CV (modern single-column card design)
├── freelancing.html        # Consulting services
├── blog/                   # Generated static blog (output)
│   ├── index.html          # Blog homepage
│   ├── archive.html        # All posts
│   └── *-en.html, *-de.html # Individual posts
├── blog_entries/           # Blog source (Markdown)
│   ├── en/                 # English posts
│   │   └── YYYY-MM-DD-slug.md
│   └── de/                 # German posts
│       └── YYYY-MM-DD-slug.md
├── templates/              # Blog templates (Jinja2)
│   ├── base.html           # Base layout with navigation
│   ├── post.html           # Individual post
│   ├── index.html          # Blog home
│   └── archive.html        # Post archive
├── js/
│   ├── i18n.js             # Internationalization engine
│   └── translations.js     # EN/DE translations
├── css/
│   ├── w3.css              # Framework
│   ├── lato.css            # Font definitions
│   └── modern-enhancements.css # Custom styles, CV, blog
├── pictures/               # Images
├── fonts/                  # Self-hosted Lato font
├── generate.py             # Blog generator script
└── requirements.txt        # Python dependencies (Jinja2, Markdown, PyYAML)
```

## CSS Architecture

**Layered CSS:**
1. `w3.css` - Grid, utilities, components
2. `lato.css` - Font-face declarations with `font-display: swap`
3. `css/all.css` - FontAwesome icons
4. `modern-enhancements.css` - Custom features, CV styles, blog styles

**Custom Properties (`:root`):**
```css
--primary-color: #000
--secondary-color: #777
--accent-color: #333
--spacing-xs/sm/md/lg
--border-radius: 0.5rem
--box-shadow: 0 2px 10px rgba(0,0,0,0.1)
--transition: all 0.3s ease
```

**Key Sections in modern-enhancements.css:**
- Core utilities (skip links, focus states, accessibility)
- Mobile navigation (lines ~38-153)
- CV styles (lines ~422-695) - Single-column design
- Blog styles (lines ~696+) - Post content, navigation, archive

## Internationalization (i18n)

### Language System
- Automatic browser language detection (EN/DE)
- User preference stored in `localStorage`
- Language selector in navigation (desktop + mobile)

### Translation Files
**`js/translations.js`** - All UI text in EN/DE:
```javascript
const translations = {
  en: { nav: {...}, blog: {...}, cv: {...} },
  de: { nav: {...}, blog: {...}, cv: {...} }
}
```

**`js/i18n.js`** - Translation engine that:
- Detects browser language (`navigator.language`)
- Updates `<html lang="...">` attribute
- Applies translations via `data-i18n` attributes
- Syncs desktop and mobile language selectors

### Adding Translations
1. Add key to `translations.js` (both en and de)
2. Add `data-i18n="section.key"` to HTML element
3. For placeholders: `data-i18n-placeholder="section.key"`
4. For aria-labels: `data-i18n-aria="section.key"`

## Blog System

### Overview
**Static blog generator** - runs locally, generates HTML files. No server-side processing in production.

### Creating Blog Posts

**1. Write Markdown file:**
```bash
# English post
blog_entries/en/2026-03-15-my-post.md

# German translation (same filename)
blog_entries/de/2026-03-15-my-post.md
```

**2. Add frontmatter:**
```yaml
---
title: "My Blog Post Title"
date: "2026-03-15"
---

Post content in Markdown format...
```

**3. Generate static blog:**
```bash
source "$(pyenv root)/versions/misc/bin/activate"
python3 generate.py
```

### Blog Generator Logic (`generate.py`)

1. Scans `blog_entries/en/` and `blog_entries/de/`
2. Parses YAML frontmatter + Markdown content
3. Extracts slug from filename: `2026-03-15-my-post.md` → `my-post`
4. Creates language-specific URLs: `my-post-en.html`, `my-post-de.html`
5. Links translations together (same slug in different languages)
6. Generates prev/next navigation (within same language)
7. Renders templates with Jinja2
8. Outputs to `blog/` directory

**Output:**
- `blog/*.html` - Individual posts
- `blog/index.html` - Newest post
- `blog/archive.html` - All posts with language badges

### Blog Features
- ✅ Multilingual (EN/DE with auto-linking)
- ✅ Language switcher on posts with translations
- ✅ Language badges in archive
- ✅ Markdown support (headings, lists, code blocks, images)
- ✅ Prev/Next navigation (within language)
- ✅ Same navigation as main site
- ✅ Full i18n support

## Key Implementation Details

### CV Design (cv.html)
**Modern single-column layout** (redesigned Feb 2026):
- Header with photo, name, contact info
- Skill tags (color-coded: advanced/intermediate/beginner)
- Experience cards with date badges
- Education section with thesis titles
- Responsive with dark mode support
- Print-friendly styles

**NO percentage bars** - uses semantic skill tags instead.

### Mobile Navigation
**Simplified approach:**
- Top bar shows ONLY hamburger button on mobile
- All navigation items in dropdown menu
- Language selector in mobile dropdown
- Icons for all menu items

**Hero section on index.html:**
- Desktop: 60vh height (allows seeing About section)
- Mobile: Hidden completely (users see About immediately)

### Parallax Effect (index.html)
- `.bgimg-1` - Hero (60vh on desktop, hidden on mobile)
- `.bgimg-2` - Portfolio transition (50vh)
- `.bgimg-3` - Contact background (50vh)
- Disabled on mobile (<1024px) for performance

### Image Strategy
- **WebP with fallback** - `<picture>` elements for modern formats
- **Lazy loading** - `loading="lazy"` for below-fold images
- **Explicit dimensions** - `width` and `height` attributes to prevent CLS

## Development Workflow

### Local Development
```bash
# Serve site
python3 -m http.server 8000

# Generate blog
source "$(pyenv root)/versions/misc/bin/activate"
python3 generate.py

# Visit http://localhost:8000
```

### Blog Workflow
1. Create/edit `.md` files in `blog_entries/en/` and `blog_entries/de/`
2. Run `python3 generate.py`
3. Preview at `http://localhost:8000/blog/`
4. Commit and deploy `blog/` directory

### Making Changes

**HTML content:**
- Edit HTML files directly (no build step)
- Changes visible on page refresh

**Styles:**
- Global: `modern-enhancements.css`
- Page-specific: `<style>` blocks in HTML
- Use CSS custom properties for consistency

**Translations:**
- Add to `js/translations.js` (both en and de)
- Add `data-i18n` attributes to HTML

**Blog:**
- Edit Markdown in `blog_entries/`
- Re-run `generate.py`

## Important Conventions

### Navigation Links
- Main site pages: `./index.html`, `./cv.html`, `./freelancing.html`
- Blog links: `./blog/index.html` (explicit index.html)
- Blog internal: relative paths (`welcome-en.html`)
- External: Always `target="_blank" rel="noopener noreferrer"`

### File Naming
- Blog posts: `YYYY-MM-DD-slug-name.md`
- Generated posts: `slug-name-en.html`, `slug-name-de.html`
- Images: lowercase with hyphens (`my-image.webp`)

### CSS Classes
- Active navigation: `w3-teal` class
- Language badges: `.language-badge`, `.language-badge-small`
- Skill tags: `.skill-tag.advanced/intermediate/beginner`
- Blog content: `.blog-post-content` (has specific typography)

### Meta Tags
All pages have:
- Open Graph tags
- Twitter Cards
- Canonical URLs
- Favicons (all sizes)
- Language alternates (hreflang)
- Color scheme support

## Testing

**Cross-browser:**
- Chrome, Firefox, Safari (latest)
- Mobile: Safari iOS, Chrome Android

**Responsive breakpoints:**
- 480px, 600px, 768px, 1024px

**Accessibility:**
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader (NVDA/VoiceOver)
- Color contrast (WCAG AA)
- Reduced motion support

**Blog generation:**
- Verify translations link correctly
- Check prev/next navigation
- Test language switcher
- Validate generated HTML

## Deployment

**Static hosting only** - no server-side processing required.

**Deploy:**
1. Generate blog: `python3 generate.py`
2. Upload entire directory to server/CDN
3. Configure HTTPS (via hosting provider)

**Options:**
- GitHub Pages (free)
- Netlify/Vercel (free tier)
- AWS S3 + CloudFront
- Traditional web hosting

**Required files:**
- All `.html` files
- `blog/` directory
- `css/`, `js/`, `pictures/`, `fonts/`
- Favicon files, `manifest.webmanifest`

**NOT required:**
- `blog_entries/` (source files)
- `templates/` (Jinja2 templates)
- `generate.py`, `requirements.txt`
- `.git/`, `fastTest/`

## Security

**Why this site is secure:**
- ✅ No backend code (PHP, Node.js, etc.)
- ✅ No database (no SQL injection)
- ✅ No user input processing
- ✅ Static HTML only
- ✅ Blog generated locally (not on server)
- ✅ No runtime markdown parsing
- ✅ All dependencies self-hosted

## Content Update Checklist

**Updating CV:**
- [ ] Edit `cv.html` experience/education sections
- [ ] Update meta description if job changes
- [ ] Keep index.html about section in sync

**Adding blog post:**
- [ ] Create `.md` in `blog_entries/en/` (and `de/` for translation)
- [ ] Add frontmatter (title, date)
- [ ] Run `python3 generate.py`
- [ ] Preview locally
- [ ] Commit `blog/` directory

**Adding photos:**
- [ ] Optimize images (compress, convert to WebP)
- [ ] Add to `pictures/` directory
- [ ] Update `index.html` photo grid
- [ ] Include descriptive `alt` text
- [ ] Use `loading="lazy"` for below-fold images

## Quick Reference

**Start local server:**
```bash
python3 -m http.server 8000
```

**Generate blog:**
```bash
source "$(pyenv root)/versions/misc/bin/activate"
python3 generate.py
```

**Key files to edit:**
- Content: `index.html`, `cv.html`, `freelancing.html`
- Styles: `modern-enhancements.css`
- Translations: `js/translations.js`
- Blog posts: `blog_entries/en/*.md`, `blog_entries/de/*.md`

**Do NOT edit:**
- `blog/*.html` (auto-generated, will be overwritten)
- `w3.css` (framework file)
- Font files in `fonts/`
