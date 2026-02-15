#!/usr/bin/env python3
"""
Image to WebP Converter with HTML Updater
==========================================

This script converts JPG/JPEG images to WebP format and updates HTML files
to use <picture> elements with WebP sources and JPG fallbacks.

Requirements:
    pip install Pillow

Usage:
    python convert_to_webp.py [--quality 85] [--dry-run]

Options:
    --quality    WebP quality (0-100, default: 85)
    --dry-run    Show what would be done without making changes
    --help       Show this help message
"""

import os
import sys
import re
import argparse
from pathlib import Path
from typing import List, Tuple
from dataclasses import dataclass

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is not installed.")
    print("Install it with: pip install Pillow")
    sys.exit(1)


@dataclass
class ConversionResult:
    """Store conversion results for reporting."""
    original_path: str
    webp_path: str
    original_size: int
    webp_size: int
    success: bool
    error: str = ""

    @property
    def size_reduction(self) -> float:
        """Calculate size reduction percentage."""
        if self.original_size == 0:
            return 0
        return ((self.original_size - self.webp_size) / self.original_size) * 100


class ImageToWebPConverter:
    """Convert images to WebP and update HTML references."""

    # Image extensions to convert
    IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.JPG', '.JPEG'}

    # Directories to exclude from conversion
    EXCLUDE_DIRS = {'node_modules', '.git', 'fastTest', '__pycache__'}

    # HTML files to update
    HTML_FILES = ['index.html', 'cv.html', 'freelancing.html']

    def __init__(self, root_dir: str, quality: int = 85, dry_run: bool = False):
        """
        Initialize the converter.

        Args:
            root_dir: Root directory containing images and HTML files
            quality: WebP quality (0-100)
            dry_run: If True, don't make actual changes
        """
        self.root_dir = Path(root_dir)
        self.quality = quality
        self.dry_run = dry_run
        self.results: List[ConversionResult] = []

    def find_images(self) -> List[Path]:
        """
        Find all JPG/JPEG images in the directory tree.

        Returns:
            List of image file paths
        """
        images = []
        for ext in self.IMAGE_EXTENSIONS:
            for img_path in self.root_dir.rglob(f'*{ext}'):
                # Skip excluded directories
                if any(excluded in img_path.parts for excluded in self.EXCLUDE_DIRS):
                    continue
                images.append(img_path)

        return sorted(images)

    def convert_image_to_webp(self, img_path: Path) -> ConversionResult:
        """
        Convert a single image to WebP format.

        Args:
            img_path: Path to the image file

        Returns:
            ConversionResult with conversion details
        """
        webp_path = img_path.with_suffix('.webp')
        original_size = img_path.stat().st_size

        try:
            if self.dry_run:
                print(f"[DRY RUN] Would convert: {img_path.relative_to(self.root_dir)} -> {webp_path.name}")
                return ConversionResult(
                    original_path=str(img_path),
                    webp_path=str(webp_path),
                    original_size=original_size,
                    webp_size=0,
                    success=True
                )

            # Open and convert image
            with Image.open(img_path) as img:
                # Convert RGBA to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = background

                # Save as WebP
                img.save(
                    webp_path,
                    'WEBP',
                    quality=self.quality,
                    method=6  # Higher quality encoding
                )

            webp_size = webp_path.stat().st_size

            result = ConversionResult(
                original_path=str(img_path),
                webp_path=str(webp_path),
                original_size=original_size,
                webp_size=webp_size,
                success=True
            )

            print(f"✓ Converted: {img_path.relative_to(self.root_dir)}")
            print(f"  Original: {self._format_size(original_size)} -> WebP: {self._format_size(webp_size)} "
                  f"({result.size_reduction:.1f}% reduction)")

            return result

        except Exception as e:
            print(f"✗ Failed to convert {img_path.relative_to(self.root_dir)}: {e}")
            return ConversionResult(
                original_path=str(img_path),
                webp_path=str(webp_path),
                original_size=original_size,
                webp_size=0,
                success=False,
                error=str(e)
            )

    def update_html_files(self) -> Tuple[int, int]:
        """
        Update HTML files to use <picture> elements with WebP sources.

        Returns:
            Tuple of (files_updated, replacements_made)
        """
        files_updated = 0
        total_replacements = 0

        for html_file in self.HTML_FILES:
            html_path = self.root_dir / html_file

            if not html_path.exists():
                print(f"⚠ HTML file not found: {html_file}")
                continue

            with open(html_path, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content
            replacements = 0

            # Pattern to match <img> tags with jpg/jpeg sources
            # Captures: src, alt, other attributes
            img_pattern = re.compile(
                r'<img\s+([^>]*?)src=["\'](\.?/?)([^"\']+\.(jpg|jpeg|JPG|JPEG))["\'](.*?)>',
                re.IGNORECASE | re.DOTALL
            )

            def replace_img_with_picture(match):
                """Replace img tag with picture element."""
                nonlocal replacements

                before_src = match.group(1)  # Attributes before src
                path_prefix = match.group(2)  # ./ or / or empty
                img_path = match.group(3)     # Path to image (with extension)
                extension = match.group(4)    # jpg/jpeg/JPG/JPEG
                after_src = match.group(5)    # Attributes after src

                # Create WebP path
                webp_path = img_path.rsplit('.', 1)[0] + '.webp'

                # Combine all attributes
                all_attrs = (before_src + after_src).strip()

                # Extract specific attributes for better formatting
                alt_match = re.search(r'alt=(["\'])([^"\']*)\1', all_attrs)
                alt_attr = alt_match.group(0) if alt_match else 'alt=""'

                # Remove alt from all_attrs to avoid duplication
                remaining_attrs = re.sub(r'\s*alt=(["\'])[^"\']*\1\s*', ' ', all_attrs).strip()

                # Build picture element
                picture = f'''<picture>
      <source type="image/webp" srcset="{path_prefix}{webp_path}">
      <img src="{path_prefix}{img_path}" {alt_attr} {remaining_attrs}>
    </picture>'''

                replacements += 1
                return picture

            # Replace img tags with picture elements
            content = img_pattern.sub(replace_img_with_picture, content)

            if replacements > 0:
                if self.dry_run:
                    print(f"[DRY RUN] Would update {html_file}: {replacements} replacements")
                else:
                    with open(html_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"✓ Updated {html_file}: {replacements} replacements")

                files_updated += 1
                total_replacements += replacements
            else:
                print(f"  No changes needed in {html_file}")

        return files_updated, total_replacements

    def convert_all(self) -> None:
        """Execute the full conversion process."""
        print("=" * 70)
        print("Image to WebP Converter")
        print("=" * 70)
        print(f"Root directory: {self.root_dir}")
        print(f"WebP quality: {self.quality}")
        if self.dry_run:
            print("DRY RUN MODE - No files will be modified")
        print()

        # Step 1: Find images
        print("Step 1: Finding JPG/JPEG images...")
        images = self.find_images()
        print(f"Found {len(images)} image(s) to convert\n")

        if not images:
            print("No images found. Exiting.")
            return

        # Step 2: Convert images
        print("Step 2: Converting images to WebP...")
        print("-" * 70)

        for img_path in images:
            result = self.convert_image_to_webp(img_path)
            self.results.append(result)

        print()

        # Step 3: Update HTML files
        print("Step 3: Updating HTML files...")
        print("-" * 70)
        files_updated, replacements = self.update_html_files()
        print()

        # Step 4: Summary
        self.print_summary(files_updated, replacements)

    def print_summary(self, files_updated: int, replacements: int) -> None:
        """Print conversion summary."""
        successful = [r for r in self.results if r.success]
        failed = [r for r in self.results if not r.success]

        print("=" * 70)
        print("Conversion Summary")
        print("=" * 70)

        if successful:
            total_original = sum(r.original_size for r in successful)
            total_webp = sum(r.webp_size for r in successful)
            total_saved = total_original - total_webp
            avg_reduction = (total_saved / total_original * 100) if total_original > 0 else 0

            print(f"✓ Successfully converted: {len(successful)} image(s)")
            if not self.dry_run:
                print(f"  Original total size: {self._format_size(total_original)}")
                print(f"  WebP total size:     {self._format_size(total_webp)}")
                print(f"  Total saved:         {self._format_size(total_saved)} ({avg_reduction:.1f}% reduction)")

        if failed:
            print(f"✗ Failed conversions: {len(failed)} image(s)")
            for result in failed:
                print(f"  - {result.original_path}: {result.error}")

        print(f"\n✓ HTML files updated: {files_updated}")
        print(f"✓ Total replacements: {replacements}")

        if self.dry_run:
            print("\n⚠ DRY RUN completed - No actual changes were made")
            print("Run without --dry-run to perform the conversion")

    @staticmethod
    def _format_size(size_bytes: int) -> str:
        """Format byte size to human-readable format."""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Convert JPG/JPEG images to WebP and update HTML files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        '--quality',
        type=int,
        default=85,
        help='WebP quality (0-100, default: 85)'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be done without making changes'
    )

    parser.add_argument(
        '--dir',
        type=str,
        default='.',
        help='Root directory (default: current directory)'
    )

    args = parser.parse_args()

    # Validate quality
    if not 0 <= args.quality <= 100:
        print("Error: Quality must be between 0 and 100")
        sys.exit(1)

    # Check if directory exists
    root_dir = Path(args.dir).resolve()
    if not root_dir.exists():
        print(f"Error: Directory not found: {root_dir}")
        sys.exit(1)

    # Run conversion
    converter = ImageToWebPConverter(
        root_dir=str(root_dir),
        quality=args.quality,
        dry_run=args.dry_run
    )

    try:
        converter.convert_all()
    except KeyboardInterrupt:
        print("\n\nConversion interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nError during conversion: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
