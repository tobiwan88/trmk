# Image to WebP Converter

Automated tool to convert JPG/JPEG images to WebP format and update HTML files with modern `<picture>` elements.

## Features

✅ Converts all JPG/JPEG images to WebP format
✅ Updates HTML files with `<picture>` elements for modern browser support
✅ Maintains JPG fallback for older browsers
✅ Preserves all image attributes (alt, class, loading, etc.)
✅ Comprehensive error handling and reporting
✅ Dry-run mode to preview changes
✅ Detailed conversion statistics

## Requirements

Install Pillow (Python Imaging Library):

```bash
pip install Pillow
```

Or if using pip3:

```bash
pip3 install Pillow
```

## Usage

### Basic Usage

Convert all images in the current directory:

```bash
python3 convert_to_webp.py
```

### Dry Run (Preview Only)

See what would be converted without making changes:

```bash
python3 convert_to_webp.py --dry-run
```

### Custom Quality

Adjust WebP quality (0-100, default is 85):

```bash
python3 convert_to_webp.py --quality 90
```

### Specify Directory

Convert images in a specific directory:

```bash
python3 convert_to_webp.py --dir /path/to/website
```

### Combined Options

```bash
python3 convert_to_webp.py --quality 90 --dry-run
```

## What It Does

### 1. Image Conversion

Finds all `.jpg` and `.jpeg` files (case-insensitive) and converts them to `.webp` format:

- **Original:** `me.jpg` (1.3 MB)
- **Converted:** `me.webp` (~200-300 KB)

The script:
- Preserves original JPG files (needed for fallback)
- Handles RGBA/transparency by converting to RGB with white background
- Uses high-quality WebP encoding (method=6)
- Reports size reduction for each image

### 2. HTML Updates

Converts simple `<img>` tags to modern `<picture>` elements:

**Before:**
```html
<img src="./me.jpg" alt="Photo" class="w3-round" loading="lazy">
```

**After:**
```html
<picture>
  <source type="image/webp" srcset="./me.webp">
  <img src="./me.jpg" alt="Photo" class="w3-round" loading="lazy">
</picture>
```

This provides:
- Modern browsers use WebP (smaller, faster)
- Older browsers fall back to JPG automatically
- All attributes preserved (alt, class, loading, etc.)

### 3. Files Processed

The script automatically processes these HTML files:
- `index.html`
- `cv.html`
- `freelancing.html`

### 4. Excluded Directories

These directories are skipped:
- `node_modules/`
- `.git/`
- `fastTest/`
- `__pycache__/`

## Expected Results

### Size Reduction Examples

Based on typical conversions with quality=85:

| Original File | Original Size | WebP Size | Savings |
|--------------|---------------|-----------|---------|
| me.jpg | 1.3 MB | ~250 KB | ~80% |
| meSideBW.jpg | 365 KB | ~100 KB | ~72% |
| avatar.jpg | 197 KB | ~60 KB | ~70% |
| p1.jpg | 150 KB | ~45 KB | ~70% |

**Total expected savings: 60-80% reduction in image size**

## Command Reference

```bash
# Get help
python3 convert_to_webp.py --help

# Dry run with custom quality
python3 convert_to_webp.py --quality 80 --dry-run

# Actually perform conversion
python3 convert_to_webp.py --quality 85
```

## Output Example

```
======================================================================
Image to WebP Converter
======================================================================
Root directory: /Users/tobias.meyer/Documents/trmk
WebP quality: 85

Step 1: Finding JPG/JPEG images...
Found 15 image(s) to convert

Step 2: Converting images to WebP...
----------------------------------------------------------------------
✓ Converted: me.jpg
  Original: 1.3 MB -> WebP: 245.2 KB (81.2% reduction)
✓ Converted: meSideBW.jpg
  Original: 365.0 KB -> WebP: 98.4 KB (73.0% reduction)
...

Step 3: Updating HTML files...
----------------------------------------------------------------------
✓ Updated index.html: 14 replacements
✓ Updated cv.html: 1 replacements
✓ Updated freelancing.html: 0 replacements

======================================================================
Conversion Summary
======================================================================
✓ Successfully converted: 15 image(s)
  Original total size: 3.2 MB
  WebP total size:     0.9 MB
  Total saved:         2.3 MB (71.8% reduction)

✓ HTML files updated: 2
✓ Total replacements: 15
```

## Safety Features

1. **Non-destructive**: Original JPG files are preserved
2. **Dry-run mode**: Preview changes before applying
3. **Error handling**: Continues even if some conversions fail
4. **Detailed reporting**: See exactly what changed
5. **Rollback**: Original JPGs remain for manual rollback if needed

## Troubleshooting

### "Pillow is not installed"

Install Pillow:
```bash
pip3 install Pillow
```

### "Permission denied"

Make script executable:
```bash
chmod +x convert_to_webp.py
```

### Images not found

Ensure you're running from the website root directory, or use `--dir` option.

### Quality too low/high

Adjust `--quality` parameter:
- **60-70**: Maximum compression, some quality loss
- **80-85**: Balanced (recommended)
- **90-95**: High quality, larger files
- **100**: Lossless (not recommended, large files)

## Browser Support

### WebP Support
- ✅ Chrome 32+
- ✅ Firefox 65+
- ✅ Edge 18+
- ✅ Safari 14+
- ✅ Opera 19+
- ✅ Mobile browsers (iOS 14+, Android 4.4+)

### Fallback for Older Browsers
The `<picture>` element automatically serves JPG to:
- ❌ IE 11 and older
- ❌ Safari 13 and older
- ❌ Older mobile browsers

## Best Practices

1. **Always run dry-run first:**
   ```bash
   python3 convert_to_webp.py --dry-run
   ```

2. **Backup before conversion:**
   ```bash
   git add -A
   git commit -m "Before WebP conversion"
   ```

3. **Test after conversion:**
   - Check all pages in browser
   - Verify images load correctly
   - Test on mobile devices

4. **Recommended quality settings:**
   - Photos: 85 (default)
   - Screenshots: 90
   - Simple graphics: 80

## Integration with Website Modernization

This script complements **Phase 2** of the website modernization plan:

- ✅ Converts JPG to WebP
- ✅ Updates HTML with `<picture>` elements
- ✅ Provides significant performance improvements
- ✅ Maintains backward compatibility

After running this script, your site will have:
- Faster page load times
- Reduced bandwidth usage
- Better Lighthouse scores
- Modern image delivery

## License

This script is provided as-is for the TRMK website modernization project.
