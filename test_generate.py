import os
import shutil
import unittest
import tempfile
from generate import main

class TestGenerate(unittest.TestCase):

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        os.chdir(self.test_dir)

        # Create dummy directories
        os.makedirs("blog_entries")
        os.makedirs("templates")
        os.makedirs("static")

        # Create dummy files
        with open("blog_entries/2026-02-21-test-post.md", "w") as f:
            f.write("""---
title: Test Post
date: "2026-02-21"
---

This is a test post.""")

        with open("templates/base.html", "w") as f:
            f.write('<!DOCTYPE html><html><head><title>{{ title }}</title><link rel="stylesheet" href="static/style.css"></head><body><header><h1><a href="index.html">Test Blog</a></h1></header><main>{% block content %}{% endblock %}</main></body></html>')

        with open("templates/post.html", "w") as f:
            f.write('{% extends "base.html" %}{% block content %}<article><h2>{{ post.title }}</h2><p>{{ post.date }}</p><div>{{ post.content }}</div></article>{% endblock %}')

        with open("templates/index.html", "w") as f:
            f.write('{% extends "base.html" %}{% block content %}<ul>{% for post in posts %}<li><a href="{{ post.slug }}.html">{{ post.title }}</a></li>{% endfor %}</ul>{% endblock %}')
        
        with open("static/style.css", "w") as f:
            f.write("body { color: red; }")


    def tearDown(self):
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        shutil.rmtree(self.test_dir)

    def test_main(self):
        # Run the generator
        main()

        # Check if output directory and files exist
        self.assertTrue(os.path.exists("public"))
        self.assertTrue(os.path.exists("public/index.html"))
        self.assertTrue(os.path.exists("public/2026-02-21-test-post.html"))
        self.assertTrue(os.path.exists("public/static/style.css"))

        # Check content of index.html
        with open("public/index.html", "r") as f:
            content = f.read()
            self.assertIn("Test Post", content)
            self.assertIn('href="2026-02-21-test-post.html"', content)

        # Check content of post html
        with open("public/2026-02-21-test-post.html", "r") as f:
            content = f.read()
            self.assertIn("<h1><a href=\"index.html\">Test Blog</a></h1>", content)
            self.assertIn("<h2>Test Post</h2>", content)
            self.assertIn("<p>This is a test post.</p>", content)


if __name__ == "__main__":
    unittest.main()
