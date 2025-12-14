
import React, { useState } from 'react';
import { GameMode, GameSettings, GameResult } from '../types';
import { Play, User, Award, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SetupScreenProps {
  onStart: (settings: GameSettings) => void;
  lastResults: GameResult[];
  studentName: string;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, lastResults, studentName }) => {
  const [mode, setMode] = useState<GameMode>(GameMode.TIMES_TABLES);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(0); // 0 = unlimited
  
  // Mode specific state
  const [selectedTables, setSelectedTables] = useState<number[]>([2, 3, 4, 5, 10]);
  const [ops, setOps] = useState<('add' | 'sub' | 'mul' | 'div')[]>(['add', 'sub']);
  const [selectedDenominators, setSelectedDenominators] = useState<number[]>([2, 3, 4, 5, 8, 10]);
  const [maxWholeNumber, setMaxWholeNumber] = useState(5);

  const toggleTable = (num: number) => {
    setSelectedTables(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const toggleOp = (op: 'add' | 'sub' | 'mul' | 'div') => {
    setOps(prev => prev.includes(op) ? prev.filter(o => o !== op) : [...prev, op]);
  };

  const toggleDenominator = (num: number) => {
    setSelectedDenominators(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const handleStart = () => {
    // Validate
    if (mode === GameMode.TIMES_TABLES && selectedTables.length === 0) {
      alert("Please select at least one times table!");
      return;
    }
    if (mode === GameMode.FRACTIONS_OPS && ops.length === 0) {
      alert("Please select at least one operation!");
      return;
    }
    if ((mode === GameMode.FRACTIONS_OPS || mode === GameMode.MIXED_TO_IMPROPER) && selectedDenominators.length === 0) {
      alert("Please select at least one denominator!");
      return;
    }

    onStart({
      mode,
      questionCount,
      timeLimitSeconds: timeLimit,
      selectedTables,
      fractionOps: ops,
      selectedDenominators,
      maxWholeNumber
    });
  };

  // Prepare chart data
  const chartData = lastResults.slice(-5).map((r, i) => ({
    name: `Game ${i + 1}`,
    score: (r.score / r.totalQuestions) * 100,
    mode: r.mode === GameMode.TIMES_TABLES ? 'Tables' : r.mode === GameMode.FRACTIONS_OPS ? 'Fractions' : 'Mixed'
  }));

  const availableDenominators = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl shadow-xl mt-8 border-4 border-brand-lightBlue/30">
      <div className="flex justify-between items-start mb-6">
        <div>
           <h1 className="text-4xl font-black text-brand-blue tracking-tight">Game Setup</h1>
           <p className="text-gray-500">Customize your workout</p>
        </div>
        <div className="flex items-center gap-2 bg-brand-bg px-4 py-2 rounded-full">
          <div className="bg-brand-yellow p-2 rounded-full text-yellow-800">
             <User size={20} />
          </div>
          <span className="font-bold text-gray-700 text-lg">Hi, {studentName}!</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="bg-brand-bg p-4 rounded-xl">
            <label className="block text-brand-blue font-bold mb-3 uppercase tracking-wider text-sm">Game Mode</label>
            <div className="flex flex-col gap-2">
              {[
                { id: GameMode.TIMES_TABLES, label: 'Times Tables', color: 'bg-brand-yellow text-yellow-900' },
                { id: GameMode.FRACTIONS_OPS, label: 'Fractions (+ - × ÷)', color: 'bg-brand-pink text-pink-900' },
                { id: GameMode.MIXED_TO_IMPROPER, label: 'Mixed → Improper', color: 'bg-brand-green text-green-900' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`p-3 rounded-lg font-bold text-left transition-all ${mode === m.id ? `${m.color} ring-2 ring-offset-2 ring-black` : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Times Table Settings */}
          {mode === GameMode.TIMES_TABLES && (
            <div className="bg-brand-bg p-4 rounded-xl animate-fade-in">
              <label className="block text-brand-blue font-bold mb-3 uppercase tracking-wider text-sm">Select Tables</label>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                  <button
                    key={num}
                    onClick={() => toggleTable(num)}
                    className={`w-10 h-10 rounded-full font-bold transition-transform active:scale-95 ${selectedTables.includes(num) ? 'bg-brand-blue text-white shadow-lg scale-110' : 'bg-white text-gray-500'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fraction Ops Settings */}
          {mode === GameMode.FRACTIONS_OPS && (
            <div className="bg-brand-bg p-4 rounded-xl animate-fade-in">
              <label className="block text-brand-blue font-bold mb-3 uppercase tracking-wider text-sm">Operations</label>
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'add', label: '+' },
                  { id: 'sub', label: '-' },
                  { id: 'mul', label: '×' },
                  { id: 'div', label: '÷' },
                ].map((op) => (
                  <button
                    key={op.id}
                    onClick={() => toggleOp(op.id as any)}
                    className={`w-12 h-12 rounded-lg font-bold text-xl transition-all ${ops.includes(op.id as any) ? 'bg-brand-pink text-white shadow-md' : 'bg-white text-gray-400'}`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shared Fraction/Mixed Settings: Denominators */}
          {(mode === GameMode.FRACTIONS_OPS || mode === GameMode.MIXED_TO_IMPROPER) && (
            <div className="bg-brand-bg p-4 rounded-xl animate-fade-in">
              <label className="block text-brand-blue font-bold mb-3 uppercase tracking-wider text-sm">Select Denominators</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {availableDenominators.map(num => (
                  <button
                    key={num}
                    onClick={() => toggleDenominator(num)}
                    className={`w-10 h-10 rounded-lg font-bold transition-transform active:scale-95 ${selectedDenominators.includes(num) ? 'bg-purple-500 text-white shadow-lg scale-110' : 'bg-white text-gray-500'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              {/* Select All / Clear */}
               <div className="flex gap-2">
                 <button onClick={() => setSelectedDenominators(availableDenominators)} className="text-xs bg-gray-200 px-2 py-1 rounded font-bold text-gray-600">All</button>
                 <button onClick={() => setSelectedDenominators([2, 4, 5, 10])} className="text-xs bg-gray-200 px-2 py-1 rounded font-bold text-gray-600">Simple</button>
               </div>
            </div>
          )}
          
          {/* Mixed Numbers Specific: Whole Number Range */}
          {mode === GameMode.MIXED_TO_IMPROPER && (
             <div className="bg-brand-bg p-4 rounded-xl animate-fade-in">
               <label className="block text-brand-blue font-bold mb-3 uppercase tracking-wider text-sm">Max Whole Number</label>
               <div className="flex items-center gap-4">
                 <input 
                   type="range" min="1" max="20" step="1" 
                   value={maxWholeNumber} 
                   onChange={(e) => setMaxWholeNumber(Number(e.target.value))}
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-green"
                 />
                 <span className="font-bold text-2xl text-brand-green w-12 text-center">{maxWholeNumber}</span>
               </div>
             </div>
          )}

        </div>

        <div className="space-y-6">
           {/* Global Settings */}
           <div className="bg-brand-bg p-4 rounded-xl">
            <label className="block text-brand-blue font-bold mb-3 uppercase tracking-wider text-sm">Details</label>
            
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 font-medium">Questions</span>
                <span className="font-bold text-brand-blue">{questionCount}</span>
              </div>
              <input 
                type="range" min="5" max="50" step="5" 
                value={questionCount} 
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 font-medium">Time Limit per Round</span>
                <span className="font-bold text-brand-blue">{timeLimit === 0 ? 'Unlimited' : `${timeLimit}s`}</span>
              </div>
              <input 
                type="range" min="0" max="300" step="30" 
                value={timeLimit} 
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
              />
            </div>
          </div>

          {/* Stats */}
          {lastResults.length > 0 && (
             <div className="bg-white p-4 rounded-xl border-2 border-gray-100 h-48">
               <div className="flex items-center gap-2 mb-2 text-gray-500 font-bold text-xs uppercase">
                 <Award size={16} /> Recent Performance
               </div>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                   <XAxis dataKey="name" hide />
                   <Tooltip cursor={{fill: 'transparent'}} />
                   <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.mode === 'Tables' ? '#FCD34D' : entry.mode === 'Fractions' ? '#F472B6' : '#34D399'} />
                      ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          )}

          <button 
            onClick={handleStart}
            className="w-full py-5 bg-brand-blue hover:bg-brand-lightBlue text-white rounded-2xl font-black text-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <Play fill="currentColor" /> START GAME
          </button>
        </div>
      </div>
    </div>
  );
};
