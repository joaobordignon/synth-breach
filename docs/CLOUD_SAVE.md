# Cloud Save & Login (optional)

SYNTH // BREACH runs **local-only by default** — progress is saved in the
browser's `localStorage`, no account required. If you want players to **sign in
and resume on any device**, wire up one of the two supported backends. Both are
free-tier, work from a static site (GitHub Pages), and need no server of your
own.

You configure it by editing **`public/cloud-config.js`** and pushing — the Pages
deploy picks it up automatically. The keys you paste there are *public client
keys* (safe to commit); real access is enforced by the provider's security
rules below.

When signed in, the game pulls your cloud save on login (adopting it if it's
newer than local), then pushes every change up (debounced). Signing out keeps
your local save intact.

---

## Option A — Firebase (Google sign-in + Firestore)

1. Create a project at <https://console.firebase.google.com> → **Add project**.
2. **Add a Web App** (`</>` icon) and copy the config values (`apiKey`,
   `authDomain`, `projectId`, `appId`).
3. **Authentication → Sign-in method** → enable **Google** (and optionally
   **Anonymous** for guest play).
4. **Authentication → Settings → Authorized domains** → add your site domain
   (e.g. `joaobordignon.github.io`). `localhost` is already allowed for dev.
5. **Firestore Database → Create database** (production mode).
6. **Firestore → Rules** → paste, then **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /saves/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

7. Edit **`public/cloud-config.js`**:

   ```js
   window.__SYNTH_CLOUD__ = {
     provider: "firebase",
     firebase: {
       apiKey: "AIza...",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project",
       appId: "1:1234567890:web:abc123",
     },
   };
   ```

8. Commit & push. After the Pages deploy, a **☁ Sign in to save** button
   appears in the header.

---

## Option B — Supabase (Google / email auth + Postgres)

1. Create a project at <https://supabase.com/dashboard>.
2. **Project Settings → API** → copy the **Project URL** and the **anon public**
   key.
3. **Authentication → Providers → Google** → enable it (paste a Google OAuth
   client ID/secret from <https://console.cloud.google.com> → Credentials).
4. **Authentication → URL Configuration** → set **Site URL** and add your Pages
   URL (e.g. `https://joaobordignon.github.io/synth-breach/`) to the redirect
   allow-list.
5. **SQL Editor** → run once:

   ```sql
   create table if not exists public.saves (
     user_id uuid primary key references auth.users(id) on delete cascade,
     data jsonb not null,
     updated_at timestamptz default now()
   );
   alter table public.saves enable row level security;
   create policy "own save read"  on public.saves for select using (auth.uid() = user_id);
   create policy "own save write" on public.saves for insert with check (auth.uid() = user_id);
   create policy "own save upd"   on public.saves for update using (auth.uid() = user_id);
   ```

6. Edit **`public/cloud-config.js`**:

   ```js
   window.__SYNTH_CLOUD__ = {
     provider: "supabase",
     supabase: {
       url: "https://xxxxx.supabase.co",
       anonKey: "eyJhbGciOi...",
     },
   };
   ```

7. Commit & push. The **☁ Sign in to save** button appears after deploy.

---

## Build-time alternative (env vars)

Instead of `public/cloud-config.js`, you can set Vite env vars at build time
(e.g. in the Actions workflow). The same public keys apply:

- Firebase: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
  `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
- Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

The runtime `cloud-config.js` wins over env vars when both are present.

## How it behaves

- **Not configured** → no login UI, local saves only (default).
- **Configured, signed out** → local saves; a sign-in button is shown.
- **Configured, signed in** → cloud save is the source of truth: pulled on
  login (if newer than local), pushed on every change. The SDK is lazy-loaded,
  so visitors who never sign in don't download it.
