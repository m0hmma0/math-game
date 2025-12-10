
import React, { useState, useEffect, useRef } from 'react';
import { GameMode, GameSettings, Question, GameResult } from '../types';
import { generateQuestions, checkAnswer } from '../services/mathUtils';
import { getTutorExplanation } from '../services/geminiService';
import { FractionDisplay } from './FractionDisplay';
import { Timer, HelpCircle, ArrowRight, CheckCircle2, XCircle, Wrench } from 'lucide-react';

interface GameScreenProps {
  settings: GameSettings;
  onFinish: (result: GameResult) => void;
  onAbandon: (result: GameResult) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ settings, onFinish, onAbandon }) => {
  // Game State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.timeLimitSeconds);
  
  // UI State
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState(''); // Denominator
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [showTutor, setShowTutor] = useState(false);
  const [tutorText, setTutorText] = useState('');
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  // Logic State
  const [history, setHistory] = useState<GameResult['history']>([]);
  
  // Retry Mode State
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [retryQueue, setRetryQueue] = useState<Question[]>([]);
  const [retryIndex, setRetryIndex] = useState(0);
  const [totalRetryAttempts, setTotalRetryAttempts] = useState(0);
  const [showRetryIntro, setShowRetryIntro] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Initialization
  useEffect(() => {
    const qs = generateQuestions(settings);
    setQuestions(qs);
    setStartTime(Date.now());
  }, [settings]);

  // Focus Management
  useEffect(() => {
    if (questions.length > 0 && !showTutor && !showRetryIntro) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [currentIndex, retryIndex, questions, showTutor, showRetryIntro, isRetryMode]);

  // Timer
  useEffect(() => {
    if (settings.timeLimitSeconds === 0 || isRetryMode || showRetryIntro) return;
    
    if (timeLeft <= 0) {
      handleRoundEnd();
      return;
    }
    const timer = setInterval(() => {
      if (!showTutor) { 
        setTimeLeft(prev => prev - 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, settings.timeLimitSeconds, showTutor, isRetryMode, showRetryIntro]);

  // AI Tutor
  const handleExplain = async () => {
    if (isTutorLoading) return;
    setIsTutorLoading(true);
    setShowTutor(true);
    const q = isRetryMode ? retryQueue[retryIndex] : questions[currentIndex];
    const explanation = await getTutorExplanation(q);
    setTutorText(explanation);
    setIsTutorLoading(false);
  };

  const closeTutor = () => {
    setShowTutor(false);
    setTutorText('');
    inputRef.current?.focus();
  };

  // Submission Logic
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (feedback !== 'none') return;

    const currentQ = isRetryMode ? retryQueue[retryIndex] : questions[currentIndex];
    const val1 = parseInt(input1);
    const val2 = input2 ? parseInt(input2) : undefined;

    if (isNaN(val1)) return;

    const isCorrect = checkAnswer(currentQ, val1, val2);

    if (isRetryMode) {
      handleRetrySubmit(isCorrect);
    } else {
      handleMainSubmit(currentQ, val1, val2, isCorrect);
    }
  };

  const handleMainSubmit = (q: Question, val1: number, val2: number | undefined, isCorrect: boolean) => {
    setFeedback(isCorrect ? 'correct' : 'wrong');

    setHistory(prev => [...prev, {
      question: q,
      userAnswer: q.type === GameMode.TIMES_TABLES ? `${val1}` : `${val1}/${val2}`,
      isCorrect,
      timeTaken: (Date.now() - startTime) / 1000
    }]);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        resetInput();
      } else {
        handleRoundEnd();
      }
    }, 1000);
  };

  const handleRetrySubmit = (isCorrect: boolean) => {
    if (isCorrect) {
      setFeedback('correct');
      // Delay and move to next retry question
      setTimeout(() => {
        if (retryIndex < retryQueue.length - 1) {
          setRetryIndex(prev => prev + 1);
          resetInput();
        } else {
          // All retries done
          finishGameWithRetries();
        }
      }, 1000);
    } else {
      // Wrong answer in retry mode
      setFeedback('wrong');
      setTotalRetryAttempts(prev => prev + 1);
      // Shake animation plays, then we reset feedback to allow retry on same question
      setTimeout(() => {
         setFeedback('none');
         setInput1('');
         setInput2('');
         inputRef.current?.focus();
      }, 800);
    }
  };

  const resetInput = () => {
    setInput1('');
    setInput2('');
    setFeedback('none');
    setStartTime(Date.now());
  };

  // Transition Logic
  const historyRef = useRef<GameResult['history']>([]);
  useEffect(() => { historyRef.current = history; }, [history]);

  const handleRoundEnd = () => {
    // Identify wrong answers from history
    const finalHistory = historyRef.current;
    
    // Note: If timer ran out, we only retry questions that were ATTEMPTED and WRONG.
    // Unattempted questions are ignored for retry to keep it focused on correction.
    const wrongQuestions = finalHistory
      .filter(h => !h.isCorrect)
      .map(h => h.question);

    if (wrongQuestions.length > 0) {
      setRetryQueue(wrongQuestions);
      setShowRetryIntro(true);
    } else {
      finishGameWithRetries();
    }
  };

  const startRetryPhase = () => {
    setShowRetryIntro(false);
    setIsRetryMode(true);
    setRetryIndex(0);
    resetInput();
  };

  const finishGameWithRetries = () => {
    const finalHistory = historyRef.current;
    const score = finalHistory.filter(h => h.isCorrect).length;
    // @ts-ignore - studentName added in App.tsx
    onFinish({
      score,
      totalQuestions: questions.length,
      date: new Date().toISOString(),
      mode: settings.mode,
      retryCount: totalRetryAttempts,
      history: finalHistory,
      completed: true
    });
  };

  const handleExit = () => {
    const finalHistory = historyRef.current;
    const score = finalHistory.filter(h => h.isCorrect).length;
    // @ts-ignore - studentName added in App.tsx
    onAbandon({
      score,
      totalQuestions: questions.length,
      date: new Date().toISOString(),
      mode: settings.mode,
      retryCount: totalRetryAttempts,
      history: finalHistory,
      completed: false
    });
  };

  // Render Helpers
  if (questions.length === 0) return <div className="p-10 text-center font-bold text-2xl animate-pulse">Loading Math Engine...</div>;

  const currentQ = isRetryMode ? retryQueue[retryIndex] : questions[currentIndex];
  const progress = isRetryMode 
    ? ((retryIndex) / retryQueue.length) * 100 
    : ((currentIndex) / questions.length) * 100;

  return (
    <div className={`max-w-3xl mx-auto p-4 flex flex-col h-screen max-h-[900px] ${isRetryMode ? 'bg-orange-50/50' : ''}`}>
      
      {/* Retry Intro Modal */}
      {showRetryIntro && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in">
             <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
               <Wrench size={40} />
             </div>
             <h2 className="text-3xl font-black text-gray-800 mb-2">Round Complete!</h2>
             <p className="text-gray-500 text-lg mb-8">
               You have <strong>{retryQueue.length}</strong> tricky questions to fix. 
               <br/>Let's master them before we finish!
             </p>
             <button 
               onClick={startRetryPhase}
               className="w-full py-4 bg-brand-blue hover:bg-brand-lightBlue text-white rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
             >
               Start Repairs
             </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative z-10">
        <button onClick={handleExit} className="text-gray-400 hover:text-red-500 font-bold text-sm">EXIT</button>
        <div className="flex items-center gap-2 font-mono text-xl text-brand-blue font-bold">
           {isRetryMode ? (
             <span className="flex items-center gap-2 text-orange-500">
               <Wrench size={18} /> Fixing {retryIndex + 1} / {retryQueue.length}
             </span>
           ) : (
             <span>{currentIndex + 1} / {questions.length}</span>
           )}
        </div>
        {!isRetryMode && settings.timeLimitSeconds > 0 && (
          <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-brand-green'}`}>
            <Timer size={20} />
            <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-8 overflow-hidden">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ${isRetryMode ? 'bg-orange-400' : 'bg-brand-blue'}`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        
        {/* Tutor Modal */}
        {showTutor && (
          <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center animate-fade-in shadow-2xl border-4 border-brand-yellow">
             {isTutorLoading ? (
               <div className="animate-bounce text-4xl">🤔 Thinking...</div>
             ) : (
               <>
                <div className="text-6xl mb-4">💡</div>
                <h3 className="text-2xl font-bold text-brand-blue mb-4">Math Buddy says:</h3>
                <p className="text-xl text-gray-700 font-medium leading-relaxed mb-8">{tutorText}</p>
                <button 
                  onClick={closeTutor}
                  className="px-8 py-3 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
                >
                  Got it, thanks!
                </button>
               </>
             )}
          </div>
        )}

        {/* Question Display */}
        <div className={`transition-all duration-300 transform ${feedback === 'correct' ? 'scale-110' : feedback === 'wrong' ? 'shake' : ''}`}>
           {currentQ.type === GameMode.TIMES_TABLES && (
             <div className="text-8xl font-black text-gray-800 tracking-tighter flex items-center gap-4">
               <span>{currentQ.data.val1}</span>
               <span className="text-brand-lightBlue">×</span>
               <span>{currentQ.data.val2}</span>
               <span className="text-gray-300">=</span>
             </div>
           )}

           {currentQ.type === GameMode.FRACTIONS_OPS && (
             <div className="flex items-center gap-6 text-6xl md:text-8xl font-black text-gray-800">
               <FractionDisplay fraction={currentQ.data.fraction1} size="xl" />
               <span className="text-brand-pink mx-2">{currentQ.data.operator}</span>
               <FractionDisplay fraction={currentQ.data.fraction2} size="xl" />
               <span className="text-gray-300">=</span>
             </div>
           )}

           {currentQ.type === GameMode.MIXED_TO_IMPROPER && (
             <div className="flex flex-col items-center gap-4">
               <div className="text-2xl font-bold text-gray-500 uppercase tracking-widest">Make Improper</div>
               <div className="flex items-center gap-6 text-8xl font-black text-gray-800">
                 <FractionDisplay mixed={currentQ.data.mixed} size="xl" />
                 <span className="text-gray-300">=</span>
               </div>
             </div>
           )}
        </div>

        {/* Inputs */}
        <form onSubmit={handleSubmit} className="mt-12 flex flex-col items-center gap-4">
           {currentQ.type === GameMode.TIMES_TABLES ? (
             <input
               ref={inputRef}
               type="number"
               value={input1}
               onChange={(e) => setInput1(e.target.value)}
               disabled={feedback !== 'none'}
               className={`w-40 h-24 text-center text-6xl font-bold border-4 rounded-2xl outline-none transition-colors ${
                 feedback === 'correct' ? 'border-brand-green bg-green-50 text-brand-green' : 
                 feedback === 'wrong' ? 'border-red-400 bg-red-50 text-red-500' : 
                 isRetryMode ? 'border-orange-300 focus:border-orange-500' :
                 'border-gray-200 focus:border-brand-blue'
               }`}
               placeholder="?"
               autoFocus
             />
           ) : (
             <div className={`flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm border ${isRetryMode ? 'border-orange-200' : 'border-gray-100'}`}>
                <input
                  ref={inputRef}
                  type="number"
                  value={input1}
                  onChange={(e) => setInput1(e.target.value)}
                  disabled={feedback !== 'none'}
                  className={`w-32 h-20 text-center text-5xl font-bold border-b-4 outline-none transition-colors rounded-t-lg ${
                    feedback === 'correct' ? 'border-brand-green bg-green-50 text-brand-green' : 
                    feedback === 'wrong' ? 'border-red-400 bg-red-50 text-red-500' : 
                    isRetryMode ? 'border-orange-300 focus:border-orange-500 bg-orange-50' :
                    'border-gray-300 focus:border-brand-blue bg-gray-50'
                  }`}
                  placeholder="Num"
                />
                <div className="w-full h-1 bg-gray-800 rounded-full"></div>
                <input
                  type="number"
                  value={input2}
                  onChange={(e) => setInput2(e.target.value)}
                  disabled={feedback !== 'none'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                  }}
                  className={`w-32 h-20 text-center text-5xl font-bold border-t-0 outline-none transition-colors rounded-b-lg ${
                    feedback === 'correct' ? 'bg-green-50 text-brand-green' : 
                    feedback === 'wrong' ? 'bg-red-50 text-red-500' : 
                    isRetryMode ? 'bg-orange-50' :
                    'bg-gray-50'
                  }`}
                  placeholder="Den"
                />
             </div>
           )}

           {/* Feedback / Buttons */}
           <div className="h-20 mt-4 flex items-center justify-center">
             {feedback === 'none' ? (
               <div className="flex gap-4">
                 <button 
                  type="button"
                  onClick={handleExplain}
                  className="w-16 h-16 rounded-full bg-brand-yellow text-yellow-900 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                  title="Ask AI Helper"
                 >
                   <HelpCircle size={32} />
                 </button>
                 <button 
                  type="submit"
                  className={`px-10 py-4 text-white rounded-xl font-bold text-2xl shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center gap-2 ${isRetryMode ? 'bg-orange-500 hover:bg-orange-400' : 'bg-brand-blue hover:bg-brand-lightBlue'}`}
                 >
                   {isRetryMode ? 'Check Fix' : 'Check'} <ArrowRight />
                 </button>
               </div>
             ) : (
               <div className={`flex items-center gap-3 text-4xl font-black ${feedback === 'correct' ? 'text-brand-green' : 'text-red-500'}`}>
                 {feedback === 'correct' ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
                 <span>{feedback === 'correct' ? (isRetryMode ? 'Fixed!' : 'Awesome!') : 'Oops!'}</span>
               </div>
             )}
           </div>
        </form>
      </div>

      {/* Visual Keyboard Spacer for Mobile */}
      <div className="h-8 md:hidden"></div>
      
      <style>{`
        .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};
