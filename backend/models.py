"""Data models for StudyMate AI."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Chunk(BaseModel):
    """A searchable chunk of text extracted from notes or PDF."""
    id: str
    document_name: str
    page_number: int
    chunk_index: int
    text: str
    word_count: int


class UploadNotesResponse(BaseModel):
    """Response returned when a student uploads or pastes notes."""
    session_id: str
    topic: str
    document_name: str
    total_pages: int
    total_chunks: int
    message: str
    preview_chunks: List[Chunk] = Field(default_factory=list)


class SourceCitation(BaseModel):
    """Real source passage with page number supporting an answer."""
    chunk_id: str
    document_name: str
    page_number: int
    passage: str
    relevance_score: float = 0.0


class AskQuestionRequest(BaseModel):
    """Request payload to ask a question against a study session."""
    session_id: str
    question: str


class AskQuestionResponse(BaseModel):
    """Response with evidence status, answer, and verified source citations."""
    session_id: str
    question: str
    answer: str
    evidence_status: str  # 'Supported' | 'Partially Supported' | 'Not Found'
    sources: List[SourceCitation] = Field(default_factory=list)


class QuizOption(BaseModel):
    """Option for a multiple-choice question."""
    id: str  # 'A', 'B', 'C', 'D'
    text: str


class QuizQuestion(BaseModel):
    """A quiz question presented to the student (without revealing correct answer)."""
    id: str
    question: str
    options: List[QuizOption]


class GenerateQuizRequest(BaseModel):
    """Request payload to generate a quiz from study notes."""
    session_id: str
    num_questions: int = Field(default=5, ge=3, le=10)
    difficulty: Optional[str] = "Medium"


class GenerateQuizResponse(BaseModel):
    """Quiz questions ready for the student."""
    session_id: str
    quiz_id: str
    questions: List[QuizQuestion]
    total_questions: int
    difficulty: Optional[str] = "Medium"


class EvaluateAnswerRequest(BaseModel):
    """Student answer submission for a specific quiz question."""
    session_id: str
    quiz_id: str
    question_id: str
    selected_option_id: str


class EvaluateAnswerResponse(BaseModel):
    """Evaluation feedback evaluated deterministically in Python."""
    is_correct: bool
    selected_option_id: str
    correct_option_id: str
    correct_option_text: str
    explanation: str
    source_citation: Optional[SourceCitation] = None


class RecordQuizRequest(BaseModel):
    """Payload to record completed quiz attempt for gamification & mastery."""
    session_id: Optional[str] = None
    quiz_id: str
    topic: Optional[str] = "General Notes"
    results: List[Dict[str, Any]] = Field(default_factory=list)


class RecordRevisionRequest(BaseModel):
    """Payload to record revision study session."""
    session_id: str
    topic: Optional[str] = "General Notes"


class Flashcard(BaseModel):
    """Interactive concept study flashcard."""
    id: str
    front: str
    back: str
    page_number: Optional[int] = 1


class FlashcardsRequest(BaseModel):
    """Payload to generate topic flashcards."""
    topic: str
    session_id: Optional[str] = None
