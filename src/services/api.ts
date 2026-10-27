import {
  UploadNotesResponse,
  AskQuestionResponse,
  GenerateQuizResponse,
  EvaluateAnswerResponse,
  StudentProfile,
  RecordQuizResponse,
  QuizQuestionResult,
  Flashcard,
} from '../types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const rawText = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    if (!res.ok) {
      throw new ApiError(res.status, `Server error (${res.status}). Please try again.`);
    }
    throw new ApiError(
      500,
      'Backend returned an unexpected non-JSON response. Please verify backend service is running.'
    );
  }

  if (!res.ok) {
    const errorDetail = data?.detail || `Request failed with status ${res.status}`;
    throw new ApiError(res.status, errorDetail);
  }
  return data as T;
}

export async function checkBackendHealth(): Promise<{ status: string; team?: string }> {
  const res = await fetch('/health');
  return handleResponse(res);
}

export async function uploadNotes(
  file: File | null,
  text: string,
  topic: string
): Promise<UploadNotesResponse> {
  const formData = new FormData();
  if (topic.trim()) {
    formData.append('topic', topic.trim());
  }

  if (file) {
    formData.append('file', file, file.name);
  } else if (text.trim()) {
    formData.append('text', text.trim());
  } else {
    throw new Error('Please select a PDF file or paste study notes.');
  }

  const res = await fetch('/upload-notes', {
    method: 'POST',
    body: formData,
  });

  return handleResponse<UploadNotesResponse>(res);
}

export async function askQuestion(
  sessionId: string,
  question: string
): Promise<AskQuestionResponse> {
  const res = await fetch('/ask-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      question: question.trim(),
    }),
  });

  return handleResponse<AskQuestionResponse>(res);
}

export async function generateQuiz(
  sessionId: string,
  numQuestions: number = 5,
  difficulty: string = 'Medium'
): Promise<GenerateQuizResponse> {
  const res = await fetch('/generate-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      num_questions: numQuestions,
      difficulty: difficulty,
    }),
  });

  return handleResponse<GenerateQuizResponse>(res);
}

export async function evaluateAnswer(
  sessionId: string,
  quizId: string,
  questionId: string,
  selectedOptionId: string
): Promise<EvaluateAnswerResponse> {
  const res = await fetch('/evaluate-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      quiz_id: quizId,
      question_id: questionId,
      selected_option_id: selectedOptionId,
    }),
  });

  return handleResponse<EvaluateAnswerResponse>(res);
}

export async function getStudentProfile(): Promise<StudentProfile> {
  const res = await fetch('/student/profile');
  return handleResponse<StudentProfile>(res);
}

export async function recordQuizResult(
  sessionId: string,
  quizId: string,
  topic: string,
  results: QuizQuestionResult[]
): Promise<RecordQuizResponse> {
  const res = await fetch('/student/record-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      quiz_id: quizId,
      topic,
      results,
    }),
  });
  return handleResponse<RecordQuizResponse>(res);
}

export async function recordRevision(sessionId: string, topic: string): Promise<any> {
  const res = await fetch('/student/record-revision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, topic }),
  });
  return handleResponse<any>(res);
}

export async function generateFlashcards(
  topic: string,
  sessionId?: string
): Promise<{ topic: string; flashcards: Flashcard[] }> {
  const res = await fetch('/student/flashcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, session_id: sessionId }),
  });
  return handleResponse<{ topic: string; flashcards: Flashcard[] }>(res);
}
