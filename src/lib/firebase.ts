
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

console.log("[Firebase Debug] Initializing with config:", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey === "mock-api-key" ? "MISSING (Using Mock)" : "PRESENT (Masked)",
});

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global connection check
console.log("[Firebase Debug] Services Initialized:", {
  appInitialized: !!app,
  firestoreInitialized: !!db,
  authInitialized: !!auth,
});

if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("[Firebase Debug] Auth State: User logged in", { uid: user.uid, email: user.email });
    } else {
      console.log("[Firebase Debug] Auth State: No user session");
    }
  });
}

export { db, auth };
