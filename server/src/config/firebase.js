import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// In production (Render, etc.) the key is provided via the FIREBASE_SERVICE_ACCOUNT_JSON
// env var, since the local JSON file is gitignored and never deployed. Locally, it falls
// back to reading server/firebase-service-account.json directly.
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const keyPath = path.join(__dirname, "..", "..", "firebase-service-account.json");
  return JSON.parse(readFileSync(keyPath, "utf8"));
}

const app = initializeApp({
  credential: cert(loadServiceAccount()),
});

export const db = getFirestore(app);
