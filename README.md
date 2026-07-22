# Dynamic AI Portfolio

A responsive, multilingual developer portfolio and JSON-powered CMS built with **Next.js 15**, **React 18**, **TypeScript**, **next-intl**, **Tailwind CSS**, and optional AI services.

The public identity is controlled from the admin CMS: changing the **Full name** updates the navbar, hero, footer, metadata, contact messages, and AI assistant across every language.

## Highlights

- Fully responsive public site and admin CMS
- Dynamic profile name, role, bio, contact details, CV, photos, and optional 3D model
- Projects, skills, experience, education, hobbies, blog, and contact inbox
- Complete **184-language ISO 639-1 catalog**
- Searchable language picker with flag/language icons
- RTL support for Arabic, Urdu, Persian, Hebrew, and other RTL languages
- AI-generated UI and portfolio translations with incremental saving
- Groq/OpenAI rate-limit retry handling for bulk translations
- Calendar-based experience start/end months
- Automatic experience period and duration calculation
- AI portfolio chat constrained to portfolio information
- Gmail contact notifications with JSON backup
- Local JSON persistence or GitHub-backed persistence on Vercel
- Light/dark theme, animated hero atmosphere, and accessible reduced-motion handling

## Requirements

- Node.js 20 or newer recommended
- npm
- Optional Groq or OpenAI API key for AI chat and translations
- Optional Gmail App Password for contact email delivery
- Optional GitHub token for persistent CMS saves on Vercel

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The middleware redirects visitors to the configured default locale.

Create a `.env` file in the project root and add only the services you need:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

ADMIN_PASSWORD=replace-with-a-strong-password
ADMIN_SECRET=replace-with-a-long-random-secret

# Choose Groq or OpenAI. Groq is used first when both are present.
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Optional contact email
GMAIL_USER=
GMAIL_APP_PASSWORD=
CONTACT_TO_EMAIL=

# Required for persistent CMS saves on Vercel
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
GITHUB_BRANCH=main
```

Never commit real passwords, API keys, Gmail App Passwords, or GitHub tokens.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run dev:turbo` | Start development with Turbopack |
| `npm run build` | Create and type-check the production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint across the project |

## Admin CMS

1. Set `ADMIN_PASSWORD` in `.env`.
2. Start the application.
3. Open `/my-admin-section`.
4. Sign in and edit the required section.
5. Click **Save changes** before leaving the tab.

The CMS manages:

- Profile name and optional separate Arabic display name
- Role, bio, rotating hero titles, location, and availability
- Email, phone, WhatsApp, LinkedIn, GitHub, and Instagram
- Profile image, about photos, optional `.glb` profile model, and CV
- Stats and grouped skills
- Experience, education, and hobbies
- Projects and project galleries
- Blog posts
- Enabled languages and AI translations
- Contact submissions and AI chat sessions

### Experience Dates

Experience entries use **Start month** and **End month** calendar controls.

- Enable **I currently work here** for an active role.
- The public period is generated automatically, for example `June 2024 — Present`.
- Duration is calculated automatically, for example `1 year 3 months`.
- Future months are blocked.
- End month cannot be earlier than the selected start month.
- Existing legacy period text remains visible until calendar dates are selected.

## Languages and AI Translation

The CMS exposes the complete **184-code ISO 639-1 language catalog**. Only languages added to the site appear in the public language switcher.

### Add a Language

1. Open **Admin → Site → Languages**.
2. Search by language name, native name, or ISO code.
3. Select the language and click **Add language**.
4. Click **Save changes**.
5. Click **Generate AI** for that language.

Translation generation includes:

- Navigation, buttons, headings, forms, and other UI labels
- Hero, role, bio, availability, location, stats, and hobbies
- Experience roles, periods, locations, and every bullet point
- Education degrees and institutions
- Project titles, descriptions, APIs, and highlights
- Complete blog titles, excerpts, and Markdown content
- Animated code-ring labels

The admin-controlled **Full name** is injected dynamically and is not replaced by stale translated names. A separate Arabic name is used only when its admin toggle is enabled.

### Bulk Translation and Rate Limits

**Generate AI for all enabled languages** processes languages one at a time and saves each completed language immediately. Groq/OpenAI `429` responses are retried automatically using the provider retry delay.

Bulk translation can take several minutes on free API tiers. Keep the admin tab open until it finishes. If a provider quota is exhausted, already completed languages remain saved; rerun the remaining language later or use a higher-quota model/account.

Do not enable and translate all 184 languages unless the site genuinely needs them. More enabled languages increase translation time and stored content size.

## AI Chat

Set either the Groq or OpenAI variables to enable the portfolio assistant. When both are configured, Groq is preferred.

The assistant uses site content, experience, skills, education, projects, and contact details as its knowledge source. The active admin name is included dynamically.

## Content Storage

Primary content is stored in JSON:

| Path | Purpose |
|---|---|
| `data/site.json` | Profile, contact details, skills, experience, education, languages, translations |
| `data/projects.json` | Portfolio projects and galleries |
| `data/blog-posts.json` | Markdown blog posts |
| `data/contact-submissions.json` | Contact inbox backup |
| `data/chat-sessions.json` | AI chat session records |
| `data/ui-messages/*.json` | Generated UI translations |
| `public/` | Bundled public images, project assets, and CV files |

### Local Development

CMS saves write directly to `data/*.json` and uploaded assets under `public/`.

### Vercel / Serverless

Serverless filesystems are not persistent. Configure `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, and optionally `GITHUB_BRANCH` so CMS changes are committed through the GitHub Contents API.

Use a fine-grained GitHub token scoped to this repository with **Contents: Read and write** permission.

## Contact Form

Contact submissions are saved before email delivery. This means a message remains available in the admin inbox even if Gmail delivery fails.

### Gmail Setup

1. Enable 2-Step Verification on the Gmail account.
2. Create a Google **App Password** for Mail.
3. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD`.
4. Optionally set `CONTACT_TO_EMAIL` to override the inbox address from `data/site.json`.

The visitor email is used as `Reply-To`, allowing direct replies from Gmail.

## Deployment on Vercel

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Add production environment variables.
4. Configure GitHub persistence variables if the CMS must save in production.
5. Add the custom domain and set `NEXT_PUBLIC_SITE_URL` to its HTTPS URL.
6. Redeploy after changing environment variables.

## Project Structure

```text
data/                              JSON content and generated translations
messages/                          Built-in UI translation fallbacks
public/                            Images, project assets, models, and CV
src/
├── app/
│   ├── [locale]/                  Localized public routes
│   ├── api/                       Contact, chat, assets, and admin APIs
│   └── my-admin-section/          Admin CMS route and styles
├── components/
│   ├── admin/                     CMS editors
│   ├── layout/                    Navbar, footer, language switcher
│   ├── pages/                     Home, blog, and map components
│   ├── providers/                 Theme and content providers
│   ├── sections/                  Public portfolio sections
│   └── ui/                        Shared UI primitives
├── i18n/                          next-intl request, routing, and navigation
├── lib/                           Storage, AI, translations, email, and data helpers
└── middleware.ts                  Locale middleware
```

## Production Checks

Run before deployment:

```bash
npm run lint
npm run build
```

The production build pre-renders enabled locales and supports other registered ISO locale routes on demand.
