import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  AlertCircle,
  ArrowRight,
  Sliders,
  Sparkles,
  Zap,
  Award,
} from 'lucide-react';
import { generateQuiz, evaluateAnswer, recordQuizResult } from '../services/api';
import {
  UploadNotesResponse,
  QuizQuestion,
  EvaluateAnswerResponse,
  QuizQuestionResult,
  QuizDifficulty,
  StudentProfile,
  RecordQuizResponse,
} from '../types';
import { LevelUpCelebration } from '../components/LevelUpCelebration';

interface QuizScreenProps {
  session: UploadNotesResponse;
  initialNumQuestions?: number;
  initialDifficulty?: QuizDifficulty;
  onBackToWorkspace: () => void;
  onViewMastery?: () => void;
  onProfileUpdated?: (profile: StudentProfile) => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  session,
  initialNumQuestions = 3,
  initialDifficulty = 'Medium',
  onBackToWorkspace,
  onViewMastery,
  onProfileUpdated,
}) => {
  const [numQuestions, setNumQuestions] = useState<number>(initialNumQuestions);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>(initialDifficulty);
  const [isLoading, setIsLoading] = useState(true);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluateAnswerResponse | null>(null);
  const [completedResults, setCompletedResults] = useState<QuizQuestionResult[]>([]);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Gamification record result state
  const [quizRecord, setQuizRecord] = useState<RecordQuizResponse | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const fetchQuiz = async (qCount = numQuestions, diff = difficulty) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedOption(null);
    setCurrentEvaluation(null);
    setCompletedResults([]);
    setCurrentIndex(0);
    setIsQuizComplete(false);
    setShowConfigPanel(false);
    setQuizRecord(null);

    try {
      const resp = await generateQuiz(session.session_id, qCount, diff);
      setQuizId(resp.quiz_id);
      setQuestions(resp.questions);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to generate quiz questions. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setNumQuestions(initialNumQuestions);
    setDifficulty(initialDifficulty);
    fetchQuiz(initialNumQuestions, initialDifficulty);
  }, [session.session_id, initialNumQuestions, initialDifficulty]);

  const currentQ = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!quizId || !currentQ || !selectedOption) return;

    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const evalResp = await evaluateAnswer(
        session.session_id,
        quizId,
        currentQ.id,
        selectedOption
      );
      setCurrentEvaluation(evalResp);

      const resultItem: QuizQuestionResult = {
        question: currentQ,
        selected_option_id: selectedOption,
        evaluation: evalResp,
      };
      setCompletedResults((prev) => [...prev, resultItem]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to evaluate answer. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setCurrentEvaluation(null);
    } else {
      setIsQuizComplete(true);

      // Record verified quiz results on backend to award XP & badges
      if (quizId) {
        try {
          const resp = await recordQuizResult(
            session.session_id,
            quizId,
            session.topic,
            completedResults
          );
          setQuizRecord(resp);
          if (onProfileUpdated) {
            onProfileUpdated(resp.profile);
          }
          if (resp.leveled_up || (resp.new_badges && resp.new_badges.length > 0)) {
            setShowCelebration(true);
          }
        } catch (e) {
          console.error('Failed to record verified quiz result:', e);
        }
      }
    }
  };

  const totalScore = completedResults.filter((r) => r.evaluation.is_correct).length;
  const scorePercent = questions.length > 0 ? Math.round((totalScore / questions.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">
            Generating {numQuestions}-Question Quiz ({difficulty} Difficulty)...
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Fast AI is analyzing your notes and generating questions with verified answers in seconds.
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage && questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Quiz Generation Failed</h2>
          <p className="text-sm text-red-700 mt-2 max-w-md mx-auto">{errorMessage}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 cursor-pointer"
            >
              Back to Workspace
            </button>
            <button
              type="button"
              onClick={() => fetchQuiz(numQuestions, difficulty)}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Level Up / Badges Modal */}
      {showCelebration && (
        <LevelUpCelebration
          level={quizRecord?.leveled_up ? quizRecord.new_level : null}
          newBadges={quizRecord?.new_badges || []}
          onClose={() => setShowCelebration(false)}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={onBackToWorkspace}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Study Workspace</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Difficulty Badge */}
          <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full flex items-center gap-1">
            {difficulty === 'Easy' && '🌱'}
            {difficulty === 'Medium' && '⚡'}
            {difficulty === 'Hard' && '🔥'}
            <span>{difficulty}</span>
          </span>

          {/* Change Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs flex items-center gap-1 font-semibold"
            title="Adjust questions count or difficulty"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Inline Settings Panel */}
      {showConfigPanel && (
        <div className="mb-6 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Adjust Quiz Settings</span>
            <button
              type="button"
              onClick={() => setShowConfigPanel(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold text-slate-600 mb-1">
                Number of Questions
              </span>
              <div className="grid grid-cols-4 gap-1">
                {[3, 5, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumQuestions(num)}
                    className={`py-1 text-xs font-bold rounded-lg ${
                      numQuestions === num
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-600 mb-1">
                Difficulty
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(['Easy', 'Medium', 'Hard'] as QuizDifficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-1 text-xs font-bold rounded-lg ${
                      difficulty === d
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchQuiz(numQuestions, difficulty)}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
          >
            Regenerate Quiz Now
          </button>
        </div>
      )}

      {/* QUIZ COMPLETED VIEW */}
      {isQuizComplete ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Quiz Completed!</h2>
          <p className="text-sm text-slate-600 mt-1">
            Evaluated deterministically in backend Python against stored answer keys.
          </p>

          {/* XP & Rewards Banner */}
          {quizRecord && (
            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200 rounded-2xl max-w-md mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                  <Zap className="w-5 h-5 text-amber-300" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-indigo-950 block">
                    {quizRecord.is_duplicate ? 'Quiz Completed (Already Rewarded)' : `+${quizRecord.xp_earned} XP Earned!`}
                  </span>
                  <span className="text-[11px] text-indigo-700">
                    {quizRecord.is_duplicate
                      ? 'XP is awarded once per quiz attempt'
                      : `Total XP: ${quizRecord.profile.xp} • Level ${quizRecord.profile.level.level} ${quizRecord.profile.level.name}`}
                  </span>
                </div>
              </div>

              {quizRecord.new_badges && quizRecord.new_badges.length > 0 && (
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 text-xs font-bold text-indigo-800">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>+{quizRecord.new_badges.length} Badge</span>
                </div>
              )}
            </div>
          )}

          {/* Score Badge */}
          <div className="my-6 inline-block bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {difficulty} Level Score
            </span>
            <div className="text-4xl sm:text-5xl font-black text-indigo-600 mt-1">
              {scorePercent}%
            </div>
            <p className="text-xs font-medium text-slate-600 mt-1">
              {totalScore} out of {questions.length} correct
            </p>
          </div>

          {/* Question Breakdown List */}
          <div className="text-left mt-6 space-y-4 pt-6 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Review Questions & Citations:</h3>
            {completedResults.map((res, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  res.evaluation.is_correct
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-red-50/60 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {i + 1}. {res.question.question}
                  </span>
                  <span
                    className={`shrink-0 font-bold px-2 py-0.5 rounded text-[11px] ${
                      res.evaluation.is_correct
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {res.evaluation.is_correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <div className="text-slate-700">
                  <p>
                    <span className="font-semibold">Your choice:</span> Option {res.selected_option_id}
                  </p>
                  {!res.evaluation.is_correct && (
                    <p className="text-emerald-800 font-semibold mt-0.5">
                      Correct: Option {res.evaluation.correct_option_id} ({res.evaluation.correct_option_text})
                    </p>
                  )}
                </div>

                <p className="text-slate-600 font-normal italic">
                  <span className="font-semibold not-italic">Explanation:</span> {res.evaluation.explanation}
                </p>

                {res.evaluation.source_citation && (
                  <div className="bg-white/80 p-2.5 rounded border border-slate-200/60 text-slate-600">
                    <span className="font-bold text-indigo-700">
                      Source Page {res.evaluation.source_citation.page_number}:
                    </span>{' '}
                    "{res.evaluation.source_citation.passage}"
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => fetchQuiz(numQuestions, difficulty)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Retake / Generate New
            </button>
            {onViewMastery && (
              <button
                type="button"
                onClick={onViewMastery}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4" /> View Topic Mastery & Badges
              </button>
            )}
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              Back to Study Workspace
            </button>
          </div>
        </div>
      ) : (
        /* SINGLE QUESTION DISPLAY */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Progress Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Score: {totalScore}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5">
            <div
              className="bg-indigo-600 h-1.5 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Question Text */}
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQ?.question}
            </h3>

            {/* Options List */}
            <div className="space-y-3">
              {currentQ?.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                const isSubmitted = currentEvaluation !== null;
                const isCorrect = currentEvaluation?.correct_option_id === opt.id;
                const isWrongChoice = isSubmitted && isSelected && !currentEvaluation?.is_correct;

                let optionStyles = 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20';

                if (isSelected && !isSubmitted) {
                  optionStyles = 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500';
                }

                if (isSubmitted) {
                  if (isCorrect) {
                    optionStyles = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-400';
                  } else if (isWrongChoice) {
                    optionStyles = 'border-red-500 bg-red-50 text-red-900 font-semibold ring-2 ring-red-400';
                  } else {
                    optionStyles = 'border-slate-200 opacity-60 bg-slate-50';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isSubmitted || isEvaluating}
                    onClick={() => setSelectedOption(opt.id)}
                    className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${optionStyles}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="text-sm font-medium pt-0.5 leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Evaluation Feedback Card */}
            {currentEvaluation && (
              <div
                className={`p-5 rounded-2xl border text-sm space-y-3 ${
                  currentEvaluation.is_correct
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-base">
                  {currentEvaluation.is_correct ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Correct!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span>Incorrect</span>
                    </>
                  )}
                </div>

                {!currentEvaluation.is_correct && (
                  <p className="text-xs font-semibold">
                    The correct answer is Option {currentEvaluation.correct_option_id}:{' '}
                    <span className="underline">{currentEvaluation.correct_option_text}</span>
                  </p>
                )}

                <p className="text-xs leading-relaxed text-slate-800">
                  <span className="font-bold">Explanation:</span> {currentEvaluation.explanation}
                </p>

                {currentEvaluation.source_citation && (
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-indigo-700">
                      Notes Page {currentEvaluation.source_citation.page_number} Citation:
                    </span>{' '}
                    "{currentEvaluation.source_citation.passage}"
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {currentEvaluation
                  ? 'Review feedback, then proceed.'
                  : 'Select an option to submit.'}
              </span>

              {!currentEvaluation ? (
                <button
                  type="button"
                  disabled={!selectedOption || isEvaluating}
                  onClick={handleSubmitAnswer}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  {isEvaluating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Submit Answer</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>
                    {currentIndex + 1 < questions.length ? 'Next Question' : 'View Results'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
