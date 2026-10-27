"""Student Gamification, Progression, and Topic Mastery Engine for StudyMate AI.

Manages persistent student levels, XP calculation, badges, and curriculum mastery.
"""

import json
import os
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

DATA_DIR = os.path.join(os.getcwd(), "data")
PROFILE_FILE = os.path.join(DATA_DIR, "student_profile.json")

LEVEL_TIERS = [
    {"level": 1, "tier": "Beginner", "min_xp": 0, "max_xp": 150},
    {"level": 2, "tier": "Learner", "min_xp": 151, "max_xp": 400},
    {"level": 3, "tier": "Explorer", "min_xp": 401, "max_xp": 800},
    {"level": 4, "tier": "Scholar", "min_xp": 801, "max_xp": 1500},
    {"level": 5, "tier": "Expert", "min_xp": 1501, "max_xp": 999999},
]

INITIAL_BADGES = [
    {
        "id": "first_steps",
        "title": "First Steps",
        "description": "Complete your first quiz to kickstart your study journey.",
        "icon": "👣",
        "unlocked": False,
        "unlocked_at": None,
    },
    {
        "id": "quiz_explorer",
        "title": "Quiz Explorer",
        "description": "Complete 10 knowledge quizzes across any topics.",
        "icon": "🧭",
        "unlocked": False,
        "unlocked_at": None,
    },
    {
        "id": "perfect_recall",
        "title": "Perfect Recall",
        "description": "Score a perfect 100% on any knowledge quiz.",
        "icon": "🎯",
        "unlocked": False,
        "unlocked_at": None,
    },
    {
        "id": "comeback",
        "title": "Comeback",
        "description": "Improve upon a previous quiz score on a topic.",
        "icon": "⚡",
        "unlocked": False,
        "unlocked_at": None,
    },
    {
        "id": "consistent_learner",
        "title": "Consistent Learner",
        "description": "Study and revise across 5 different days.",
        "icon": "📅",
        "unlocked": False,
        "unlocked_at": None,
    },
    {
        "id": "topic_master",
        "title": "Topic Master",
        "description": "Demonstrate strong performance (>= 80% average over at least 2 quizzes) on a topic.",
        "icon": "👑",
        "unlocked": False,
        "unlocked_at": None,
    },
]


def get_level_info(xp: int) -> Dict[str, Any]:
    """Calculate current level, tier title, and progress percentage to the next level."""
    sanitized_xp = max(0, int(xp))
    current_tier = LEVEL_TIERS[0]

    for tier in LEVEL_TIERS:
        if sanitized_xp >= tier["min_xp"]:
            current_tier = tier

    level = current_tier["level"]
    tier_name = current_tier["tier"]
    min_xp = current_tier["min_xp"]
    max_xp = current_tier["max_xp"]

    if level >= 5:
        progress_pct = 100
        next_level_xp = max_xp
    else:
        tier_range = max_xp - min_xp + 1
        xp_in_tier = sanitized_xp - min_xp
        progress_pct = min(100, max(0, round((xp_in_tier / tier_range) * 100)))
        next_level_xp = max_xp + 1

    return {
        "level": level,
        "tier": tier_name,
        "current_xp": sanitized_xp,
        "next_level_xp": next_level_xp,
        "min_xp": min_xp,
        "max_xp": max_xp,
        "progress_percent": progress_pct,
    }


def calculate_quiz_xp(correct_count: int, total_questions: int, is_comeback: bool = False) -> int:
    """
    Calculate XP earned from a quiz attempt using deterministic verified backend rules.
    - 15 XP per correct answer
    - 5 XP per attempted question
    - 50 XP bonus for perfect recall (100% with at least 3 questions)
    - 25 XP bonus for comeback improvement
    """
    if total_questions <= 0:
        return 0

    base_xp = (correct_count * 15) + (total_questions * 5)
    perfect_bonus = 50 if (correct_count == total_questions and total_questions >= 3) else 0
    comeback_bonus = 25 if is_comeback else 0

    return base_xp + perfect_bonus + comeback_bonus


def calculate_topic_mastery_status(average_score: int, total_quizzes: int) -> str:
    """Categorize mastery: 'Strong', 'Improving', 'Needs Revision', or 'Insufficient Data'."""
    if total_quizzes < 1:
        return "Insufficient Data"
    if average_score >= 80:
        return "Strong"
    if average_score >= 50:
        return "Improving"
    return "Needs Revision"


def load_student_profile() -> Dict[str, Any]:
    """Load persistent student profile from disk or initialize default profile."""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        if os.path.exists(PROFILE_FILE):
            with open(PROFILE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Ensure all required badges exist
            existing_ids = {b["id"] for b in data.get("badges", [])}
            for badge in INITIAL_BADGES:
                if badge["id"] not in existing_ids:
                    data.setdefault("badges", []).append(dict(badge))

            return data
    except Exception as exc:
        print(f"Error loading student profile: {exc}")

    today = datetime.now().strftime("%Y-%m-%d")
    initial_profile = {
        "xp": 0,
        "study_days": [today],
        "completed_activities": [],
        "quiz_attempts": [],
        "badges": [dict(b) for b in INITIAL_BADGES],
        "topic_mastery": {},
    }
    save_student_profile(initial_profile)
    return initial_profile


def save_student_profile(data: Dict[str, Any]) -> None:
    """Persist student profile JSON to disk."""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(PROFILE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as exc:
        print(f"Error saving student profile: {exc}")
