// Optional cloud-save configuration (edit-and-deploy, no rebuild needed).
//
// Leave this file as-is to run the game LOCAL-ONLY (saves in the browser,
// no login UI). To enable "sign in and resume on any device", uncomment ONE
// provider below and paste its PUBLIC client config. These keys are safe to
// commit — they identify your project, they are not secrets. Access is
// controlled by the provider's security rules (see docs/CLOUD_SAVE.md).
//
// --- Option A: Firebase (Google sign-in + Firestore) ---------------------
// window.__SYNTH_CLOUD__ = {
//   provider: "firebase",
//   firebase: {
//     apiKey: "AIza...",
//     authDomain: "your-project.firebaseapp.com",
//     projectId: "your-project",
//     appId: "1:1234567890:web:abc123",
//   },
// };
//
// --- Option B: Supabase (Google/email auth + Postgres) -------------------
// window.__SYNTH_CLOUD__ = {
//   provider: "supabase",
//   supabase: {
//     url: "https://xxxxx.supabase.co",
//     anonKey: "eyJhbGciOi...",
//   },
// };
