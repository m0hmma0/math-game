
import { GameResult, AssignmentData, GameSettings } from '../types';

const DB_KEY = 'mathWhiz_db_scores';

// --- Database Simulation (LocalStorage) ---

export const saveScore = (result: GameResult): void => {
  const currentHistory = getAllScores();
  const updatedHistory = [...currentHistory, result];
  localStorage.setItem(DB_KEY, JSON.stringify(updatedHistory));
};

export const getAllScores = (): GameResult[] => {
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse scores", e);
    return [];
  }
};

export const clearScores = (): void => {
  localStorage.removeItem(DB_KEY);
};

// --- URL Sharing Logic ---

export const generateAssignmentLink = (studentName: string, settings: GameSettings): string => {
  const data: AssignmentData = { studentName, settings };
  // Encode to Base64 to make it URL safe(ish) and obscure slightly
  const jsonStr = JSON.stringify(data);
  const encoded = btoa(jsonStr);
  
  // Robust base URL retrieval: Use href and strip query params
  // This prevents issues where origin/pathname concatenation might duplicate protocols in some envs
  const baseUrl = window.location.href.split('?')[0];
  
  // Ensure we don't have a double slash issue if baseUrl ends with /
  const separator = baseUrl.includes('?') ? '&' : '?';
  
  return `${baseUrl}${separator}assignment=${encoded}`;
};

export const parseAssignmentFromUrl = (): AssignmentData | null => {
  const params = new URLSearchParams(window.location.search);
  const assignmentToken = params.get('assignment');

  if (!assignmentToken) return null;

  try {
    const jsonStr = atob(assignmentToken);
    const data = JSON.parse(jsonStr) as AssignmentData;
    return data;
  } catch (e) {
    console.error("Failed to parse assignment token", e);
    return null;
  }
};
