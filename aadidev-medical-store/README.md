# Aadidev Medical Store — Setup & Deployment Guide

You now have **working, real code** for both apps:

- `customer-app/` — the public app anyone can browse and order from
- `owner-app/` — the private, PIN-locked app for managing stock, orders, chats and quotes
- `supabase-schema.sql` — the shared database both apps talk to, in real time

Both apps run right now with **sample demo data** (no setup needed) so you can click around immediately:

```
cd customer-app && npm install && npm run dev
cd owner-app && npm install && npm run dev
```

Open the printed `localhost` URL. Owner app demo PIN is **1234**.

To go live with a real, syncing database, follow the steps below. Total time: ~20–30 minutes, no coding required. I can walk you through any step live — just paste back an error or a screenshot if something doesn't match.

---

## Step 1 — Create your free Supabase project

1. Go to **https://supabase.com** → "Start your project" → sign up (GitHub or email).
2. Click **New project**. Name it `aadidev-medical-store`, set a database password (save it somewhere), pick the region closest to Satna (e.g. `ap-south-1` / Mumbai if offered), click **Create project**. Takes ~2 minutes to spin up.
3. Once it's ready, go to **SQL Editor** (left sidebar) → **New query**.
4. Open `supabase-schema.sql` from this folder, copy the whole file, paste it into the SQL editor, click **Run**.
   - This creates all 6 tables (medicines, orders, zones, delivery settings, plan requests, chats), sets up security rules, turns on realtime sync, and adds a few sample medicines/zones you can delete later from the Owner app.
5. Go to **Project Settings → API** (left sidebar, gear icon → API). You'll need two values from this page:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

Keep this tab open — you'll paste these into both apps next.

## Step 2 — Connect the customer app

1. In `customer-app/`, copy `.env.example` to a new file named `.env`
2. Paste in your values:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. Run `npm run dev` again (or restart it) — the yellow "sample data" banner should disappear, and you're now reading/writing the real database.

## Step 3 — Connect the owner app

1. In `owner-app/`, copy `.env.example` to `.env`
2. Paste the **same** Supabase URL and anon key.
3. Also set your own PIN:
   ```
   VITE_OWNER_PIN=your-4-digit-pin
   ```
4. Run `npm run dev` — log in with your PIN, add a real medicine, and check it instantly shows up in the customer app's browser tab. That's the real-time sync working.

**On barcode scanning:** the Barcode field in "Add medicine" accepts input from any USB or Bluetooth barcode scanner (they work by typing into whatever field is focused, just like a keyboard) — scan into that field and it fills in instantly. If a barcode you've already saved is scanned again, its details auto-fill. Manual typing works the same way. A camera-based scanner (using your phone's camera) is a reasonable v2 addition if you want it later.

## Step 4 — Put both apps online (so customers/you can use them anywhere, not just your laptop)

Both apps deploy the same way, to **Vercel** (free):

1. Push this whole folder to a GitHub repo (or ask me and I'll walk you through `git init` from here).
2. Go to **https://vercel.com** → sign up with GitHub → **Add New → Project** → import your repo.
3. Vercel will ask for the **Root Directory** — set it to `customer-app` for the first deploy.
4. Under **Environment Variables**, add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` you used locally.
5. Click **Deploy**. In ~1 minute you get a live URL like `aadidev-medical-store.vercel.app`.
6. Repeat steps 2–5 for `owner-app` as a **second, separate Vercel project** (Root Directory: `owner-app`), adding its three env vars (URL, anon key, PIN). You'll get a second, different URL — this is your private staff link. **Don't share it publicly or link to it from the customer app.**

Once you own a domain (see the original checklist — Hostinger/GoDaddy, ~₹500–900/yr), point it at the customer app's Vercel deployment for a proper `.com`/`.in` address; the owner app can stay on its default `vercel.app` link or a private subdomain like `staff.yourdomain.com`.

## Step 4.5 — If you already had this running: apply the update

You added three new features after the first build: camera barcode scanning, real map-based
delivery, and customer login. If your Supabase project already existed before this update:

1. Open **SQL Editor → New query** in Supabase, paste in the contents of
   `supabase-migration-2-login-maps.sql`, and click **Run**. This adds the new columns/settings
   without touching your existing data.
2. In **Owner app → More → Delivery & pricing**, tap the map (or "Use my current location" while
   standing at the shop) to save the store's location — delivery fees can't be calculated until
   this is set.
3. Optional: in Supabase, go to **Authentication → Sign In / Providers → Email** and turn off
   "Confirm email" for now, so new customer accounts can log in immediately without waiting on a
   confirmation email (you can turn it back on later once you set up your own email sending).
4. Re-run `npm install` in both `customer-app` and `owner-app` (new packages were added:
   `leaflet`, `react-leaflet`, and `html5-qrcode`).

**A note on the map:** it uses OpenStreetMap and Nominatim (both free, no account or card
needed). Nominatim's free tier is meant for light use — completely fine for one store in one
city — but if you ever get very high traffic, that's a natural point to switch to a paid
geocoding provider. The delivery distance shown is the straight-line map distance × a
"road factor" (adjustable in More → Delivery & pricing) as a simple approximation of real
road distance.

**A note on barcode scanning:** the "📷 Scan" button uses your phone's or laptop's camera
directly in the browser — no app install needed. It'll ask for camera permission the first
time; allow it. A USB/Bluetooth barcode scanner (if you have one) still works too — it just
types into the barcode field like a keyboard.

## Step 5 — Go live checklist (from your original plan)

- [ ] Confirm home delivery is covered under the existing drug license (call the local drug inspector)
- [ ] Reuse the shop's GSTIN, or register if turnover crosses the threshold
- [ ] Supabase project set up and schema run (Step 1 above) ✅ once done
- [ ] Customer app deployed to a public domain (Step 4)
- [ ] Owner app deployed to a separate, private URL (Step 4)
- [ ] Add your real medicine catalog (use "Bulk add" in the Owner app to paste your stock list in one go)
- [ ] Add your real delivery areas and pricing (Owner app → More → Delivery & pricing)
- [ ] Test the full order lifecycle end to end: place a test order in the customer app → see it appear instantly in Owner app → change its status → confirm it updates back in the customer app's Track page
- [ ] Soft-launch to 1–2 nearby localities first

Payments are **cash on delivery only** for this version, as you asked — Razorpay can be added later without changing anything else in the data model.

---

## What's already built

**Customer app:** browse/search by name & category, Rx tags, cart with quantity controls, delivery-area picker with auto-calculated delivery fee, mandatory prescription confirmation on Rx orders, checkout, order tracking by phone number, one-tap reorder, live chat with the owner, and a "monthly/yearly plan" request form for recurring medicines.

**Owner app:** PIN-gated, entirely separate app/URL — nothing links to it from the customer app or its page source. Dashboard with pending-order, low-stock and expiring-soon counts. Add/edit medicines one at a time or via bulk paste, with barcode field and expiry-date tracking + "expiring soon" and "low stock" filters. Full order list with one-tap status updates (Pending → Out for delivery → Delivered). Reply to customer chats. Review and quote monthly/yearly plan requests. Manage delivery areas and the free-km / per-km pricing rule.

Both apps read and write the same Supabase tables and use Supabase Realtime, so changes made in one appear in the other within a second or two — no refresh needed.

## Project structure

```
aadidev-medical-store/
├── README.md                 ← you are here
├── supabase-schema.sql       ← run once in Supabase SQL Editor
├── customer-app/              ← public app
│   ├── .env.example
│   └── src/
└── owner-app/                 ← private, PIN-locked app
    ├── .env.example
    └── src/
```
