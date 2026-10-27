/**
 * Pure utility functions for StudyMate AI frontend.
 */

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function calculateScorePercentage(correctCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return Math.round((correctCount / totalQuestions) * 100);
}

export function formatEvidenceBadge(status: 'Supported' | 'Partially Supported' | 'Not Found' | 'Out of Syllabus'): {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'neutral';
} {
  switch (status) {
    case 'Supported':
      return { label: 'Evidence Supported', variant: 'success' };
    case 'Partially Supported':
      return { label: 'Partially Supported', variant: 'warning' };
    case 'Out of Syllabus':
      return { label: 'Out of Syllabus', variant: 'danger' };
    case 'Not Found':
    default:
      return { label: 'Not Found in Notes', variant: 'neutral' };
  }
}
