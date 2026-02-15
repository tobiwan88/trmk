# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **static personal portfolio website** for Tobias R.M.K. Meyer - an Engineering Manager and embedded systems developer. The site is built with vanilla HTML, CSS, and JavaScript with no build process or bundler.

## Architecture

### Core Technology Stack
- **HTML5**: Semantic markup with accessibility features (ARIA attributes, skip links)
- **W3.CSS Framework**: Lightweight CSS framework for responsive design
- **Custom CSS**: `modern-enhancements.css` for modern web features
- **Vanilla JavaScript**: ES6+ without frameworks
- **FontAwesome**: Icon library (self-hosted)
- **Lato Font**: Self-hosted web fonts

### Site Structure

```
Root Pages (all interlinked):
├── index.html         - Main homepage with parallax design, about sections, photo gallery
├── cv.html           - Curriculum vitae with work experience and skills
└── freelancing.html  - Consulting services page
```

### CSS Architecture

**Layered approach:**
1. `w3.css` - Base framework (grid, utilities, components)
2. `lato.css` - Font definitions
3. `css/all.css` - FontAwesome icons
4. `modern-enhancements.css` - Modern features layer

**modern-enhancements.css includes:**
- CSS custom properties (variables) for theming
- Accessibility features (reduced motion, high contrast support)
- Performance optimizations (hardware acceleration)
- Responsive breakpoints (480px, 768px, 1024px)
- Print styles
- Modern animations and transitions

### JavaScript Patterns

All JavaScript is inline in HTML files with these patterns:
- **Modal system**: Click-to-expand image gallery with keyboard support
- **Navbar scroll effect**: Changes on scroll with `requestAnimationFrame` throttling
- **Mobile navigation**: Toggle menu with ARIA state management
- **Lazy loading fallback**: IntersectionObserver for older browsers

## Key Implementation Details

### Parallax Effect
The homepage uses CSS-based parallax scrolling with three background images:
- `.bgimg-1` - Hero section with personal photo
- `.bgimg-2` - Portfolio section transition
- `.bgimg-3` - Contact section background

Parallax is disabled on mobile devices (max-width: 1024px) for performance.

### Accessibility Features
- Skip links for keyboard navigation
- ARIA labels and roles throughout
- Semantic HTML5 elements
- Focus management for modals
- Reduced motion support via CSS media query
- High contrast mode support

### Image Strategy
- **Eager loading**: Hero images and above-fold content
- **Lazy loading**: Portfolio images and below-fold content
- **Responsive images**: All images have `width` attributes and use CSS for responsive sizing

### Navigation Consistency
All three pages share the same navigation structure with active page highlighted using `w3-teal` class.

## Development Workflow

### Making Changes

**To update content:**
- Edit HTML files directly - no build step needed
- Changes are immediately visible on page refresh

**To modify styles:**
- Global changes: Edit `modern-enhancements.css` or `w3.css`
- Page-specific styles: Add to `<style>` block in individual HTML files
- Use CSS custom properties defined in `:root` for consistent theming

**To add images:**
- Place images in appropriate directory (`pictures/` for portfolio, `pictures/me/` for personal)
- Update HTML with proper `alt` text for accessibility
- Use `loading="lazy"` for non-critical images

### Testing

**Cross-browser testing:**
```bash
# Serve locally with any static server
python3 -m http.server 8000
# or
npx serve .
```

**Accessibility testing:**
- Test keyboard navigation (Tab, Enter, Escape keys)
- Test with screen reader
- Validate HTML at validator.w3.org
- Check color contrast

**Responsive testing:**
- Test breakpoints: 480px, 768px, 1024px, 1600px
- Verify parallax disables properly on mobile
- Check mobile navigation toggle

## Deployment

This is a static site requiring no server-side processing (except WordPress blog if integrated separately).

**Deployment options:**
- Any static hosting (Netlify, Vercel, GitHub Pages, AWS S3)
- Traditional web hosting
- CDN with origin server

**Required files for deployment:**
- All HTML files at root
- All CSS files and directories
- All image directories (`pictures/`, fonts, etc.)
- All font files
- SVG/icon assets

**Not required:**
- `.git/` directory
- `fastTest/` directory (appears to be development/testing)
- `.gitignore`

## Important Conventions

### Personal Information
The Impressum (legal disclosure) contains personal address information. Update in:
- `index.html` footer section (lines ~369-401)

### External Links
Always use `target="_blank" rel="noopener noreferrer"` for external links for security.

### Icon Usage
Icons use FontAwesome with `aria-hidden="true"` and accompanying ARIA labels on parent elements.

### CSS Custom Properties
Defined in `modern-enhancements.css`:
```css
--primary-color: #000
--secondary-color: #777
--accent-color: #333
--spacing-[xs|sm|md|lg]
--border-radius
--box-shadow
--transition
```

Use these for consistency when adding new features.

## Content Update Checklist

When updating CV/professional information:
- [ ] Update `cv.html` work experience section
- [ ] Update skills percentages in left sidebar
- [ ] Update job title in header
- [ ] Update meta description
- [ ] Update address in Impressum if moved
- [ ] Keep CV and index.html about section in sync

When adding portfolio photos:
- [ ] Optimize images (compress for web)
- [ ] Add to `pictures/` directory
- [ ] Update `index.html` photo grid section
- [ ] Include descriptive alt text
- [ ] Use `loading="lazy"` attribute

## WordPress Blog Integration

The site links to `./blog` for WordPress integration. If setting up the blog:
- Install WordPress in `blog/` directory
- Configure database connection
- Ensure theme matches main site design
- Update navigation links across all pages
