import React from 'react';
import { Award, Lock, CheckCircle2, Trophy, Sparkles } from 'lucide-react';
import { AchievementBadge } from '../types';

interface AchievementsSectionProps {
  badges: AchievementBadge[];
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({ badges }) => {
  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const progressPercent = Math.round((unlockedCount / badges.length) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Achievement Badges</h3>
            <p className="text-xs text-slate-500">
              Earn permanent badges for milestones, consistency, and mastery
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-700">
              {unlockedCount} of {badges.length} Unlocked
            </span>
            <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => {
          return (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                badge.unlocked
                  ? 'bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 border-amber-200 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                      badge.unlocked
                        ? 'bg-amber-100/80 shadow-xs'
                        : 'bg-slate-200/80 grayscale'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div>
                    {badge.unlocked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{badge.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                {badge.unlocked ? (
                  <span className="text-emerald-700 font-semibold">
                    Earned {badge.unlocked_at || 'Recently'}
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">In progress</span>
                )}
                <span className="text-slate-400 font-mono text-[10px]">ID: {badge.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
