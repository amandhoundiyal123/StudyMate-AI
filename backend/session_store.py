"""In-memory session storage for StudyMate AI.

Stores uploaded note chunks, session metadata, and hidden quiz answer keys.
"""

import time
import uuid
from typing import Dict, Any, List, Optional
from backend.models import Chunk, SourceCitation


class SessionStore:
    """Thread-safe in-memory store for active study sessions."""

    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(
        self,
        topic: str,
        document_name: str,
        total_pages: int,
        chunks: List[Chunk],
    ) -> str:
        """Create a new study session and return its unique session ID."""
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = {
            "session_id": session_id,
            "topic": topic.strip() or "General Study Notes",
            "document_name": document_name,
            "total_pages": total_pages,
            "chunks": chunks,
            "created_at": time.time(),
            "quizzes": {},  # quiz_id -> { question_id -> internal_answer_data }
            "quiz_cache": {},  # cache_key -> GenerateQuizResponse dict
            "qa_cache": {},  # normalized_q -> AskQuestionResponse dict
        }
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a session by its ID."""
        return self._sessions.get(session_id)

    def get_chunks(self, session_id: str) -> List[Chunk]:
        """Get all chunks for a session."""
        session = self.get_session(session_id)
        if not session:
            return []
        return session.get("chunks", [])

    def store_quiz(
        self,
        session_id: str,
        quiz_id: str,
        quiz_records: Dict[str, Dict[str, Any]],
    ) -> bool:
        """Store generated quiz question records with hidden answer keys."""
        session = self.get_session(session_id)
        if not session:
            return False
        session["quizzes"][quiz_id] = quiz_records
        return True

    def cache_quiz(
        self,
        session_id: str,
        cache_key: str,
        quiz_data: Dict[str, Any],
    ) -> bool:
        """Cache a generated quiz response for near-instant retrieval."""
        session = self.get_session(session_id)
        if not session:
            return False
        session.setdefault("quiz_cache", {})[cache_key] = quiz_data
        return True

    def get_cached_quiz(
        self,
        session_id: str,
        cache_key: str,
    ) -> Optional[Dict[str, Any]]:
        """Retrieve a cached quiz response if available."""
        session = self.get_session(session_id)
        if not session:
            return None
        return session.get("quiz_cache", {}).get(cache_key)

    def cache_qa(
        self,
        session_id: str,
        question_key: str,
        qa_data: Dict[str, Any],
    ) -> bool:
        """Cache a Q&A answer response for near-instant retrieval."""
        session = self.get_session(session_id)
        if not session:
            return False
        session.setdefault("qa_cache", {})[question_key] = qa_data
        return True

    def get_cached_qa(
        self,
        session_id: str,
        question_key: str,
    ) -> Optional[Dict[str, Any]]:
        """Retrieve a cached Q&A answer if available."""
        session = self.get_session(session_id)
        if not session:
            return None
        return session.get("qa_cache", {}).get(question_key)

    def get_quiz_question(
        self,
        session_id: str,
        quiz_id: str,
        question_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Retrieve the internal answer record for evaluating a quiz question."""
        session = self.get_session(session_id)
        if not session:
            return None
        quiz = session.get("quizzes", {}).get(quiz_id)
        if not quiz:
            return None
        return quiz.get(question_id)

    def session_exists(self, session_id: str) -> bool:
        """Check if a session ID exists."""
        return session_id in self._sessions

    def clear(self):
        """Clear all sessions (useful for tests)."""
        self._sessions.clear()


# Global singleton instance for the FastAPI application
store = SessionStore()
