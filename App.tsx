
import React, { useState, useEffect } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';
import { ScoreScreen } from './components/ScoreScreen';
import { LandingScreen } from './components/LandingScreen';
import { TeacherDashboard } from './components/TeacherDashboard';
import { GameSettings, GameResult } from './types';
import { saveScore, getScores, parseAssignmentFromUrl } from './services/storage';

enum AppState {
  LANDING,
  SETUP,
  TEACHER,
  PLAYING,
  SCORE,
  ASSIGNMENT_READY
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [currentSettings, setCurrentSettings] = useState<GameSettings | null>(null);
  const [currentResult, setCurrentResult] = useState<GameResult | null>(null);
  const [resultsHistory, setResultsHistory] = useState<GameResult[]>([]);
  const [studentName, setStudentName] = useState('');

  // Initial Load
  useEffect(() => {
    // Check for assignment link
    const assignment = parseAssignmentFromUrl();
    if (assignment) {
      setStudentName(assignment.studentName);
      setCurrentSettings(assignment.settings);
      setAppState(AppState.ASSIGNMENT_READY);
    }

    // Load history asynchronously
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const history = await getScores();
    setResultsHistory(history);
  };

  const handleNameEntry = (name: string) => {
    setStudentName(name);
    setAppState(AppState.SETUP);
  };

  const handleTeacherAccess = () => {
    setAppState(AppState.TEACHER);
  };

  const startGame = (settings: GameSettings) => {
    setCurrentSettings(settings);
    setAppState(AppState.PLAYING);
  };

  const startAssignment = () => {
    if (currentSettings) {
      setAppState(AppState.PLAYING);
    }
  };

  const finishGame = async (result: GameResult) => {
    // Augment result with student name
    const finalResult = { ...result, studentName };
    setCurrentResult(finalResult);
    setAppState(AppState.SCORE); // Show score immediately for better UX
    
    // Save to persistence layer in background
    await saveScore(finalResult);
    
    // Refresh history
    await loadHistory();
  };

  const handleAbandon = async (result: GameResult) => {
    // Save incomplete game and return home
    const finalResult = { ...result, studentName };
    await saveScore(finalResult);
    await loadHistory();
    goHome();
  };

  const goHome = () => {
    if (window.location.search) {
      window.history.pushState({}, document.title, window.location.pathname);
    }
    setAppState(AppState.LANDING);
    setStudentName('');
    setCurrentSettings(null);
  };

  const restartGame = () => {
    if (currentSettings) {
      setAppState(AppState.PLAYING);
    } else {
      setAppState(AppState.SETUP);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-brand-bg relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-yellow via-brand-pink to-brand-blue z-50"></div>
      
      {appState === AppState.LANDING && (
        <LandingScreen onStart={handleNameEntry} onTeacherLogin={handleTeacherAccess} />
      )}

      {appState === AppState.TEACHER && (
        <TeacherDashboard onLogout={goHome} />
      )}

      {appState === AppState.ASSIGNMENT_READY && currentSettings && (
        <div className="flex h-full items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center border-4 border-brand-yellow animate-fade-in">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-3xl font-black text-brand-blue mb-2">Special Mission!</h2>
            <p className="text-gray-500 text-lg mb-8">
              Hi <strong>{studentName}</strong>! Your teacher sent you a special practice set.
            </p>
            <button 
              onClick={startAssignment}
              className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold text-2xl shadow-lg hover:scale-105 transition-transform"
            >
              Start Mission
            </button>
          </div>
        </div>
      )}
      
      {appState === AppState.SETUP && (
        <SetupScreen 
          onStart={startGame} 
          lastResults={resultsHistory} 
          studentName={studentName}
        />
      )}
      
      {appState === AppState.PLAYING && currentSettings && (
        <GameScreen 
          settings={currentSettings} 
          onFinish={finishGame} 
          onAbandon={handleAbandon}
        />
      )}
      
      {appState === AppState.SCORE && currentResult && (
        <ScoreScreen 
          result={currentResult} 
          onRestart={restartGame} 
          onHome={goHome} 
        />
      )}
    </div>
  );
};

export default App;
