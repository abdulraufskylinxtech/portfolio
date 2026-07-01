# Shakeel Latif — Portfolio

Modern multilingual portfolio built with **Next.js 15**, **next-intl**, and **Tailwind CSS**. All content lives in JSON files — no Supabase, no paid database.

## Languages

- English (`/en`)
- Arabic (`/ar`) — RTL layout
- German (`/de`)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/en`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |

## Updating Content

### Option 1 — Admin CMS (recommended)

1. Set `ADMIN_PASSWORD` in `.env` (see `.env.example`)
2. Open **`/my-admin-section`** in your browser
3. Sign in and edit site info, projects, blog, or contact inbox
4. Save and refresh the public site

**Local dev:** saves directly to `data/*.json` on disk.

**Vercel / free serverless:** set GitHub env vars (below) so saves commit to your repo via the GitHub API.

### Option 2 — Edit files directly

| File | Content |
|------|---------|
| `data/projects.json` | Portfolio projects |
| `data/blog-posts.json` | Blog posts (markdown) |
| `data/site.json` | Contact info, bio, skills, experience, education, hobbies, about photos |
| `data/contact-submissions.json` | Contact form inbox (auto-appended) |

## Free deployment (Vercel + custom domain)

This stack is designed to stay **free forever** — no backend database, no VPS required.

1. Push the repo to GitHub
2. Import the project on [Vercel](https://vercel.com) (free tier)
3. Add environment variables in Vercel → Settings → Environment Variables:

| Variable | Purpose |
|----------|---------|
| `ADMIN_PASSWORD` | CMS login at `/my-admin-section` |
| `NEXT_PUBLIC_SITE_URL` | Your custom domain, e.g. `https://shakeellatif.com` |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Contact form email via Gmail SMTP |
| `GITHUB_TOKEN` | PAT with **Contents: Read and write** on this repo |
| `GITHUB_OWNER` | Your GitHub username |
| `GITHUB_REPO` | Repository name |
| `GITHUB_BRANCH` | Optional, defaults to `main` |

4. Attach your custom domain in Vercel → Domains (free on hobby plan)
5. Redeploy after adding env vars

### How persistence works on Vercel

Serverless hosts have **no writable disk**. This project handles that automatically:

- **Reads:** from GitHub when `GITHUB_*` is set on Vercel; otherwise bundled files from the last deploy
- **Writes:** admin CMS saves and contact form records commit to `data/*.json` in your GitHub repo via the [Contents API](https://docs.github.com/en/rest/repos/contents)

You never lose a contact message: it is saved to JSON first, then emailed.

### GitHub token setup

1. GitHub → Settings → Developer settings → Personal access tokens
2. Create a fine-grained token scoped to this repository
3. Grant **Contents: Read and write**
4. Add as `GITHUB_TOKEN` in Vercel (and locally if you want GitHub mode in preview)

## Contact form

Submissions are **saved to JSON first** (`data/contact-submissions.json`), then emailed via **Gmail SMTP (Nodemailer)** from a server API route — credentials stay in env only.

View messages in admin → **Contact inbox** or your Gmail inbox.

### Gmail setup

1. Use a Gmail account (dedicated portfolio inbox recommended)
2. Enable **2-Step Verification** on the Google account
3. Google Account → **Security** → **App passwords** → create one for "Mail"
4. Add to `.env` / Vercel env:
   - `GMAIL_USER=you@gmail.com`
   - `GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx`
5. Optional: `CONTACT_TO_EMAIL` if inbox differs from `data/site.json` email

Reply-to is set to the visitor's email so you can reply directly from Gmail.

## Environment Variables

Copy `.env.example` to `.env`:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
ADMIN_PASSWORD=your-strong-password
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=your-app-password
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=your-username
GITHUB_REPO=shakeel-ai-folio
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URL for metadata |
| `ADMIN_PASSWORD` | For CMS | Password for `/my-admin-section` |
| `ADMIN_SECRET` | Optional | Cookie signing secret (defaults to `ADMIN_PASSWORD`) |
| `GMAIL_USER` | Contact email | Gmail address used to send |
| `GMAIL_APP_PASSWORD` | Contact email | Google App Password (not your login password) |
| `CONTACT_TO_EMAIL` | Optional | Inbox override (defaults to `site.json` email) |
| `GITHUB_*` | Vercel saves | Persist JSON via GitHub API on serverless |

## Project Structure

```
data/                       # Static content (projects, blog, site info, contact inbox)
src/
├── app/[locale]/           # Localized public routes
├── app/api/contact/        # Contact form (JSON + email)
├── app/my-admin-section/   # Content CMS
├── components/
│   ├── layout/             # Navbar, footer, language switcher
│   ├── sections/           # Hero, projects, skills, about, contact
│   └── pages/              # Blog page components
├── i18n/                   # next-intl routing & navigation
└── messages/               # en.json, ar.json, de.json
```

## Features

- Multilingual portfolio (EN / AR / DE)
- JSON-driven projects and blog
- Admin CMS with contact inbox
- Contact form (JSON backup + Gmail)
- Time-aware hero sun/moon and starfield
- Dark/light theme toggle
- AI chat widget (optional — configure separately)
