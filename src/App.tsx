/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Upload,
  Trophy,
  BookOpen,
} from 'lucide-react';
import { UploadScreen } from './screens/UploadScreen';
import { WorkspaceScreen } from './screens/WorkspaceScreen';
import { QuizScreen } from './screens/QuizScreen';
import { MasteryScreen } from './screens/MasteryScreen';
import { LevelProgressBar } from './components/LevelProgressBar';
import {
  UploadNotesResponse,
  QuizDifficulty,
  StudentProfile,
} from './types';
import { checkBackendHealth, getStudentProfile } from './services/api';

export default function App() {
  const [activeSession, setActiveSession] = useState<UploadNotesResponse | null>(null);
  const [currentView, setCurrentView] = useState<'upload' | 'workspace' | 'quiz' | 'mastery'>('upload');
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  // Student Profile (XP, Level, Badges, Mastery)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  // Selected Quiz Settings
  const [quizConfig, setQuizConfig] = useState<{
    numQuestions: number;
    difficulty: QuizDifficulty;
  }>({
    numQuestions: 5,
    difficulty: 'Medium',
  });

  // Pre-filled question when AI Tutor action is triggered from Topic Mastery Map
  const [initialWorkspaceQuestion, setInitialWorkspaceQuestion] = useState<string>('');

  const refreshProfile = () => {
    getStudentProfile()
      .then((p) => setStudentProfile(p))
      .catch((e) => console.error('Error fetching student profile:', e));
  };

  useEffect(() => {
    checkBackendHealth()
      .then(() => setIsBackendHealthy(true))
      .catch(() => setIsBackendHealthy(false));

    refreshProfile();
  }, []);

  const handleSessionStarted = (session: UploadNotesResponse) => {
    setActiveSession(session);
    setInitialWorkspaceQuestion('');
    setCurrentView('workspace');
    refreshProfile();
  };

  const handleResetSession = () => {
    setActiveSession(null);
    setInitialWorkspaceQuestion('');
    setCurrentView('upload');
    refreshProfile();
  };

  const handleOpenQuiz = (options?: { numQuestions: number; difficulty: QuizDifficulty }) => {
    if (options) {
      setQuizConfig(options);
    }
    setCurrentView('quiz');
  };

  const handleStartQuizOnTopic = (topic: string) => {
    // If active session is on another topic, keep session but test topic
    setQuizConfig({
      numQuestions: 5,
      difficulty: 'Medium',
    });
    setCurrentView('quiz');
  };

  const handleAskExplainTopic = (topic: string) => {
    setInitialWorkspaceQuestion(
      `Please provide a clear, comprehensive breakdown of ${topic} based on our study material, highlighting the key concepts, definitions, and mechanisms.`
    );
    if (activeSession) {
      setCurrentView('workspace');
    } else {
      // If no active session, ask user to paste notes or start session
      setCurrentView('upload');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            onClick={handleResetSession}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  StudyMate AI
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  CTRL + KNOWLEDGE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Evidence-Grounded Study Notes Assistant
              </p>
            </div>
          </div>

          {/* Right Navigation & Status */}
          <div className="flex items-center gap-3">
            {/* Live Student Level & XP Progress Bar */}
            {studentProfile && (
              <LevelProgressBar
                xp={studentProfile.xp}
                level={studentProfile.level}
                compact
                onOpenMastery={() => setCurrentView('mastery')}
              />
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              {activeSession && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentView('workspace')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      currentView === 'workspace'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('quiz')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      currentView === 'quiz'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Quiz
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setCurrentView('mastery')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'mastery'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Mastery</span>
              </button>
            </div>

            {/* Backend Health Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-600">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendHealthy === true
                    ? 'bg-emerald-500'
                    : isBackendHealthy === false
                    ? 'bg-red-500'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span>{isBackendHealthy ? 'Fast AI Active' : 'Checking Backend...'}</span>
            </div>

            {activeSession && (
              <button
                type="button"
                onClick={handleResetSession}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Upload New Notes"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body View */}
      <main className="flex-1">
        {currentView === 'mastery' && studentProfile ? (
          <MasteryScreen
            profile={studentProfile}
            activeSessionTopic={activeSession?.topic}
            activeSessionId={activeSession?.session_id}
            onBack={() => setCurrentView(activeSession ? 'workspace' : 'upload')}
            onStartQuizOnTopic={handleStartQuizOnTopic}
            onAskExplainTopic={handleAskExplainTopic}
          />
        ) : currentView === 'upload' || !activeSession ? (
          <UploadScreen onSessionStarted={handleSessionStarted} />
        ) : currentView === 'workspace' ? (
          <WorkspaceScreen
            session={activeSession}
            initialQuestion={initialWorkspaceQuestion}
            onOpenQuiz={handleOpenQuiz}
            onViewMastery={() => setCurrentView('mastery')}
            onResetSession={handleResetSession}
          />
        ) : (
          <QuizScreen
            session={activeSession}
            initialNumQuestions={quizConfig.numQuestions}
            initialDifficulty={quizConfig.difficulty}
            onBackToWorkspace={() => setCurrentView('workspace')}
            onViewMastery={() => setCurrentView('mastery')}
            onProfileUpdated={(updated) => setStudentProfile(updated)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>&copy; {new Date().getFullYear()} StudyMate AI &bull; CTRL + KNOWLEDGE Academic Project</p>
          <p className="flex items-center gap-1.5 font-medium">
            <span>Powered by Gemma 4 Inference, PyMuPDF & Full-Stack Engine</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
