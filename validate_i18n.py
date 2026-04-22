#!/usr/bin/env python3
"""Validate that HTML i18n attributes match translations.js default (EN) values."""

import re
import sys
from pathlib import Path
from html.parser import HTMLParser


class I18nExtractor(HTMLParser):
    """Extract data-i18n attributes and their text content from HTML."""

    def __init__(self):
        super().__init__()
        self.entries = []
        self._stack = []
        self._raw_html = ""

    def handle_starttag(self, tag, attrs):
        raw = self.get_starttag_text()
        attr_dict = dict(attrs)
        for attr_name in ("data-i18n", "data-i18n-html", "data-i18n-aria"):
            if attr_name in attr_dict:
                self._stack.append({"tag": tag, "key": attr_dict[attr_name], "attr": attr_name, "text": "", "html": ""})
        if self._stack:
            self._stack[-1]["html"] += raw if raw else f"<{tag}>"

    def handle_endtag(self, tag):
        if self._stack:
            self._stack[-1]["html"] += f"</{tag}>"
        if self._stack and self._stack[-1]["tag"] == tag:
            entry = self._stack.pop()
            self.entries.append(entry)

    def handle_data(self, data):
        if self._stack:
            self._stack[-1]["text"] += data
            self._stack[-1]["html"] += data

    def handle_startendtag(self, tag, attrs):
        raw = self.get_starttag_text()
        if self._stack:
            self._stack[-1]["html"] += raw if raw else f"<{tag} />"


class JSObjectParser:
    """Minimal recursive-descent parser for JS object literals."""

    def __init__(self, text):
        self.text = text
        self.pos = 0
        self.length = len(text)

    def skip_whitespace(self):
        while self.pos < self.length and self.text[self.pos] in " \t\n\r":
            self.pos += 1

    def skip_comments(self):
        while self.pos < self.length:
            if self.pos + 1 < self.length and self.text[self.pos:self.pos+2] == '//':
                while self.pos < self.length and self.text[self.pos] != '\n':
                    self.pos += 1
            elif self.pos + 1 < self.length and self.text[self.pos:self.pos+2] == '/*':
                end = self.text.find('*/', self.pos + 2)
                if end == -1:
                    self.pos = self.length
                else:
                    self.pos = end + 2
            else:
                break
            self.skip_whitespace()

    def parse_string(self):
        quote = self.text[self.pos]
        self.pos += 1
        result = []
        while self.pos < self.length:
            ch = self.text[self.pos]
            if ch == '\\' and self.pos + 1 < self.length:
                self.pos += 1
                escape = self.text[self.pos]
                if escape == 'n':
                    result.append('\n')
                elif escape == 't':
                    result.append('\t')
                elif escape == '"':
                    result.append('"')
                elif escape == "'":
                    result.append("'")
                elif escape == '\\':
                    result.append('\\')
                else:
                    result.append('\\')
                    result.append(escape)
                self.pos += 1
            elif ch == quote:
                self.pos += 1
                break
            else:
                result.append(ch)
                self.pos += 1
        return ''.join(result)

    def parse_identifier(self):
        start = self.pos
        while self.pos < self.length and (self.text[self.pos].isalnum() or self.text[self.pos] in '_$'):
            self.pos += 1
        return self.text[start:self.pos]

    def parse_key(self):
        self.skip_whitespace()
        if self.pos >= self.length:
            return None
        ch = self.text[self.pos]
        if ch in ('"', "'"):
            return self.parse_string()
        elif ch.isalpha() or ch in '_$':
            return self.parse_identifier()
        return None

    def parse_value(self):
        self.skip_whitespace()
        if self.pos >= self.length:
            return None
        ch = self.text[self.pos]
        if ch in ('"', "'"):
            return self.parse_string()
        elif ch == '{':
            return self.parse_object()
        elif ch == '[':
            return self.parse_array()
        elif ch.isdigit() or ch == '-':
            return self.parse_number()
        elif self.text[self.pos:self.pos+4] == 'true':
            self.pos += 4
            return True
        elif self.text[self.pos:self.pos+5] == 'false':
            self.pos += 5
            return False
        elif self.text[self.pos:self.pos+4] == 'null':
            self.pos += 4
            return None
        return None

    def parse_number(self):
        start = self.pos
        if self.text[self.pos] == '-':
            self.pos += 1
        while self.pos < self.length and self.text[self.pos].isdigit():
            self.pos += 1
        if self.pos < self.length and self.text[self.pos] == '.':
            self.pos += 1
            while self.pos < self.length and self.text[self.pos].isdigit():
                self.pos += 1
        return float(self.text[start:self.pos]) if '.' in self.text[start:self.pos] else int(self.text[start:self.pos])

    def parse_array(self):
        self.skip_whitespace()
        if self.pos >= self.length or self.text[self.pos] != '[':
            return []
        self.pos += 1
        result = []
        while True:
            self.skip_whitespace()
            if self.pos >= self.length or self.text[self.pos] == ']':
                self.pos += 1
                break
            value = self.parse_value()
            result.append(value)
            self.skip_whitespace()
            if self.pos < self.length and self.text[self.pos] == ',':
                self.pos += 1
        return result

    def parse_object(self):
        self.skip_whitespace()
        if self.pos >= self.length or self.text[self.pos] != '{':
            return {}
        self.pos += 1
        result = {}
        while True:
            self.skip_whitespace()
            self.skip_comments()
            if self.pos >= self.length or self.text[self.pos] == '}':
                self.pos += 1
                break
            key = self.parse_key()
            if key is None:
                break
            self.skip_whitespace()
            if self.pos < self.length and self.text[self.pos] == ':':
                self.pos += 1
            value = self.parse_value()
            result[key] = value
            self.skip_whitespace()
            if self.pos < self.length and self.text[self.pos] == ',':
                self.pos += 1
        return result


