import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, Award, ArrowRight, X } from 'lucide-react';
import { LevelInfo, AchievementBadge } from '../types';

interface LevelUpCelebrationProps {
  level?: LevelInfo | null;
  newBadges?: AchievementBadge[];
  onClose: () => void;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  level,
  newBadges = [],
  onClose,
}) => {
  if (!level && (!newBadges || newBadges.length === 0)) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-300/30 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-300/30 rounded-full blur-2xl" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl shadow-sm mb-4 animate-bounce">
          {level ? '🎉' : '🏆'}
        </div>

        {level && (
          <div className="space-y-1 mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Level Up!</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              You are now an {level.name}!
            </h2>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Your dedication paid off. You unlocked Tier {level.level} and advanced towards study mastery.
            </p>
          </div>
        )}

        {/* New Badges Earned */}
        {newBadges && newBadges.length > 0 && (
          <div className="my-5 p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-left space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
              New Achievement Unlocked!
            </span>
            {newBadges.map((b) => (
              <div key={b.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100">
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{b.title}</h4>
                  <p className="text-[11px] text-slate-600">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue Studying</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
