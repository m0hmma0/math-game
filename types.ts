
export enum GameMode {
  TIMES_TABLES = 'TIMES_TABLES',
  FRACTIONS_OPS = 'FRACTIONS_OPS',
  MIXED_TO_IMPROPER = 'MIXED_TO_IMPROPER',
}

export interface GameSettings {
  mode: GameMode;
  questionCount: number;
  timeLimitSeconds: number; // 0 for no limit
  selectedTables: number[]; // For times tables (2-12)
  fractionOps: ('add' | 'sub' | 'mul' | 'div')[];
  selectedDenominators?: number[]; // For fractions/mixed
  maxWholeNumber?: number; // For mixed numbers
}

export interface Question {
  id: string;
  text: string; // Text representation for screen reader / simplified view
  type: GameMode;
  // Specific data for rendering nice components
  data: {
    val1?: number; // Times tables: a * b
    val2?: number;
    fraction1?: Fraction; // Fractions: f1 op f2
    fraction2?: Fraction;
    mixed?: MixedNumber; // Mixed to improper
    operator?: string;
  };
  answer: {
    num: number;
    den?: number; // If answer is a fraction
  };
}

export interface Fraction {
  num: number;
  den: number;
}

export interface MixedNumber {
  whole: number;
  fraction: Fraction;
}

export interface GameResult {
  studentName: string;
  score: number;
  totalQuestions: number;
  date: string;
  mode: GameMode;
  retryCount: number;
  completed?: boolean; // New flag to track if game was finished or abandoned
  history: {
    question: Question;
    userAnswer: string;
    isCorrect: boolean;
    timeTaken: number;
  }[];
}

export interface AssignmentData {
  studentName: string;
  settings: GameSettings;
}
