# Deployment Guide

> Complete guide to deploying the Stock Inward Dashboard — backend (Google Apps Script) and frontend (React + Vite).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment (Google Apps Script)](#backend-deployment)
3. [Frontend — Local Development](#frontend-local-development)
4. [Frontend — Production Build](#frontend-production-build)
5. [Deployment Options](#deployment-options)
   - [Vercel](#option-1-vercel-recommended)
   - [Netlify](#option-2-netlify)
   - [GitHub Pages](#option-3-github-pages)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment Checklist](#post-deployment-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | >= 18.x | `node --version` |
| npm | >= 9.x | `npm --version` |
| Git | >= 2.x | `git --version` |
| Google Account | — | — |
| Modern Browser | Chrome/Edge/Firefox | — |

---

## Backend Deployment

The backend is a Google Apps Script web app that uses Google Sheets as its database.

### Quick Steps

1. Follow the complete [SETUP.md](../google-apps-script/SETUP.md) guide.
2. After deployment, you'll have a URL like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
3. Test the API by visiting:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec?action=getDashboardData
   ```
4. You should see a JSON response with `"status": "success"`.

### Seed Test Data

Before connecting the frontend, seed the database:

```
https://script.google.com/macros/s/AKfycbx.../exec?action=seedSampleData
```

### Backend Architecture

```
┌──────────────────────────┐
│     Google Sheets        │
│  ┌────────────────────┐  │
│  │  Purchase_Headers  │  │
│  │  Purchase_Items    │  │
│  └────────────────────┘  │
│            ▲             │
│            │ read/write  │
│  ┌────────────────────┐  │
│  │  Apps Script (API) │  │
│  │  Code.gs           │  │
│  └────────────────────┘  │
│            ▲             │
└────────────│─────────────┘
             │ HTTPS
     ┌───────┴───────┐
     │  React App    │
     │  (Frontend)   │
     └───────────────┘
```

---

## Frontend — Local Development

### 1. Clone / Navigate to the Project

```bash
cd stock-inward-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the project root:

```env
# Required: Your deployed Apps Script URL
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx.../exec

# Optional: Google OAuth Client ID (for future authenticated features)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (default Vite port).

### 5. Verify Connection

- Open the app in your browser.
- The dashboard should load data from your Google Sheet.
- If you seeded sample data, you'll see charts and recent entries.

---

## Frontend — Production Build

### Build the App

```bash
npm run build
```

This creates an optimised production build in the `dist/` directory.

### Preview the Build Locally

```bash
npm run preview
```

This serves the production build at `http://localhost:4173`.

### Build Output

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── ...
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel offers the simplest deployment for Vite/React apps.

#### Via CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? `stock-inward-dashboard`
   - Directory? `./`
   - Override settings? **N**

4. Set environment variables:
   ```bash
   vercel env add VITE_GOOGLE_APPS_SCRIPT_URL
   ```
   Paste your Apps Script URL when prompted.

5. Redeploy for the env var to take effect:
   ```bash
   vercel --prod
   ```

#### Via GitHub Integration

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Import Project**.
3. Select your GitHub repo.
4. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variables in the Vercel dashboard.
6. Click **Deploy**.

---

### Option 2: Netlify

#### Via CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy:
   ```bash
   netlify deploy --prod --dir=dist
   ```

#### Via Dashboard

1. Go to [netlify.com](https://netlify.com) → **Add new site → Import an existing project**.
2. Connect your GitHub repo.
3. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Add environment variables in **Site settings → Build & deploy → Environment**.
5. Deploy.

#### Netlify Redirects (SPA)

Create `public/_redirects`:

```
/*    /index.html   200
```

This ensures client-side routing works correctly.

---

### Option 3: GitHub Pages

#### Setup

1. Install the deployment plugin:
   ```bash
   npm install -D gh-pages
   ```

2. Add to `package.json`:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://yourusername.github.io/stock-inward-dashboard"
   }
   ```

3. Update `vite.config.js`:
   ```javascript
   export default defineConfig({
     base: '/stock-inward-dashboard/',
     // ... other config
   });
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

#### Limitations

- GitHub Pages serves static files only.
- Environment variables must be baked in at build time.
- Custom domains require DNS configuration.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_APPS_SCRIPT_URL` | ✅ Yes | Deployed Apps Script web app URL |
| `VITE_GOOGLE_CLIENT_ID` | ❌ No | Google OAuth Client ID (for future auth) |

### Important Notes

- All Vite environment variables must start with `VITE_`.
- Variables are embedded at **build time**, not runtime.
- After changing env vars, you must **rebuild and redeploy**.
- Never commit `.env` files to version control (it's in `.gitignore`).

---

## Post-Deployment Checklist

- [ ] Backend API returns data: `?action=getDashboardData`
- [ ] Sample data is seeded: `?action=seedSampleData`
- [ ] Frontend loads without errors
- [ ] Dashboard shows charts and data
- [ ] "Add Purchase" form works and data appears in Google Sheet
- [ ] Filters work on the Purchases page
- [ ] Data exports work from Google Sheets directly
- [ ] No CORS errors in browser console

---

## Troubleshooting

### Frontend shows "Failed to fetch" or network errors

1. **Check the API URL** in your `.env` — it must end with `/exec`.
2. **Verify the API works** by pasting the URL directly in the browser.
3. **Redeploy** the Apps Script if you made changes (Deploy → Manage deployments → New version).

### CORS Issues

Google Apps Script web apps handle CORS automatically when:
- The response uses `ContentService.MimeType.JSON`
- The deployment is set to "Anyone" access
- You use the `/exec` URL (not `/dev`)

If you still see CORS errors:
- Use `fetch()` without explicit `mode` or `headers`
- Don't set `Content-Type` headers in GET requests

### "Script function not found: doGet"

- The deployment is using the wrong version. Update the deployment to a **new version**.

### Changes not reflected after redeployment

1. Clear your browser cache (Ctrl+Shift+Delete).
2. For Vercel/Netlify: check that the latest build used the correct env vars.
3. For Apps Script: make sure you selected "New version" when updating the deployment.

### Google Sheets API Rate Limits

Google Apps Script has these limits:
- **Read/write:** 100 calls per 100 seconds per user
- **Execution time:** 6 minutes per execution
- **Triggers:** 90 minutes per day cumulative

For normal dashboard usage (< 10,000 rows), you won't hit these limits.

### Build Fails

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```
