
import React, { useState, useEffect } from 'react';
import { GameMode, GameResult, GameSettings } from '../types';
import { getAllScores, generateAssignmentLink, clearScores } from '../services/storage';
import { LogOut, Link as LinkIcon, Trash2, Check, Copy, Lock, AlertCircle, Clock, ListFilter } from 'lucide-react';

interface TeacherDashboardProps {
  onLogout: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onLogout }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'scores' | 'assign'>('scores');

  // Login Logic
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Case-insensitive check and trim whitespace for better user experience
    if (password.trim().toLowerCase() === 'admin') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try "admin"');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-gray-200 animate-fade-in">
        <div className="flex justify-center mb-6 text-brand-blue">
            <div className="p-4 bg-blue-50 rounded-full">
                <Lock size={32} />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Teacher Portal</h2>
        <p className="text-gray-500 text-center mb-6 text-sm">Restricted Access</p>
        
        <form onSubmit={handleLogin}>
          <div className="relative">
             <input
                type="password"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                }}
                placeholder="Password"
                className={`w-full p-4 border-2 rounded-xl mb-4 focus:outline-none transition-colors ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-brand-blue'}`}
                autoFocus
              />
          </div>
          
          {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm font-bold mb-4 animate-pulse">
                  <AlertCircle size={16} />
                  {error}
              </div>
          )}
          
          <button type="submit" className="w-full py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-lightBlue transition-colors shadow-lg">
            Unlock Dashboard
          </button>
        </form>
        <button onClick={onLogout} className="mt-6 text-center w-full text-gray-400 text-sm hover:text-gray-600 font-bold">
          Return to Game
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-3xl shadow-xl mt-8 min-h-[600px] flex flex-col">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
          <p className="text-gray-500">Manage classroom progress</p>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('scores')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'scores' ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          View Scores
        </button>
        <button
          onClick={() => setActiveTab('assign')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'assign' ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Create Assignment
        </button>
      </div>

      <div className="flex-1">
        {activeTab === 'scores' ? <ScoresView /> : <CreateAssignmentView />}
      </div>
    </div>
  );
};

