# Future Cash website

The one-page site for Future Cash, the iPhone, iPad and Mac app that shows your bank balance on every day ahead.

Plain HTML, CSS and JavaScript with no build step.

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

The typeface is Sunghyun Sans (SIL Open Font License), served from `fonts/` and trimmed to the scripts the site needs. Scripts it doesn't cover fall back to the system font.
