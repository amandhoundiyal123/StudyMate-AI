import React, { useState } from 'react';
import {
  Compass,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';
import { TopicMastery, WrongQuestionRecord, Flashcard } from '../types';
import { generateFlashcards } from '../services/api';

interface TopicMasterySectionProps {
  topicMastery: Record<string, TopicMastery>;
  activeSessionTopic?: string;
  activeSessionId?: string;
  onStartQuizOnTopic: (topic: string) => void;
  onAskExplainTopic: (topic: string) => void;
}

export const TopicMasterySection: React.FC<TopicMasterySectionProps> = ({
  topicMastery,
  activeSessionTopic,
  activeSessionId,
  onStartQuizOnTopic,
  onAskExplainTopic,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'mistakes' | 'flashcards'>('overview');

  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [flippedCardIndex, setFlippedCardIndex] = useState<number | null>(null);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);

  const topicsList = Object.values(topicMastery);

  // If activeSessionTopic is not in the list, display it with 'Insufficient Data'
  const allDisplayTopics = [...topicsList];
  if (
    activeSessionTopic &&
    !allDisplayTopics.some((t) => t.topic.toLowerCase() === activeSessionTopic.toLowerCase())
  ) {
    allDisplayTopics.unshift({
      topic: activeSessionTopic,
      total_quizzes: 0,
      total_questions: 0,
      total_correct: 0,
      average_score: 0,
      status: 'Insufficient Data',
      last_attempt_date: 'Not attempted',
      wrong_questions: [],
    });
  }

  const selectedMastery = selectedTopic ? topicMastery[selectedTopic] : null;

  const handleOpenTopic = (topicName: string) => {
    setSelectedTopic(topicName);
    setActiveTab('overview');
    setFlashcards([]);
    setFlippedCardIndex(null);
    setFlashcardError(null);
  };

  const handleFetchFlashcards = async (topicName: string) => {
    setIsLoadingFlashcards(true);
    setFlashcardError(null);
    try {
      const resp = await generateFlashcards(topicName, activeSessionId);
      setFlashcards(resp.flashcards || []);
      setActiveTab('flashcards');
    } catch (err: any) {
      setFlashcardError(err.message || 'Failed to generate flashcards.');
    } finally {
      setIsLoadingFlashcards(false);
    }
  };

  const getStatusBadge = (status: TopicMastery['status']) => {
    switch (status) {
      case 'Strong':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Strong (80%+)
          </span>
        );
      case 'Improving':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            Improving (50-79%)
          </span>
        );
      case 'Needs Revision':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Needs Revision (&lt;50%)
          </span>
        );
      case 'Insufficient Data':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            No Quiz Data Yet
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Topic Mastery Map</h3>
            <p className="text-xs text-slate-500">
              Live curriculum mastery calculated from verified quiz attempts
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">
          {allDisplayTopics.length} {allDisplayTopics.length === 1 ? 'Topic' : 'Topics'} Tracked
        </span>
      </div>

      {allDisplayTopics.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">No Topics Recorded Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Upload notes or start a study session to track your live topic scores and review mistakes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allDisplayTopics.map((topicItem) => {
            const hasData = topicItem.total_quizzes > 0;
            return (
              <div
                key={topicItem.topic}
                onClick={() => handleOpenTopic(topicItem.topic)}
                className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer bg-white group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {topicItem.topic}
                    </h4>
                    {getStatusBadge(topicItem.status)}
                  </div>

                  {hasData ? (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                          <span>Verified Mastery Score</span>
                          <span className="font-extrabold text-slate-900">
                            {topicItem.average_score}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              topicItem.status === 'Strong'
                                ? 'bg-emerald-500'
                                : topicItem.status === 'Improving'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${topicItem.average_score}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span>{topicItem.total_quizzes} {topicItem.total_quizzes === 1 ? 'Quiz' : 'Quizzes'}</span>
                        <span>&bull;</span>
                        <span>{topicItem.total_correct} / {topicItem.total_questions} Correct</span>
                        <span>&bull;</span>
                        <span className="text-rose-600 font-semibold">
                          {topicItem.wrong_questions?.length || 0} Mistakes
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 space-y-1">
                      <p className="font-semibold text-slate-800">Insufficient Quiz Data</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Complete at least one quiz on this topic to compute your verified mastery score.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Interactive Actions & Flashcards</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TOPIC INTERACTION MODAL */}
      {selectedTopic && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Topic Mastery Hub
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  {selectedTopic}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTopic(null);
                  onStartQuizOnTopic(selectedTopic);
                }}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all cursor-pointer"
              >
                <GraduationCap className="w-5 h-5 text-indigo-600 mb-1" />
                <span className="block text-xs font-bold text-slate-900">Take Quiz</span>
                <span className="text-[10px] text-slate-500">Test this topic</span>
              </button>

              <button
                type="button"
                onClick={() => handleFetchFlashcards(selectedTopic)}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all cursor-pointer"
              >
                <Layers className="w-5 h-5 text-purple-600 mb-1" />
                <span className="block text-xs font-bold text-slate-900">Flashcards</span>
                <span className="text-[10px] text-slate-500">Generate 5 cards</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTopic(null);
                  onAskExplainTopic(selectedTopic);
                }}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-amber-600 mb-1" />
                <span className="block text-xs font-bold text-slate-900">AI Tutor</span>
                <span className="text-[10px] text-slate-500">Explain syllabus</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mistakes')}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all cursor-pointer"
              >
                <AlertCircle className="w-5 h-5 text-rose-600 mb-1" />
                <span className="block text-xs font-bold text-slate-900">Mistakes</span>
                <span className="text-[10px] text-slate-500">
                  {selectedMastery?.wrong_questions?.length || 0} to review
                </span>
              </button>
            </div>

            {/* Error Message */}
            {flashcardError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
                {flashcardError}
              </div>
            )}

            {/* Modal Body Tabs */}
            {activeTab === 'flashcards' ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Interactive Flashcards ({flashcards.length})
                  </h4>
                  <span className="text-xs text-slate-500 italic">Click any card to flip</span>
                </div>

                {isLoadingFlashcards ? (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="w-7 h-7 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">Generating Study Flashcards in Seconds...</p>
                  </div>
                ) : flashcards.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-500">
                    No flashcards generated yet. Click "Flashcards" above to create them.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {flashcards.map((fc, idx) => {
                      const isFlipped = flippedCardIndex === idx;
                      return (
                        <div
                          key={fc.id || idx}
                          onClick={() => setFlippedCardIndex(isFlipped ? null : idx)}
                          className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 min-h-[140px] flex flex-col justify-between ${
                            isFlipped
                              ? 'bg-purple-900 text-white border-purple-800 shadow-md rotate-y-180'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
                          }`}
                        >
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isFlipped ? 'text-purple-300' : 'text-slate-400'}`}>
                              {isFlipped ? 'Answer / Explanation' : `Card ${idx + 1} • Concept`}
                            </span>
                            <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                              {isFlipped ? fc.back : fc.front}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-200/40 flex items-center justify-between text-[10px] opacity-80">
                            <span>{isFlipped ? 'Click to see prompt' : 'Click to flip'}</span>
                            {fc.page_number && <span>Page {fc.page_number}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'mistakes' ? (
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Review Recorded Mistakes ({selectedMastery?.wrong_questions?.length || 0})
                </h4>

                {(!selectedMastery || selectedMastery.wrong_questions.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-800">No recorded mistakes for this topic!</p>
                    <p className="text-slate-500 mt-1">
                      You have either scored 100% or haven't attempted quizzes on this topic yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {selectedMastery.wrong_questions.map((mq, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl text-xs space-y-2"
                      >
                        <p className="font-bold text-slate-900 text-sm">
                          {idx + 1}. {mq.question}
                        </p>
                        <div className="space-y-1 text-slate-700">
                          <p>
                            <span className="font-semibold text-rose-700">Your choice:</span>{' '}
                            Option {mq.selected_option_id}{' '}
                            {mq.selected_option_text && `(${mq.selected_option_text})`}
                          </p>
                          <p>
                            <span className="font-semibold text-emerald-700">Correct answer:</span>{' '}
                            Option {mq.correct_option_id}{' '}
                            {mq.correct_option_text && `(${mq.correct_option_text})`}
                          </p>
                        </div>
                        <p className="text-slate-600 italic bg-white/70 p-2.5 rounded border border-rose-100">
                          <span className="font-semibold not-italic text-slate-800">Explanation:</span>{' '}
                          {mq.explanation}
                        </p>
                        {mq.page_number && (
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                            Source Page {mq.page_number}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Overview Tab */
              <div className="space-y-4 pt-2">
                {selectedMastery ? (
                  <div className="space-y-3 text-xs text-slate-700">
                    <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <div>
                        <span className="text-slate-400 font-medium">Average Score</span>
                        <p className="text-2xl font-black text-slate-900 mt-0.5">
                          {selectedMastery.average_score}%
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Quizzes Taken</span>
                        <p className="text-2xl font-black text-indigo-600 mt-0.5">
                          {selectedMastery.total_quizzes}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Total Questions</span>
                        <p className="text-2xl font-black text-slate-900 mt-0.5">
                          {selectedMastery.total_questions}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-2">
                      <span className="font-bold text-indigo-900 block">Syllabus Guidance</span>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedMastery.status === 'Strong' &&
                          'Outstanding performance! You have demonstrated strong recall across multiple quiz attempts.'}
                        {selectedMastery.status === 'Improving' &&
                          'Solid progress. Review your past mistakes or generate targeted flashcards to reach Strong mastery.'}
                        {selectedMastery.status === 'Needs Revision' &&
                          'This topic requires attention. Use the AI Tutor action below to read a comprehensive breakdown of the core concepts.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    <p className="font-bold text-slate-800">No quiz attempts recorded yet for this topic.</p>
                    <p className="mt-1">
                      Take a quiz or ask the AI Tutor for an overview to begin recording mastery data.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = selectedTopic;
                  setSelectedTopic(null);
                  onStartQuizOnTopic(t);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Take Quiz Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
