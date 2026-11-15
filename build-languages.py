#!/usr/bin/env python3
"""Writes a page per language (/de/, /fr/ …) so search engines can find the site in every language.

index.html is the English page. The script translates every data-i18n / data-i18n-aria element from
translations.js into the HTML, sets the language's title, description and tour video, and points
canonical and hreflang links at the language versions. It also rewrites the hreflang block in index.html
and writes sitemap.xml. i18n.js still runs on these pages; it keeps the page's own language.

Run it after changing index.html or translations.js:  python3 build-languages.py
"""
import html, json, pathlib, re
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).parent
SITE = "https://myfuture.cash"
RTL = {"ar", "he", "ur"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


def load_translations():
    text = (ROOT / "translations.js").read_text()
    body = text[text.index("{"): text.rindex("}") + 1]
    return json.loads(body)


class Ranges(HTMLParser):
    """Finds where the inner HTML of each data-i18n element starts and ends."""

    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.lines = [0]
        for line in source.splitlines(keepends=True):
            self.lines.append(self.lines[-1] + len(line))
        self.stack, self.found = [], []
        self.feed(source)

    def abs_pos(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            return
        key = dict(attrs).get("data-i18n")
        self.stack.append((tag, key, self.abs_pos() + len(self.get_starttag_text())))

    def handle_endtag(self, tag):
        while self.stack:
            open_tag, key, start = self.stack.pop()
            if open_tag == tag:
                if key:
                    self.found.append((start, self.abs_pos(), key))
                return


def hreflang_block(langs):
    links = ['  <link rel="alternate" hreflang="en" href="%s/">' % SITE]
    links += ['  <link rel="alternate" hreflang="%s" href="%s/%s/">' % (l, SITE, l) for l in langs]
    links.append('  <link rel="alternate" hreflang="x-default" href="%s/">' % SITE)
    return "<!-- hreflang: written by build-languages.py -->\n" + "\n".join(links) + "\n  <!-- /hreflang -->"


def set_meta(page, attr, name, value):
    pattern = r'(<meta %s="%s" content=")[^"]*(")' % (attr, re.escape(name))
    return re.sub(pattern, lambda m: m.group(1) + html.escape(value, quote=True) + m.group(2), page, count=1)


def translate(source, lang, table):
    page = source
    # Inner HTML of data-i18n elements, from the end backwards so earlier offsets stay valid.
    ranges = sorted(Ranges(source).found, reverse=True)
    outer_start = None
    for start, end, key in ranges:
        if outer_start is not None and end > outer_start:
            continue  # nested inside an element that is already replaced
        if key in table:
            page = page[:start] + table[key] + page[end:]
            outer_start = start
    # aria-labels.
    def aria(m):
        tag = m.group(0)
        key = re.search(r'data-i18n-aria="([^"]+)"', tag).group(1)
        if key not in table:
            return tag
        return re.sub(r'aria-label="[^"]*"', 'aria-label="%s"' % html.escape(table[key], quote=True), tag, count=1)
    page = re.sub(r'<[^>]*data-i18n-aria="[^"]+"[^>]*>', aria, page)

    name = table.get("appName", "Future Cash")
    tagline = table.get("tagline", "See the future of your bank account")
    dir_attr = ' dir="rtl"' if lang in RTL else ""
    page = page.replace('<html lang="en">', '<html lang="%s"%s data-lang="%s">' % (lang, dir_attr, lang), 1)
    page = re.sub(r"<title>[^<]*</title>", "<title>%s – %s</title>" % (html.escape(name), html.escape(tagline)), page, count=1)
    if "metaDescription" in table:
        page = set_meta(page, "name", "description", table["metaDescription"])
    page = set_meta(page, "property", "og:title", name)
    page = set_meta(page, "property", "og:description", tagline)
    page = set_meta(page, "property", "og:url", "%s/%s/" % (SITE, lang))
    page = page.replace('<link rel="canonical" href="%s/">' % SITE, '<link rel="canonical" href="%s/%s/">' % (SITE, lang), 1)
    # The page lives one folder down: make the site's own links and files absolute.
    page = re.sub(r'((?:src|href|poster)=")(?!https?:|//|#|/|mailto:)', r"\1/", page)
    page = page.replace("/images/tour/en.mp4", "/images/tour/%s.mp4" % lang).replace("/images/tour/en.jpg", "/images/tour/%s.jpg" % lang)
    return page


def main():
    tables = load_translations()
    langs = sorted(tables)
    index_path = ROOT / "index.html"
    source = index_path.read_text()
    block = hreflang_block(langs)
    if "<!-- hreflang:" in source:
        source = re.sub(r"<!-- hreflang:.*?<!-- /hreflang -->", lambda m: block, source, count=1, flags=re.S)
    else:
        source = source.replace('  <link rel="canonical"', "  " + block + '\n  <link rel="canonical"', 1)
    index_path.write_text(source)

    for lang in langs:
        out = ROOT / lang / "index.html"
        out.parent.mkdir(exist_ok=True)
        out.write_text(translate(source, lang, tables[lang]))

    urls = [("", "en")] + [(l + "/", l) for l in langs]
    alternates = "".join('\n    <xhtml:link rel="alternate" hreflang="%s" href="%s/%s"/>' % (l, SITE, p) for p, l in urls)
    alternates += '\n    <xhtml:link rel="alternate" hreflang="x-default" href="%s/"/>' % SITE
    entries = "".join("\n  <url>\n    <loc>%s/%s</loc>%s\n  </url>" % (SITE, p, alternates) for p, _ in urls)
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
        + entries + "\n</urlset>\n")
    print("wrote %d language pages and sitemap.xml" % len(langs))


if __name__ == "__main__":
    main()
