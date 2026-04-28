# BlueprintEnvision — AI-Powered Exterior Visualizer

An AI-powered exterior home visualizer supporting **siding** (CertainTeed) and **roofing** (GAF Timberline) visualization modes. Upload a house photo, pick materials and colors, and get a photorealistic AI-rendered result in seconds.

**Live:** [blueprintaiconsulting.github.io/blueprint-exterior-visualizer](https://blueprintaiconsulting.github.io/blueprint-exterior-visualizer/)

---

## Architecture

```
┌──────────────────────────────────┐         ┌───────────────────────────────────┐
│   GitHub Pages (Static Frontend) │  fetch  │   Render (Express API Backend)    │
│   React + Vite + Tailwind        │ ──────► │   server.ts (Node/Express)        │
│   Auto-deployed on push to main  │         │   GEMINI_API_KEY (server-side)    │
└──────────────────────────────────┘         └───────────────────────────────────┘
```

**Key security note:** `GEMINI_API_KEY` lives exclusively on Render and is only accessed by the Express API server-side. It is never bundled into the frontend.

---

## Run Locally

**Prerequisites:** Node.js 18+

```bash
# 1. Clone
git clone https://github.com/BlueprintAiConsulting/blueprint-exterior-visualizer.git
cd blueprint-exterior-visualizer

# 2. Install dependencies
npm install

# 3. Set environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. Start the Express API server (terminal 1)
npm run server

# 5. Start the Vite dev frontend (terminal 2)
npm run dev
```

The Vite dev server runs on port 3001 and proxies `/api/*` to the Express server on port 3002.

---

## Deployment

### Frontend (GitHub Pages)
Automatic — push to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`) which builds the frontend and deploys to GitHub Pages.

The build injects `VITE_API_BASE_URL` pointing to the Render backend.

### Backend (Render)
Deploy `server.ts` as a **Web Service** on [Render](https://render.com):
- **Build Command:** `npm install`
- **Start Command:** `npx tsx server.ts`
- **Environment Variables:** `GEMINI_API_KEY`, optionally `RESEND_API_KEY`, `RESEND_FROM`, `LEAD_EMAIL`

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/ping` | GET | Health check / keep-alive |
| `/api/detect-sections` | POST | Auto-detect siding zones |
| `/api/auto-mask` | POST | AI segmentation mask |
| `/api/quick-render` | POST | One-shot siding visualization |
| `/api/generate` | POST | Advanced masked siding render |
| `/api/enhance-image` | POST | AI photo optimizer |
| `/api/quote-request` | POST | Lead capture + email |
| `/api/roof-detect-sections` | POST | Auto-detect roof zones |
| `/api/roof-quick-render` | POST | One-shot roof visualization |
| `/api/roof-generate` | POST | Advanced roof render |

## Product Catalogs

- **Siding:** CertainTeed MainStreet™, Monogram®, Cedar Impressions®, CedarBoards™
- **Roofing:** GAF Timberline HDZ®, Timberline HDZ® Bold, Timberline UHDZ®
- **Accents:** Trim colors, Shutter colors, Gutter colors

---

*Powered by Google Gemini · Built by Blueprint AI Consulting Co.*