def flatten_dict(obj, prefix=""):
    """Flatten a nested dict into dotted keys."""
    result = {}
    for key, value in obj.items():
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            result.update(flatten_dict(value, full_key))
        elif value is not None:
            result[full_key] = str(value)
    return result


def parse_translations_js(filepath):
    """Parse translations.js and extract EN values as a flat dict."""
    content = filepath.read_text(encoding="utf-8")
    match = re.search(r'const\s+translations\s*=\s*', content)
    if not match:
        raise ValueError("Could not find 'const translations =' in translations.js")
    parser = JSObjectParser(content[match.end():])
    all_translations = parser.parse_object()
    en_data = all_translations.get("en", {})
    return flatten_dict(en_data)


def extract_html_i18n(filepath):
    """Extract all data-i18n entries from an HTML file."""
    content = filepath.read_text(encoding="utf-8")
    parser = I18nExtractor()
    parser.feed(content)
    return parser.entries


def normalize_text(text):
    """Normalize whitespace and HTML entities for comparison."""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"').replace("&#39;", "'")
    return text


def main():
    root = Path(__file__).parent
    translations_file = root / "js" / "translations.js"

    if not translations_file.exists():
        print(f"Error: {translations_file} not found")
        sys.exit(1)

    translations = parse_translations_js(translations_file)

    html_files = list(root.glob("*.html")) + list(root.glob("blog/*.html"))
    all_issues = []

    for html_file in sorted(html_files):
        entries = extract_html_i18n(html_file)
        for entry in entries:
            key = entry["key"]
            attr = entry["attr"]
            if attr == "data-i18n-html":
                raw_html = normalize_text(entry["html"])
                stripped = re.sub(r'^<\w+[^>]*>', '', raw_html)
                stripped = re.sub(r'</\w+>$', '', stripped)
                html_text = normalize_text(stripped)
            else:
                html_text = normalize_text(entry["text"])
            translation_text = normalize_text(translations.get(key, ""))

            if key not in translations:
                all_issues.append(f"  {html_file.name}: key '{key}' not found in translations.js")
            elif html_text != translation_text:
                all_issues.append(f"  {html_file.name}: key '{key}' mismatch\n"
                                  f"    HTML: '{html_text}'\n"
                                  f"    JS:   '{translation_text}'")

    if all_issues:
        print("i18n validation FAILED:\n")
        for issue in all_issues:
            print(issue)
        print(f"\nFound {len(all_issues)} issue(s)")
        sys.exit(1)
    else:
        print("i18n validation passed - all HTML text matches translations.js (EN)")
        sys.exit(0)


if __name__ == "__main__":
    main()
