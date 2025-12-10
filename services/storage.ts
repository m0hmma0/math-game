import { GameResult, AssignmentData, GameSettings } from '../types';
import { db, isFirebaseConfigured } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';

const DB_KEY = 'mathWhiz_db_scores';

// --- Database Operations ---

export const saveScore = async (result: GameResult): Promise<void> => {
  // 1. Always save to LocalStorage (as a backup/cache for the student)
  try {
    const currentLocal = getLocalScores();
    const updatedLocal = [...currentLocal, result];
    localStorage.setItem(DB_KEY, JSON.stringify(updatedLocal));
  } catch (e) {
    console.error("Local save failed", e);
  }

  // 2. If Firebase is configured, save to Cloud
  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, "scores"), {
        ...result,
        timestamp: Timestamp.now() // Add server timestamp for better sorting
      });
    } catch (e) {
      console.error("Firebase save failed", e);
      // We don't throw here so the app doesn't crash for the student
    }
  }
};

export const getScores = async (): Promise<GameResult[]> => {
  // If Firebase is on, try to fetch global scores (for Teacher View mainly)
  // Note: For students, we might only want to show THEIR scores, but for now we follow the structure
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "scores"), orderBy("timestamp", "desc"), limit(100));
      const querySnapshot = await getDocs(q);
      const scores: GameResult[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore Timestamp back to ISO string if needed, or rely on original date string
        scores.push(data as GameResult);
      });
      return scores;
    } catch (e) {
      console.error("Firebase fetch failed, falling back to local", e);
    }
  }

  // Fallback to local
  return getLocalScores().reverse();
};

// Synchronous helper for local storage only
const getLocalScores = (): GameResult[] => {
  try {
    const stored = localStorage.getItem(DB_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const clearLocalScores = (): void => {
  try {
    localStorage.removeItem(DB_KEY);
  } catch (e) {
    console.error("Failed to clear storage", e);
  }
};

// --- URL Sharing Logic ---
// This remains synchronous and client-side as it just encodes JSON
export const generateAssignmentLink = (studentName: string, settings: GameSettings): string => {
  const data: AssignmentData = { studentName, settings };
  const jsonStr = JSON.stringify(data);
  const encoded = btoa(jsonStr);
  const baseUrl = window.location.href.split('?')[0];
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}assignment=${encoded}`;
};

export const parseAssignmentFromUrl = (): AssignmentData | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const assignmentToken = params.get('assignment');
    if (!assignmentToken) return null;
    const jsonStr = atob(assignmentToken);
    return JSON.parse(jsonStr) as AssignmentData;
  } catch (e) {
    return null;
  }
};
