import { GoogleGenAI } from "@google/genai";
import { Question, GameMode } from '../types';

let ai: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const getTutorExplanation = async (question: Question): Promise<string> => {
  if (!ai) {
    return "AI Tutor is not configured (Missing API Key).";
  }

  try {
    let prompt = "";
    if (question.type === GameMode.TIMES_TABLES) {
      prompt = `Explain how to solve ${question.data.val1} times ${question.data.val2} to a 7-year-old using repeated addition or a fun trick. Keep it under 2 sentences.`;
    } else if (question.type === GameMode.FRACTIONS_OPS) {
      const { fraction1, fraction2, operator } = question.data;
      const opName = operator === '+' ? 'add' : operator === '-' ? 'subtract' : operator === '×' ? 'multiply' : 'divide';
      prompt = `Explain simply how to ${opName} the fractions ${fraction1?.num}/${fraction1?.den} and ${fraction2?.num}/${fraction2?.den}. Step by step for a child. Max 3 sentences.`;
    } else if (question.type === GameMode.MIXED_TO_IMPROPER) {
       const { mixed } = question.data;
       prompt = `Explain how to turn the mixed number ${mixed?.whole} and ${mixed?.fraction.num}/${mixed?.fraction.den} into an improper fraction. Use the "Multiply then Add" method. Keep it encouraging and short.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a friendly, encouraging, and colorful primary school math teacher. Use emojis."
      }
    });

    return response.text || "Sorry, I couldn't come up with an explanation right now!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Oops! My brain is tired. Ask your teacher for help!";
  }
};
