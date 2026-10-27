import React from 'react';
import { Award, Zap, Trophy, Sparkles } from 'lucide-react';
import { LevelInfo } from '../types';

interface LevelProgressBarProps {
  xp: number;
  level: LevelInfo;
  onOpenMastery?: () => void;
  compact?: boolean;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  xp,
  level,
  onOpenMastery,
  compact = false,
}) => {
  const getLevelBadge = (name: string) => {
    switch (name) {
      case 'Expert':
        return { icon: '👑', color: 'from-amber-500 to-yellow-400 text-amber-950' };
      case 'Scholar':
        return { icon: '🎓', color: 'from-indigo-600 to-purple-500 text-white' };
      case 'Explorer':
        return { icon: '🧭', color: 'from-blue-600 to-cyan-500 text-white' };
      case 'Learner':
        return { icon: '⚡', color: 'from-emerald-600 to-teal-500 text-white' };
      case 'Beginner':
      default:
        return { icon: '🌱', color: 'from-slate-600 to-slate-500 text-white' };
    }
  };

  const badge = getLevelBadge(level.name);

  if (compact) {
    return (
      <div
        onClick={onOpenMastery}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition-all cursor-pointer group"
        title="View Level Progress & Achievements"
      >
        <span className="text-sm select-none">{badge.icon}</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span>{level.name}</span>
            <span className="text-[11px] font-normal text-slate-500">• {xp} XP</span>
          </div>
          <div className="w-20 sm:w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-0.5">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${level.progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-2xl shadow-sm shrink-0`}
          >
            {badge.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Level {level.level}
              </span>
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold">
                {level.name}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{xp}</span>
              <span className="text-xs font-semibold text-slate-500">Total XP</span>
            </div>
          </div>
        </div>

        <div className="flex-1 sm:max-w-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>Progress to Next Tier</span>
            <span className="text-indigo-600 font-bold">{level.progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/80">
            <div
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${level.progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
            <span>{level.minXp} XP</span>
            <span>
              {level.name === 'Expert' ? 'Max Tier Reached' : `${level.nextLevelXp} XP`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
