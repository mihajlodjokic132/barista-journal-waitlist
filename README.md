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

## Assets
- Hero image is loaded from `assets/HeroImage.png`.
- Add additional app screenshots to `assets/screenshots/` and replace the placeholder card in the Screens section.

## Notes
- Waitlist submissions are currently stored in browser `localStorage` under `baristaWaitlist`.
- Replace this with a backend endpoint when you are ready to collect real emails.
