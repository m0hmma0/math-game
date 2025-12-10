import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Accessing via 'any' to avoid TS error: Property 'env' does not exist on type 'ImportMeta'.
// We default to an empty object to prevent "Cannot read properties of undefined" errors
// if import.meta.env is not defined in certain environments.
const meta = import.meta as any;
const env = meta && meta.env ? meta.env : {};

const apiKey = env.VITE_FIREBASE_API_KEY;

// Check if configuration exists
export const isFirebaseConfigured = !!apiKey;

let db: any = null;

if (isFirebaseConfigured) {
  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  };

  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  // Only warn if we expect firebase to be there, otherwise it's just local mode
  console.log("Firebase config missing. Running in local mode.");
}

export { db };