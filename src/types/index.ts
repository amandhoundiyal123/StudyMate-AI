export interface Chunk {
  id: string;
  document_name: string;
  page_number: number;
  chunk_index: number;
  text: string;
  word_count: number;
}

export interface SourceCitation {
  chunk_id: string;
  document_name: string;
  page_number: number;
  passage: string;
  relevance_score: number;
}

export type EvidenceStatus = 'Supported' | 'Partially Supported' | 'Not Found' | 'Out of Syllabus';

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface UploadNotesResponse {
  session_id: string;
  topic: string;
  document_name: string;
  total_pages: number;
  total_chunks: number;
  message: string;
  preview_chunks: Chunk[];
}

export interface AskQuestionResponse {
  session_id: string;
  question: string;
  answer: string;
  evidence_status: EvidenceStatus;
  sources: SourceCitation[];
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface GenerateQuizResponse {
  session_id: string;
  quiz_id: string;
  questions: QuizQuestion[];
  total_questions: number;
  difficulty?: QuizDifficulty;
}

export interface EvaluateAnswerResponse {
  is_correct: boolean;
  selected_option_id: string;
  correct_option_id: string;
  correct_option_text: string;
  explanation: string;
  source_citation?: SourceCitation | null;
}

export interface QAHistoryItem {
  id: string;
  question: string;
  answer: string;
  evidence_status: EvidenceStatus;
  sources: SourceCitation[];
  timestamp: string;
}

export interface QuizQuestionResult {
  question: QuizQuestion;
  selected_option_id: string;
  evaluation: EvaluateAnswerResponse;
}

// Gamification, Badges & Mastery Types
export interface LevelInfo {
  name: 'Beginner' | 'Learner' | 'Explorer' | 'Scholar' | 'Expert';
  level: number;
  minXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface WrongQuestionRecord {
  id: string;
  question: string;
  selected_option_id: string;
  selected_option_text?: string;
  correct_option_id: string;
  correct_option_text: string;
  explanation: string;
  page_number?: number;
  passage?: string;
}

export interface TopicMastery {
  topic: string;
  total_quizzes: number;
  total_questions: number;
  total_correct: number;
  average_score: number;
  status: 'Strong' | 'Improving' | 'Needs Revision' | 'Insufficient Data';
  last_attempt_date: string;
  wrong_questions: WrongQuestionRecord[];
}

export interface StudentProfile {
  xp: number;
  level: LevelInfo;
  study_days: string[];
  completed_activities: string[];
  badges: AchievementBadge[];
  topic_mastery: Record<string, TopicMastery>;
}

export interface RecordQuizResponse {
  profile: StudentProfile;
  xp_earned: number;
  leveled_up: boolean;
  new_level?: LevelInfo;
  new_badges: AchievementBadge[];
  is_duplicate: boolean;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  page_number?: number;
  passage?: string;
}