const ScoresView: React.FC = () => {
  const [scores, setScores] = useState<GameResult[]>([]);

  useEffect(() => {
    setScores(getAllScores().reverse()); // Newest first
  }, []);

  const handleClear = () => {
    if (confirm("Are you sure you want to delete all student scores?")) {
      clearScores();
      setScores([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={handleClear} className="text-red-400 text-sm hover:text-red-600 flex items-center gap-1">
          <Trash2 size={14} /> Clear History
        </button>
      </div>
      
      {scores.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          No scores recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-500 text-sm border-b border-gray-200">
                <th className="p-3 font-bold uppercase">Date</th>
                <th className="p-3 font-bold uppercase">Student</th>
                <th className="p-3 font-bold uppercase">Mode</th>
                <th className="p-3 font-bold uppercase text-center">Score</th>
                <th className="p-3 font-bold uppercase text-center">Retries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scores.map((s, i) => (
                <tr key={i} className="hover:bg-blue-50 transition-colors">
                  <td className="p-3 text-gray-600 font-mono text-sm">
                    {new Date(s.date).toLocaleDateString()} {new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="p-3 font-bold text-gray-800">{s.studentName}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      s.mode === GameMode.TIMES_TABLES ? 'bg-yellow-100 text-yellow-700' :
                      s.mode === GameMode.FRACTIONS_OPS ? 'bg-pink-100 text-pink-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {s.mode.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`font-bold ${s.score === s.totalQuestions ? 'text-green-600' : 'text-gray-800'}`}>
                      {s.score}/{s.totalQuestions}
                    </span>
                  </td>
                  <td className="p-3 text-center text-gray-500">
                    {s.retryCount > 0 ? <span className="text-orange-500 font-bold">{s.retryCount}</span> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const CreateAssignmentView: React.FC = () => {
  const [studentName, setStudentName] = useState('');
  const [mode, setMode] = useState<GameMode>(GameMode.TIMES_TABLES);
  const [count, setCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(0);
  const [selectedTables, setSelectedTables] = useState<number[]>([2, 3, 4, 5, 10]);
  const [ops, setOps] = useState<('add' | 'sub' | 'mul' | 'div')[]>(['add', 'sub']);
  
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const toggleTable = (num: number) => {
    setSelectedTables(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const toggleOp = (op: 'add' | 'sub' | 'mul' | 'div') => {
    setOps(prev => prev.includes(op) ? prev.filter(o => o !== op) : [...prev, op]);
  };

  const createLink = () => {
    if (!studentName) { alert('Enter a student name'); return; }
    if (mode === GameMode.TIMES_TABLES && selectedTables.length === 0) { alert('Select at least one table'); return; }
    if (mode === GameMode.FRACTIONS_OPS && ops.length === 0) { alert('Select at least one operation'); return; }
    
    const settings: GameSettings = {
      mode,
      questionCount: count,
      timeLimitSeconds: timeLimit,
      selectedTables,
      fractionOps: ops
    };

    const link = generateAssignmentLink(studentName, settings);
    setGeneratedLink(link);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6 overflow-y-auto max-h-[500px] pr-2">
        <div>
          <label className="block text-gray-700 font-bold mb-2">Student Name</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-blue outline-none"
            placeholder="e.g., Alex Smith"
          />
        </div>

        <div>
           <label className="block text-gray-700 font-bold mb-2">Game Mode</label>
           <div className="flex flex-col gap-2">
              {[GameMode.TIMES_TABLES, GameMode.FRACTIONS_OPS, GameMode.MIXED_TO_IMPROPER].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`p-3 rounded-lg text-left font-medium border-2 transition-all ${mode === m ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  {m.replace(/_/g, ' ')}
                </button>
              ))}
           </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 font-bold flex items-center gap-2"><ListFilter size={16}/> Questions</label>
            <span className="font-bold text-brand-blue">{count}</span>
          </div>
          <input type="range" min="5" max="30" step="5" value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-brand-blue" />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 font-bold flex items-center gap-2"><Clock size={16}/> Time Limit (Sec)</label>
            <span className="font-bold text-brand-blue">{timeLimit === 0 ? 'No Limit' : `${timeLimit}s`}</span>
          </div>
          <input type="range" min="0" max="300" step="30" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="w-full accent-brand-blue" />
        </div>

        {mode === GameMode.TIMES_TABLES && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-gray-700 font-bold mb-2 text-sm uppercase">Select Tables</label>
            <div className="flex flex-wrap gap-2">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                <button
                  key={num}
                  onClick={() => toggleTable(num)}
                  className={`w-8 h-8 text-sm rounded-full font-bold transition-all ${selectedTables.includes(num) ? 'bg-brand-blue text-white shadow-md' : 'bg-white text-gray-400 border border-gray-200'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === GameMode.FRACTIONS_OPS && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-gray-700 font-bold mb-2 text-sm uppercase">Operations</label>
            <div className="flex gap-2">
              {[
                { id: 'add', label: '+' },
                { id: 'sub', label: '-' },
                { id: 'mul', label: '×' },
                { id: 'div', label: '÷' },
              ].map((op) => (
                <button
                  key={op.id}
                  onClick={() => toggleOp(op.id as any)}
                  className={`w-10 h-10 rounded-lg font-bold text-lg transition-all ${ops.includes(op.id as any) ? 'bg-brand-pink text-white shadow-md' : 'bg-white text-gray-400 border border-gray-200'}`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={createLink}
          className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-lightBlue transition-colors flex items-center justify-center gap-2"
        >
          <LinkIcon size={20} /> Generate Assignment Link
        </button>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 flex flex-col justify-center h-full max-h-[500px]">
        {!generatedLink ? (
          <div className="text-center text-gray-400">
            <LinkIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>Configure settings and click generate to create a unique link for your student.</p>
          </div>
        ) : (
          <div className="animate-fade-in flex flex-col h-full">
            <h3 className="text-green-600 font-bold mb-4 flex items-center gap-2">
              <Check size={20} /> Link Generated!
            </h3>
            <div className="bg-white p-4 rounded-xl border border-gray-200 break-all text-xs font-mono text-gray-500 mb-4 overflow-y-auto flex-1">
              {generatedLink}
            </div>
            <button
              onClick={copyToClipboard}
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-gray-800 text-white hover:bg-black'}`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied to Clipboard' : 'Copy Link'}
            </button>
            <p className="mt-4 text-sm text-gray-500 text-center">
              Send this link to <strong>{studentName}</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
