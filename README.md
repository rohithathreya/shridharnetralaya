# Shridhar Netralaya — Clinic Website, Staff Desk & Admin Portal

Production-ready static React + TypeScript + Tailwind application designed for **GitHub Pages** (with custom domain support) backed by **Supabase** (Postgres + Private Storage + Row Level Security + Edge Functions).

## Architecture Overview
- **Tier 1 — Public Website (`/#/`)**: Clinic overview, Dr. L. S. Malathesh's profile, services, Magadi address/directions, timings, Call & WhatsApp inquiry.
- **Tier 2 — Staff Desk (`/#/staff`)**: PIN-authenticated (verified server-side via Supabase Edge Function `pin-login` -> real Supabase JWT).
  - Non-unique phone search (multiple family members can share one mobile number) with auto-generated unique Patient IDs (`SN-26-0001`).
  - **Top-Down Invoice Generator**: Categorized service chips, discounts, Cash/UPI/Card/TPA tracking, A5/A4 Print & WhatsApp share.
  - **1-Page Bilingual (English + Kannada) Discharge Summary**: 1-click surgical protocols (Phaco, SICS, Pterygium, Intravitreal, Other) + optional **AI Photo/Voice Autofill** (Gemini 2.5 Flash) + safety confirmation + 60mm×35mm IOL Sticker box + Print & WhatsApp share.
  - **Handwritten Prescription / Doc Uploader**: Mobile camera capture + automatic client-side JPEG compression (~200KB) + private bucket storage + 7-day signed-URL WhatsApp share.
  - **Follow-Ups Due**: 14-day recall window with 1-click bilingual WhatsApp reminders.
- **Tier 3 — Admin Portal (`/#/admin`)**: Admin PIN-authenticated.
  - Today / Week / Month / All-Time collections split by Cash, UPI, Card, TPA + CSV export.
  - Audit-safe **Void Invoice** with mandatory reason (staff cannot delete or tamper with bills).
  - Live Service & Price Catalog manager.
  - Live Clinic Metadata editor (KPME Reg No., KMC Reg No., Emergency Phone, Timings) and secure **Staff/Admin PIN Rotation**.
- **Tokenized Patient Share (`/#/share/:token`)**: Secure 160-bit random token links sent over WhatsApp. Calls a `SECURITY DEFINER` RPC returning only that single invoice or discharge summary (zero IDOR, zero direct table access).

---

## Deployment Checklist (15 Minutes)

### Step 1: Supabase Database Setup
1. Create a new project at [supabase.com](https://supabase.com) (choose **Mumbai `ap-south-1`** region for lowest latency in Karnataka).
2. Open **SQL Editor** → paste the entire contents of `supabase/migrations/001_initial_schema.sql` → click **Run**.
   - This creates all tables, sequences (`SN-26-xxxx`, `INV-26-xxxx`, `DS-26-xxxx`), RLS policies, RPCs, private `patient-docs` storage bucket, and realistic pre-seeded services & surgical protocols.
   - **Initial Default PINs**: Staff = `2026`, Admin = `9090`. Change both immediately inside `/#/admin` → **Clinic Details & PINs** after deploy!

### Step 2: Deploy Supabase Edge Functions
Install Supabase CLI (`npm i -g supabase`), log in, link your project, and deploy both Edge Functions:
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Optional (enables AI Scan Rx / IOL Photo & AI Voice Fill):
supabase secrets set GEMINI_API_KEY=your_google_ai_studio_key

# Deploy both functions (--no-verify-jwt ONLY on pin-login so staff can log in)
supabase functions deploy pin-login --no-verify-jwt
supabase functions deploy ai-extract
```
*(Note: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase into Edge Functions.)*

### Step 3: Deploy Frontend to GitHub Pages
1. Create a GitHub repository and push this folder to the `main` branch.
2. In GitHub repo → **Settings → Secrets and variables → Actions**, add two repository secrets:
   - `VITE_SUPABASE_URL` = your Supabase Project URL (`https://xxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` = your Supabase `anon` public key
3. In GitHub repo → **Settings → Pages → Build and deployment**, set Source to **GitHub Actions**.
4. Push to `main` (or trigger **Actions → Deploy Shridhar Netralaya to GitHub Pages**).

### Step 4: Connect Your Custom Domain
1. Rename `public/CNAME.example` to `public/CNAME` and put your domain inside (e.g., `shridharnetralaya.com`).
2. Add GitHub Pages DNS records at your registrar (`A` records pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` and `CNAME` for `www` pointing to `<your-username>.github.io`).
3. Enable **Enforce HTTPS** in GitHub repo → Settings → Pages.

### Local Development
```bash
cp .env.example .env.local
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
npm install
npm run dev
```
