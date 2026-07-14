import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keyPath = path.join(__dirname, "..", "..", "firebase-service-account.json");
const serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));

const app = initializeApp({
  credential: cert(serviceAccount),
});

export const db = getFirestore(app);
