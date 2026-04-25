# Meme Generator

Static meme generator built with Astro 6, Tailwind 4, and daisyUI.

## Features

- bundled meme templates for offline/static use
- local browser-only image uploads
- draggable and resizable text boxes
- Impact-style white text with black outline
- PNG export in the browser
- GitHub Pages deployment workflow

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## GitHub Pages

The included workflow deploys the site from the `main` branch using GitHub Pages.
The Astro config derives the correct `base` path during GitHub Actions builds.
