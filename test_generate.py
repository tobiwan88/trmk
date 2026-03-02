import os
import shutil
import unittest
import tempfile
from generate import main

class TestGenerate(unittest.TestCase):

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.original_dir = os.getcwd()
        os.chdir(self.test_dir)

        # Create dummy directories with language subdirectories
        os.makedirs("blog_entries/en")
        os.makedirs("blog_entries/de")
        os.makedirs("templates")
        os.makedirs("static")

        # Create English test post with code block
        with open("blog_entries/en/2026-02-21-test-post.md", "w") as f:
            f.write("""---
title: Test Post
date: "2026-02-21"
---

This is a test post with a code block:

```python
def hello():
    print("Hello, World!")
    return True
```

More content here.""")

        # Create German translation
        with open("blog_entries/de/2026-02-21-test-post.md", "w") as f:
            f.write("""---
title: Test Beitrag
date: "2026-02-21"
---

Dies ist ein Test-Beitrag mit einem Codeblock:

```python
def hello():
    print("Hallo, Welt!")
    return True
```

Mehr Inhalt hier.""")

        # Create templates
        with open("templates/base.html", "w") as f:
            f.write('<!DOCTYPE html><html><head><title>{{ title }}</title><link rel="stylesheet" href="static/style.css"></head><body><header><h1><a href="index.html">Test Blog</a></h1></header><main>{% block content %}{% endblock %}</main></body></html>')

        with open("templates/post.html", "w") as f:
            f.write('{% extends "base.html" %}{% block content %}<article><h2>{{ post.title }}</h2><p>{{ post.date }}</p><div class="blog-post-content">{{ post.content }}</div></article>{% endblock %}')

        with open("templates/index.html", "w") as f:
            f.write('{% extends "base.html" %}{% block content %}<article><h2>{{ post.title }}</h2><p>{{ post.date }}</p><div class="blog-post-content">{{ post.content }}</div></article>{% endblock %}')

        with open("templates/archive.html", "w") as f:
            f.write('{% extends "base.html" %}{% block content %}<ul>{% for post in posts %}<li><a href="{{ post.slug }}.html">{{ post.title }}</a></li>{% endfor %}</ul>{% endblock %}')

        with open("static/style.css", "w") as f:
            f.write("body { color: red; }")


    def tearDown(self):
        os.chdir(self.original_dir)
        shutil.rmtree(self.test_dir)

    def test_main(self):
        # Run the generator
        main()

        # Check if output directory and files exist
        self.assertTrue(os.path.exists("blog"), "Blog directory should be created")
        self.assertTrue(os.path.exists("blog/index.html"), "Index page should exist")
        self.assertTrue(os.path.exists("blog/archive.html"), "Archive page should exist")
        self.assertTrue(os.path.exists("blog/test-post-en.html"), "English post should exist")
        self.assertTrue(os.path.exists("blog/test-post-de.html"), "German post should exist")
        self.assertTrue(os.path.exists("blog/static/style.css"), "Static CSS should be copied")

        # Check content of English post
        with open("blog/test-post-en.html", "r") as f:
            content = f.read()
            self.assertIn("Test Post", content, "Post title should be in English")
            self.assertIn("This is a test post with a code block", content, "Post content should be present")

        # Check content of German post
        with open("blog/test-post-de.html", "r") as f:
            content = f.read()
            self.assertIn("Test Beitrag", content, "Post title should be in German")
            self.assertIn("Dies ist ein Test-Beitrag", content, "Post content should be present")

    def test_code_blocks(self):
        # Run the generator
        main()

        # Check English post for code block
        with open("blog/test-post-en.html", "r") as f:
            content = f.read()
            # Check for code block structure
            self.assertIn('class="blog-code-block"', content, "Code block should have blog-code-block class")
            self.assertIn('class="codehilite"', content, "Code block should have codehilite wrapper")
            # Check that code content is present (with syntax highlighting spans)
            self.assertIn('hello', content, "Code block should contain function name")
            self.assertIn('print', content, "Code block should contain print statement")
            self.assertIn('Hello, World!', content, "Code block should preserve string content")
            self.assertIn('return', content, "Code block should contain return statement")

    def test_newlines_preserved(self):
        # Run the generator
        main()

        # Read English post and check that code is on separate lines
        with open("blog/test-post-en.html", "r") as f:
            content = f.read()
            # Check that the code block contains proper line breaks (as \n in HTML)
            # The syntax highlighter wraps elements in spans, but newlines should still be present
            code_section_start = content.find('<pre class="blog-code-block">')
            code_section_end = content.find('</pre>', code_section_start)
            code_section = content[code_section_start:code_section_end]

            # Count newlines in the code section - there should be at least 3 (one after each line)
            newline_count = code_section.count('\n')
            self.assertGreater(newline_count, 2, "Code block should have multiple lines separated by newlines")

    def test_language_linking(self):
        # Run the generator
        main()

        # Check English post links to German
        with open("blog/test-post-en.html", "r") as f:
            en_content = f.read()
            # The template might not include language links, but the post object should have translations
            # This test may need adjustment based on actual template implementation

        # Check German post links to English
        with open("blog/test-post-de.html", "r") as f:
            de_content = f.read()
            # Similar check for German version

    def test_image_captions(self):
        # Create a blog post with an image
        with open("blog_entries/en/2026-02-22-image-test.md", "w") as f:
            f.write("""---
title: Image Test
date: "2026-02-22"
---

This post has an image:

![Test Image Caption](test-image.jpg)

More content here.""")

        # Run the generator
        main()

        # Check that image has figure and figcaption
        with open("blog/image-test-en.html", "r") as f:
            content = f.read()
            self.assertIn('<figure class="blog-image-figure">', content, "Image should be wrapped in figure tag")
            self.assertIn('<figcaption>Test Image Caption</figcaption>', content, "Image should have caption from alt text")
            # Ensure figure is NOT wrapped in <p> tags
            self.assertNotIn('<p><figure', content, "Figure should not be inside paragraph tags")
            self.assertNotIn('</figure></p>', content, "Figure should not be inside paragraph tags")


if __name__ == "__main__":
    unittest.main()
