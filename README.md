# Barista Journal Waitlist Landing Page

Dark-mode landing page for the Barista Journal iOS app with a waitlist signup form.

## Stack
- Vite
- HTML + CSS + JavaScript

## Local Development
```bash
npm install
npm run dev
```

Then open the local URL shown in terminal.

## Build
```bash
npm run build
npm run preview
```

## Deploy (GitHub Pages)
- A GitHub Actions workflow is included at .github/workflows/deploy-pages.yml.
- In GitHub repository settings, set Pages source to GitHub Actions.
- Every push to main builds and deploys automatically.

## Assets
- Hero image is loaded from assets/HeroImage.png.
- App screenshots are loaded from assets/screenshots/ (screen-01.png through screen-08.png in the gallery section).

## Notes
- Waitlist submissions are currently stored in browser `localStorage` under `baristaWaitlist`.
- Replace this with a backend endpoint when you are ready to collect real emails.
