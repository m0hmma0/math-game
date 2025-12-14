
import { GameMode, GameSettings, Question, Fraction, MixedNumber } from '../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to calculate GCD for simplifying fractions
const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

const getSignature = (q: Question): string => {
  if (q.type === GameMode.TIMES_TABLES) {
    return `${q.data.val1}x${q.data.val2}`;
  } else if (q.type === GameMode.FRACTIONS_OPS) {
    return `${q.data.fraction1?.num}/${q.data.fraction1?.den}${q.data.operator}${q.data.fraction2?.num}/${q.data.fraction2?.den}`;
  } else if (q.type === GameMode.MIXED_TO_IMPROPER) {
    return `${q.data.mixed?.whole}_${q.data.mixed?.fraction.num}/${q.data.mixed?.fraction.den}`;
  }
  return q.text;
};

export const generateQuestions = (settings: GameSettings): Question[] => {
  const questions: Question[] = [];
  const signatures = new Map<string, number>();
  
  // Safety counter to prevent infinite loops if pool is too small
  let attempts = 0;
  const maxAttempts = settings.questionCount * 10;

  while (questions.length < settings.questionCount && attempts < maxAttempts) {
    attempts++;
    let q: Question | null = null;
    switch (settings.mode) {
      case GameMode.TIMES_TABLES:
        q = generateTimesTableQuestion(settings.selectedTables);
        break;
      case GameMode.FRACTIONS_OPS:
        q = generateFractionOpQuestion(settings);
        break;
      case GameMode.MIXED_TO_IMPROPER:
        q = generateMixedToImproperQuestion(settings);
        break;
    }

    if (q) {
      const sig = getSignature(q);
      const count = signatures.get(sig) || 0;
      if (count < 2) {
        questions.push(q);
        signatures.set(sig, count + 1);
      }
    }
  }

  return questions;
};

const generateTimesTableQuestion = (tables: number[]): Question => {
  // If no tables selected, default to 2-12
  const availableTables = tables.length > 0 ? tables : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const table = availableTables[randomInt(0, availableTables.length - 1)];
  const multiplier = randomInt(1, 12);

  return {
    id: generateId(),
    text: `${table} × ${multiplier}`,
    type: GameMode.TIMES_TABLES,
    data: {
      val1: table,
      val2: multiplier,
      operator: '×'
    },
    answer: {
      num: table * multiplier
    }
  };
};

const generateFractionOpQuestion = (settings: GameSettings): Question => {
  const ops = settings.fractionOps;
  const op = ops.length > 0 ? ops[randomInt(0, ops.length - 1)] : 'add';
  
  // Use selected denominators or fallback
  const dens = settings.selectedDenominators && settings.selectedDenominators.length > 0 
    ? settings.selectedDenominators 
    : [2, 3, 4, 5, 6, 8, 10, 12];
  
  // Generate "Like Fractions" (same denominator)
  const commonDen = dens[randomInt(0, dens.length - 1)];
  const d1 = commonDen;
  const d2 = commonDen;
  
  // Numerators
  let n1 = randomInt(1, d1 - 1);
  let n2 = randomInt(1, d2 - 1);
  
  // Ensure n1/d1 is not 0 (though randomInt(1,...) handles this)
  if (n1 < 1) n1 = 1;
  if (n2 < 1) n2 = 1;

  let f1: Fraction = { num: n1, den: d1 };
  let f2: Fraction = { num: n2, den: d2 };

  let ansNum = 0;
  let ansDen = 1;
  let operatorSymbol = '';

  switch (op) {
    case 'add':
      operatorSymbol = '+';
      // Like fractions addition: (n1 + n2) / d
      ansNum = n1 + n2;
      ansDen = d1;
      break;
    case 'sub':
      operatorSymbol = '-';
      // Ensure positive result for primary students
      if (n1 < n2) {
        // Swap values so larger is first
        [n1, n2] = [n2, n1];
        f1 = { num: n1, den: d1 };
        f2 = { num: n2, den: d2 };
      }
      ansNum = n1 - n2;
      ansDen = d1;
      break;
    case 'mul':
      operatorSymbol = '×';
      // Multiply: (n1 * n2) / (d * d)
      ansNum = n1 * n2;
      ansDen = d1 * d2;
      break;
    case 'div':
      operatorSymbol = '÷';
      // Division: (n1/d) / (n2/d) = n1/n2
      ansNum = n1;
      ansDen = n2;
      break;
  }

  // Simplify answer for storage (we'll compare equivalent fractions later)
  const common = gcd(ansNum, ansDen);
  
  return {
    id: generateId(),
    text: `${f1.num}/${f1.den} ${operatorSymbol} ${f2.num}/${f2.den}`,
    type: GameMode.FRACTIONS_OPS,
    data: {
      fraction1: f1,
      fraction2: f2,
      operator: operatorSymbol
    },
    answer: {
      num: ansNum / common,
      den: ansDen / common
    }
  };
};

const generateMixedToImproperQuestion = (settings: GameSettings): Question => {
  const wholeMax = settings.maxWholeNumber || 5;
  const whole = randomInt(1, wholeMax);
  
  const dens = settings.selectedDenominators && settings.selectedDenominators.length > 0 
    ? settings.selectedDenominators 
    : [2, 3, 4, 5, 6, 8];
    
  const den = dens[randomInt(0, dens.length - 1)];
  const num = randomInt(1, den - 1);

  const mixed: MixedNumber = {
    whole,
    fraction: { num, den }
  };

  const ansNum = whole * den + num;
  const ansDen = den;

  return {
    id: generateId(),
    text: `Convert ${whole} ${num}/${den} to improper`,
    type: GameMode.MIXED_TO_IMPROPER,
    data: {
      mixed,
    },
    answer: {
      num: ansNum,
      den: ansDen
    }
  };
};

export const checkAnswer = (q: Question, userNum: number, userDen?: number): boolean => {
  if (q.type === GameMode.TIMES_TABLES) {
    return userNum === q.answer.num;
  } else {
    // Fraction comparison: a/b == c/d if a*d == b*c
    if (!userDen) return false;
    // Handle 0 denominator safely
    if (userDen === 0) return false;
    
    return (userNum * (q.answer.den || 1)) === (q.answer.num * userDen);
  }
};
