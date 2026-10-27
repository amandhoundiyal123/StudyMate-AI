import React from 'react';
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Sparkles,
  Zap,
  BookOpen,
} from 'lucide-react';
import { StudentProfile } from '../types';
import { LevelProgressBar } from '../components/LevelProgressBar';
import { AchievementsSection } from '../components/AchievementsSection';
import { TopicMasterySection } from '../components/TopicMasterySection';

interface MasteryScreenProps {
  profile: StudentProfile;
  activeSessionTopic?: string;
  activeSessionId?: string;
  onBack: () => void;
  onStartQuizOnTopic: (topic: string) => void;
  onAskExplainTopic: (topic: string) => void;
}

export const MasteryScreen: React.FC<MasteryScreenProps> = ({
  profile,
  activeSessionTopic,
  activeSessionId,
  onBack,
  onStartQuizOnTopic,
  onAskExplainTopic,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Learning Progress & Topic Mastery
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track your verified curriculum scores, level advancement, and earned achievements.
          </p>
        </div>

        {/* Quick Study Stats Pill */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>{profile.study_days.length} {profile.study_days.length === 1 ? 'Study Day' : 'Study Days'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-semibold text-slate-700">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>{profile.completed_activities.length} Activities Completed</span>
          </div>
        </div>
      </div>

      {/* 1. XP, Levels and Animated Progress Bar */}
      <section aria-label="Student Level Progress">
        <LevelProgressBar xp={profile.xp} level={profile.level} />
      </section>

      {/* 2. Topic Mastery Map */}
      <section aria-label="Topic Mastery Map">
        <TopicMasterySection
          topicMastery={profile.topic_mastery}
          activeSessionTopic={activeSessionTopic}
          activeSessionId={activeSessionId}
          onStartQuizOnTopic={onStartQuizOnTopic}
          onAskExplainTopic={onAskExplainTopic}
        />
      </section>

      {/* 3. Achievement Badges 🏆 */}
      <section aria-label="Achievement Badges">
        <AchievementsSection badges={profile.badges} />
      </section>
    </div>
  );
};
