import React, { useState } from 'react';
import {
  Send,
  BookOpen,
  FileText,
  BookmarkCheck,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileQuestion,
  GraduationCap,
  ShieldAlert,
  Sliders,
  Trophy,
} from 'lucide-react';
import { askQuestion } from '../services/api';
import {
  UploadNotesResponse,
  AskQuestionResponse,
  QAHistoryItem,
  EvidenceStatus,
  QuizDifficulty,
} from '../types';

interface WorkspaceScreenProps {
  session: UploadNotesResponse;
  initialQuestion?: string;
  onOpenQuiz: (options: { numQuestions: number; difficulty: QuizDifficulty }) => void;
  onViewMastery?: () => void;
  onResetSession: () => void;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({
  session,
  initialQuestion,
  onOpenQuiz,
  onViewMastery,
  onResetSession,
}) => {
  const [question, setQuestion] = useState(initialQuestion || '');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<AskQuestionResponse | null>(null);
  const [qaHistory, setQaHistory] = useState<QAHistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quiz custom options
  const [quizNumQuestions, setQuizNumQuestions] = useState<number>(3);
  const [quizDifficulty, setQuizDifficulty] = useState<QuizDifficulty>('Medium');
  const [showQuizConfigModal, setShowQuizConfigModal] = useState(false);

  const handleAsk = async () => {
    const qToAsk = question.trim();
    if (!qToAsk) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const resp = await askQuestion(session.session_id, qToAsk);
      setCurrentResponse(resp);

      const historyItem: QAHistoryItem = {
        id: Date.now().toString(),
        question: resp.question,
        answer: resp.answer,
        evidence_status: resp.evidence_status,
        sources: resp.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setQaHistory((prev) => [historyItem, ...prev]);
      setQuestion('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to get answer. Please check your network or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: EvidenceStatus) => {
    switch (status) {
      case 'Supported':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
            <BookmarkCheck className="w-4 h-4 text-emerald-600" />
            Evidence Supported
          </span>
        );
      case 'Partially Supported':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Partially Supported
          </span>
        );
      case 'Out of Syllabus':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full text-xs font-bold animate-pulse">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            Out of Syllabus
          </span>
        );
      case 'Not Found':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold">
            <XCircle className="w-4 h-4 text-slate-500" />
            Not Found in Notes
          </span>
        );
    }
  };

  const startConfiguredQuiz = () => {
    onOpenQuiz({
      numQuestions: quizNumQuestions,
      difficulty: quizDifficulty,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Session Top Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Active Session
            </span>
            <span className="text-xs text-slate-500">ID: {session.session_id.slice(0, 8)}...</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{session.topic}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
            <span className="inline-flex items-center gap-1 font-medium">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> {session.document_name}
            </span>
            <span>&bull;</span>
            <span>{session.total_pages} {session.total_pages === 1 ? 'Page' : 'Pages'}</span>
            <span>&bull;</span>
            <span>{session.total_chunks} Searchable Passages</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onViewMastery && (
            <button
              type="button"
              onClick={onViewMastery}
              className="px-3.5 py-2 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="View Topic Mastery & Badges"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" /> Mastery & Badges
            </button>
          )}
          <button
            type="button"
            onClick={onResetSession}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            title="Upload different notes"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Change Material
          </button>
          <button
            type="button"
            onClick={() => setShowQuizConfigModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4" /> Start Quiz
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Q&A Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Input Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <label htmlFor="question-input" className="block text-sm font-bold text-slate-900 mb-2">
              Ask a question about your study notes
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex gap-2"
            >
              <input
                id="question-input"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about formulas, definitions, key steps, or concepts in your notes..."
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-medium"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ask</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to Complete Request</p>
                <p className="text-red-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">Searching your notes & verifying syllabus...</p>
              <p className="text-xs text-slate-500 mt-1">Filtering out-of-syllabus questions & checking page citations</p>
            </div>
          )}

          {/* Current Answer Display */}
          {currentResponse && !isLoading && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Gemma 4 StudyMate Response
                  </span>
                </div>
                <div>{getStatusBadge(currentResponse.evidence_status)}</div>
              </div>

              <div className="p-6 space-y-6">
                {/* Question repeated */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Question</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{currentResponse.question}</p>
                </div>

                {/* OUT OF SYLLABUS DEDICATED POPUP / BANNER */}
                {currentResponse.evidence_status === 'Out of Syllabus' ? (
                  <div className="p-5 bg-red-50 border-2 border-red-300 rounded-2xl text-red-900 space-y-2.5">
                    <div className="flex items-center gap-2.5 font-bold text-base text-red-800">
                      <ShieldAlert className="w-6 h-6 text-red-600" />
                      <span>Out of Syllabus Alert</span>
                    </div>
                    <p className="text-sm leading-relaxed text-red-800 font-medium">
                      {currentResponse.answer}
                    </p>
                    <div className="text-xs text-red-700 bg-white/70 p-3 rounded-xl border border-red-200">
                      <strong>Academic Grounding Protection:</strong> To ensure reliable studying and avoid misleading answers, StudyMate AI refuses to answer questions not covered in your uploaded notes or textbook.
                    </div>
                  </div>
                ) : (
                  /* Standard Grounded Answer */
                  <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed text-base">
                    <p className="whitespace-pre-wrap">{currentResponse.answer}</p>
                  </div>
                )}

                {/* Real Source Passages & Page Citations */}
                {currentResponse.evidence_status !== 'Out of Syllabus' && (
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        Supporting Notes Sources ({currentResponse.sources.length})
                      </h4>
                      {currentResponse.sources.length === 0 && (
                        <span className="text-xs text-slate-500 italic">No notes passages matched this query</span>
                      )}
                    </div>

                    {currentResponse.sources.length > 0 && (
                      <div className="space-y-3">
                        {currentResponse.sources.map((src, idx) => (
                          <div
                            key={idx}
                            className="bg-indigo-50/40 border border-indigo-200/80 rounded-xl p-4 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between font-semibold text-indigo-900">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-bold">
                                  Page {src.page_number}
                                </span>
                                <span>{src.document_name}</span>
                              </span>
                              <span className="text-indigo-600 font-mono text-[11px]">
                                Relevance: {(src.relevance_score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-slate-700 italic font-serif leading-relaxed bg-white/70 p-2.5 rounded border border-indigo-100/60">
                              "{src.passage}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Past Questions History */}
          {qaHistory.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-slate-500" />
                Previous Questions in this Session ({qaHistory.length})
              </h3>
              <div className="space-y-3">
                {qaHistory.slice(1).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 border border-slate-200 rounded-xl hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-900">{item.question}</span>
                      <span className="text-slate-400">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{item.answer}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {getStatusBadge(item.evidence_status)}
                      {item.sources.length > 0 && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {item.sources.length} {item.sources.length === 1 ? 'citation' : 'citations'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Customized Quiz Launcher & Passages */}
        <div className="space-y-6">
          {/* Enhanced Quiz Card with Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-3">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>Knowledge Quiz Setup</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Customize your self-test quiz based on your uploaded notes.
            </p>

            {/* Select Number of Questions */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[3, 5, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuizNumQuestions(num)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      quizNumQuestions === num
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Select Difficulty Level */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Easy', 'Medium', 'Hard'] as QuizDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setQuizDifficulty(diff)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      quizDifficulty === diff
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {diff === 'Easy' && '🌱 '}
                    {diff === 'Medium' && '⚡ '}
                    {diff === 'Hard' && '🔥 '}
                    {diff}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 italic">
                {quizDifficulty === 'Easy' && 'Direct factual definitions and key terms.'}
                {quizDifficulty === 'Medium' && 'Conceptual relationships and process steps.'}
                {quizDifficulty === 'Hard' && 'In-depth analytical deductions from notes.'}
              </p>
            </div>

            <button
              type="button"
              onClick={startConfiguredQuiz}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Generate {quizNumQuestions} Questions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Notes Preview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-500" />
              Indexed Passages ({session.preview_chunks.length} of {session.total_chunks})
            </h4>
            <div className="space-y-3">
              {session.preview_chunks.map((chk, i) => (
                <div key={chk.id || i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div className="flex items-center justify-between text-slate-500 font-semibold mb-1">
                    <span>Page {chk.page_number}</span>
                    <span>{chk.word_count} words</span>
                  </div>
                  <p className="text-slate-700 line-clamp-3 leading-relaxed">{chk.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Modal for Top Bar Start Button */}
      {showQuizConfigModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-lg">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <span>Configure Your Quiz</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuizConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Questions count */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuizNumQuestions(num)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      quizNumQuestions === num
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Easy', 'Medium', 'Hard'] as QuizDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setQuizDifficulty(diff)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                      quizDifficulty === diff
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {diff === 'Easy' && '🌱 '}
                    {diff === 'Medium' && '⚡ '}
                    {diff === 'Hard' && '🔥 '}
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowQuizConfigModal(false)}
                className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQuizConfigModal(false);
                  startConfiguredQuiz();
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
