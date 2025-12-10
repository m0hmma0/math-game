
import React, { useState } from 'react';
import { Play, Lock } from 'lucide-react';

interface LandingScreenProps {
  onStart: (studentName: string) => void;
  onTeacherLogin: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart, onTeacherLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 mt-12 bg-white rounded-3xl shadow-xl border-b-8 border-brand-lightBlue text-center relative">
      <div className="mb-8">
        <h1 className="text-6xl font-black text-brand-blue mb-4 tracking-tighter">Math Whiz<br/><span className="text-brand-yellow text-5xl">Academy</span></h1>
        <p className="text-xl text-gray-500 font-medium">Ready to become a math champion?</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-left">
          <label className="block text-gray-700 font-bold mb-2 ml-1">What is your name?</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full px-6 py-4 text-2xl font-bold border-4 border-gray-200 rounded-2xl focus:border-brand-blue focus:outline-none transition-colors placeholder:text-gray-300"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full py-5 bg-brand-green hover:bg-green-500 text-white rounded-2xl font-black text-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <Play fill="currentColor" /> LETS GO!
        </button>
      </form>

      <button
        onClick={onTeacherLogin}
        className="mt-12 text-sm font-bold text-gray-300 hover:text-brand-blue flex items-center gap-1 mx-auto transition-colors"
      >
        <Lock size={14} /> Teacher Access
      </button>
    </div>
  );
};
