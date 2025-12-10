import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFmjOgmb_eRiEKphjo5eAn9M8axHPZICc",
  authDomain: "math-game-a8b26.firebaseapp.com",
  projectId: "math-game-a8b26",
  storageBucket: "math-game-a8b26.firebasestorage.app",
  messagingSenderId: "1081685232318",
  appId: "1:1081685232318:web:36641952bbe87db9b4acef",
  measurementId: "G-3V6YVHJG48"
};

let db: any = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// We mark it as configured since we have the keys hardcoded.
// The storage service checks if (isFirebaseConfigured && db) to ensure safe usage.
export const isFirebaseConfigured = true;
export { db };