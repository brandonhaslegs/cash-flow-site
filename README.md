# Future Cash website

The one-page site for Future Cash, the iPhone, iPad and Mac app that shows your bank balance on every day ahead.

Plain HTML, CSS and JavaScript. The only build step writes the language pages:

```bash
python3 build-languages.py
```

Run it after changing `index.html` or `translations.js`. It writes `/de/`, `/fr/` … (one static page per language, so search engines index every language), the hreflang links in `index.html`, and `sitemap.xml`. Don't edit the language folders by hand.

## Preview

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Files

- `index.html` – the page
- `styles.css` – styles, light and dark
- `script.js` – the “Can I afford it?” demo, which runs the app's forecast rule on an example plan starting today
- `images/` – app screenshots (example data), light and dark versions

SF Rounded comes from the visitor's Apple device (it can't be hosted); Inter from Google Fonts stands in everywhere else.
