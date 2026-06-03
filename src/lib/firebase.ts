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

// Verbose Initialization Logs
console.log("[Firebase Debug] Starting Initialization...");
console.log("[Firebase Debug] Target Project ID:", firebaseConfig.projectId);
console.log("[Firebase Debug] API Key Status:", firebaseConfig.apiKey === "mock-api-key" ? "USING MOCK (Check .env)" : "PROVIDED");

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("[Firebase Debug] Services Status:", {
  appInitialized: !!app,
  firestoreInitialized: !!db,
  authInitialized: !!auth,
});

if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("[Firebase Debug] Auth State Updated: User Logged In", { uid: user.uid });
    } else {
      console.log("[Firebase Debug] Auth State Updated: No User session");
    }
  });
}

export { db, auth };
