import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Verbose Initialization Logs as requested
console.log("[Firebase Debug] --- START INITIALIZATION ---");
console.log("[Firebase Debug] NEXT_PUBLIC_FIREBASE_PROJECT_ID:", firebaseConfig.projectId);
console.log("[Firebase Debug] API Key Status:", firebaseConfig.apiKey === "mock-api-key" ? "MISSING (.env not loaded?)" : "LOADED");

let app;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  console.log("[Firebase Debug] Firebase App initialized: SUCCESS");
} catch (e) {
  console.error("[Firebase Debug] Firebase App initialized: FAILED", e);
}

const db = getFirestore(app!);
const auth = getAuth(app!);

console.log("[Firebase Debug] Firestore initialized status: ", !!db);
console.log("[Firebase Debug] Auth initialized status: ", !!auth);
console.log("[Firebase Debug] --- END INITIALIZATION ---");

if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("[Firebase Debug] Auth state: User Logged In", { uid: user.uid });
    } else {
      console.log("[Firebase Debug] Auth state: No user session found");
    }
  });
}

export { db, auth };
