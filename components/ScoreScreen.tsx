
import React from 'react';
import { GameResult, GameMode } from '../types';
import { RotateCcw, Star, Home, Calendar, Wrench } from 'lucide-react';

interface ScoreScreenProps {
  result: GameResult;
  onRestart: () => void;
  onHome: () => void;
}

export const ScoreScreen: React.FC<ScoreScreenProps> = ({ result, onRestart, onHome }) => {
  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  
  let message = "";
  let color = "";
  if (percentage === 100) { message = "PERFECT!"; color = "text-brand-green"; }
  else if (percentage >= 80) { message = "Great Job!"; color = "text-brand-blue"; }
  else if (percentage >= 50) { message = "Good Practice!"; color = "text-brand-yellow"; }
  else { message = "Keep Trying!"; color = "text-gray-500"; }

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col items-center animate-fade-in pb-20">
      <div className="w-full text-center mb-8 bg-white p-8 rounded-3xl shadow-xl border-b-8 border-brand-bg relative overflow-hidden">
        {/* Confetti decoration could go here */}
        
        <h2 className={`text-6xl font-black mb-2 ${color} tracking-tight`}>{percentage}%</h2>
        <h3 className="text-2xl font-bold text-gray-400 uppercase tracking-widest mb-6">{message}</h3>
        
        <div className="flex justify-center gap-8 mt-6">
           <div className="flex flex-col items-center">
             <span className="text-4xl font-bold text-gray-800">{result.score}</span>
             <span className="text-xs font-bold text-gray-400 uppercase">Correct</span>
           </div>
           <div className="w-px bg-gray-200"></div>
           <div className="flex flex-col items-center">
             <span className="text-4xl font-bold text-gray-800">{result.totalQuestions}</span>
             <span className="text-xs font-bold text-gray-400 uppercase">Total</span>
           </div>
           
           {result.retryCount > 0 && (
             <>
               <div className="w-px bg-gray-200"></div>
               <div className="flex flex-col items-center animate-bounce">
                 <span className="text-4xl font-bold text-orange-500">{result.retryCount}</span>
                 <span className="text-xs font-bold text-orange-400 uppercase flex items-center gap-1">
                    <Wrench size={12} /> Retries
                 </span>
               </div>
             </>
           )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 w-full mb-8">
        <button 
          onClick={onHome}
          className="flex-1 py-4 rounded-xl bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <Home size={20} /> Home
        </button>
        <button 
          onClick={onRestart}
          className="flex-1 py-4 rounded-xl bg-brand-blue text-white font-bold text-lg hover:bg-brand-lightBlue transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} /> Play Again
        </button>
      </div>

      {/* Review Section */}
      <div className="w-full">
        <div className="flex justify-between items-end mb-4 ml-2">
            <h4 className="font-bold text-gray-400 uppercase tracking-wider text-sm">Round Report</h4>
            {result.retryCount > 0 && (
                <span className="text-xs font-bold text-brand-green bg-green-100 px-2 py-1 rounded-full">
                    All mistakes fixed!
                </span>
            )}
        </div>
        
        <div className="space-y-3">
          {result.history.map((item, idx) => (
            <div key={item.question.id} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white flex justify-between items-center ${item.isCorrect ? 'border-brand-green' : 'border-red-400'}`}>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 mb-1">Question {idx + 1}</span>
                <span className="font-bold text-xl text-gray-800">{item.question.text}</span>
              </div>
              <div className="text-right">
                <span className={`block font-bold text-lg ${item.isCorrect ? 'text-brand-green' : 'text-red-500'}`}>
                   {item.userAnswer}
                </span>
                {!item.isCorrect && (
                   <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded inline-block mt-1">
                     Ans: {item.question.answer.num}{item.question.answer.den ? `/${item.question.answer.den}` : ''}
                   </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
