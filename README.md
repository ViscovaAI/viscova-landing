# VISCOVA Technologies — landing page

Static landing page for VISCOVA Technologies Private Limited. Plain HTML, CSS and JavaScript — no build step.

## Run locally

```bash
python -m http.server 4321
```

Then open http://localhost:4321. Opening `index.html` directly in a browser also works.

## Files

- `index.html` — page markup, including the inline SVG logo mark and wordmark
- `tokens.css` — design tokens: colours (from the brochure palette), type, spacing, motion
- `styles.css` — layout and components
- `main.js` — GSAP + ScrollTrigger animations, Lenis smooth scroll, form behaviour
- `assets/viscova-logo.webp` — original logo reference

## Still to fill in

- Team portraits and bios (look for `TODO` comments in `index.html`)
- Free scan and one-click deploy are placeholders until the features ship
- The consultation form opens a pre-filled email to hello@viscova.dev — there is no backend yet
