
import { GameMode, GameSettings, Question, Fraction, MixedNumber } from '../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to calculate GCD for simplifying fractions (though user input checks might not require strict simplification unless specified)
const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

const getSignature = (q: Question): string => {
  if (q.type === GameMode.TIMES_TABLES) {
    // 2x3 is same as 3x2? Usually times tables treat them distinctly in learning, but let's treat them as distinct for now.
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
        q = generateFractionOpQuestion(settings.fractionOps);
        break;
      case GameMode.MIXED_TO_IMPROPER:
        q = generateMixedToImproperQuestion();
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

const generateFractionOpQuestion = (ops: ('add' | 'sub' | 'mul' | 'div')[]): Question => {
  const op = ops.length > 0 ? ops[randomInt(0, ops.length - 1)] : 'add';
  
  // Keep denominators simple for primary students (2, 3, 4, 5, 6, 8, 10)
  const dens = [2, 3, 4, 5, 6, 8, 10];
  const d1 = dens[randomInt(0, dens.length - 1)];
  const d2 = dens[randomInt(0, dens.length - 1)];
  
  const n1 = randomInt(1, d1 - 1);
  const n2 = randomInt(1, d2 - 1);

  const f1: Fraction = { num: n1, den: d1 };
  const f2: Fraction = { num: n2, den: d2 };

  let ansNum = 0;
  let ansDen = 1;
  let operatorSymbol = '';

  switch (op) {
    case 'add':
      operatorSymbol = '+';
      // n1/d1 + n2/d2 = (n1*d2 + n2*d1) / (d1*d2)
      ansNum = n1 * d2 + n2 * d1;
      ansDen = d1 * d2;
      break;
    case 'sub':
      operatorSymbol = '-';
      // Ensure positive result for primary students
      if (n1/d1 < n2/d2) {
        // Swap
        return generateFractionOpQuestion(ops);
      }
      ansNum = n1 * d2 - n2 * d1;
      ansDen = d1 * d2;
      break;
    case 'mul':
      operatorSymbol = '×';
      ansNum = n1 * n2;
      ansDen = d1 * d2;
      break;
    case 'div':
      operatorSymbol = '÷';
      ansNum = n1 * d2;
      ansDen = d1 * n2;
      break;
  }

  // Simplify answer for storage (we'll compare equivalent fractions later)
  const common = gcd(ansNum, ansDen);
  
  return {
    id: generateId(),
    text: `${n1}/${d1} ${operatorSymbol} ${n2}/${d2}`,
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

const generateMixedToImproperQuestion = (): Question => {
  const whole = randomInt(1, 5);
  const dens = [2, 3, 4, 5, 6, 8];
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
