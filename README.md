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
- App screenshots are auto-loaded from assets/screenshots/ in filename order.
- No HTML edits are needed when adding or removing screenshot files.

## Real Waitlist (Supabase)
1. Create a Supabase account and new project.
2. In Supabase SQL Editor, run the script in supabase/waitlist.sql.
3. In this project, create a local .env file based on .env.example.
4. Fill:
	- VITE_SUPABASE_URL
	- VITE_SUPABASE_ANON_KEY
5. Run the site:
	- npm install
	- npm run dev

The waitlist form will then insert rows into the public.waitlist table.

## Production env vars (Vercel)
Add the same two variables in Vercel Project Settings -> Environment Variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
