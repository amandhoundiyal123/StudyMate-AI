"""Tests for Question Answering, Quiz Generation, Validation, and Python Answer Evaluation."""

import os
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.session_store import store
from backend.models import Chunk, SourceCitation

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_session():
    """Setup a sample study session with known biology notes."""
    store.clear()
    c1 = Chunk(
        id="c_1",
        document_name="biology_notes.pdf",
        page_number=1,
        chunk_index=1,
        text="Glycolysis takes place in the cytoplasm of the cell and produces a net gain of 2 ATP and 2 NADH per glucose molecule without requiring oxygen.",
        word_count=26,
    )
    c2 = Chunk(
        id="c_2",
        document_name="biology_notes.pdf",
        page_number=2,
        chunk_index=2,
        text="The citric acid cycle occurs inside the mitochondrial matrix, producing ATP, NADH, and FADH2 while releasing carbon dioxide as a waste product.",
        word_count=23,
    )
    session_id = store.create_session(
        topic="Cellular Respiration",
        document_name="biology_notes.pdf",
        total_pages=2,
        chunks=[c1, c2],
    )
    return session_id


def test_ask_question_insufficient_evidence(setup_test_session):
    """When a question is completely unrelated to notes, return honest Out of Syllabus / Not Found message."""
    session_id = setup_test_session
    response = client.post(
        "/ask-question",
        json={
            "session_id": session_id,
            "question": "What is the gravitational wave frequency of a binary neutron star merger?",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["evidence_status"] == "Not Found"
    assert "out of syllabus" in data["answer"].lower()
    assert len(data["sources"]) == 0


def test_ask_question_with_supported_evidence(setup_test_session):
    """When a question matches notes, verify response contains real source citations."""
    session_id = setup_test_session
    response = client.post(
        "/ask-question",
        json={
            "session_id": session_id,
            "question": "Where does glycolysis take place and how much ATP does it yield?",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["evidence_status"] in ["Supported", "Partially Supported"]
    assert len(data["sources"]) > 0
    # Verify citations contain real page numbers from backend
    assert data["sources"][0]["page_number"] == 1
    assert "cytoplasm" in data["sources"][0]["passage"].lower()
    assert len(data["answer"]) > 10


def test_evaluate_answer_deterministic_logic(setup_test_session):
    """Verify backend Python deterministic answer evaluation without model guessing."""
    session_id = setup_test_session
    quiz_id = "test-quiz-1"
    q_id = "q1"

    # Store mock quiz with known answer
    store.store_quiz(
        session_id=session_id,
        quiz_id=quiz_id,
        quiz_records={
            q_id: {
                "id": q_id,
                "question": "Where does glycolysis take place?",
                "options": [
                    {"id": "A", "text": "Mitochondrial matrix"},
                    {"id": "B", "text": "Cytoplasm"},
                    {"id": "C", "text": "Nucleus"},
                    {"id": "D", "text": "Endoplasmic reticulum"},
                ],
                "correct_option_id": "B",
                "correct_option_text": "Cytoplasm",
                "explanation": "Glycolysis occurs in the cytoplasm and does not require organelles.",
                "source_citation": SourceCitation(
                    chunk_id="c_1",
                    document_name="biology_notes.pdf",
                    page_number=1,
                    passage="Glycolysis takes place in the cytoplasm...",
                    relevance_score=1.0,
                ),
            }
        },
    )

    # Test submitting CORRECT answer
    resp_correct = client.post(
        "/evaluate-answer",
        json={
            "session_id": session_id,
            "quiz_id": quiz_id,
            "question_id": q_id,
            "selected_option_id": "B",
        },
    )
    assert resp_correct.status_code == 200
    data_correct = resp_correct.json()
    assert data_correct["is_correct"] is True
    assert data_correct["correct_option_id"] == "B"
    assert data_correct["correct_option_text"] == "Cytoplasm"
    assert "cytoplasm" in data_correct["explanation"].lower()

    # Test submitting INCORRECT answer
    resp_wrong = client.post(
        "/evaluate-answer",
        json={
            "session_id": session_id,
            "quiz_id": quiz_id,
            "question_id": q_id,
            "selected_option_id": "A",
        },
    )
    assert resp_wrong.status_code == 200
    data_wrong = resp_wrong.json()
    assert data_wrong["is_correct"] is False
    assert data_wrong["selected_option_id"] == "A"
    assert data_wrong["correct_option_id"] == "B"
    assert data_wrong["source_citation"]["page_number"] == 1


def test_missing_credential_handling(setup_test_session):
    """Verify clean 503 error response when GEMINI_API_KEY is not configured."""
    session_id = setup_test_session
    with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
        response = client.post(
            "/ask-question",
            json={
                "session_id": session_id,
                "question": "Where does glycolysis take place?",
            },
        )
        assert response.status_code == 503
        assert "GEMINI_API_KEY is not configured" in response.json()["detail"]


def test_generate_quiz_end_to_end_and_validation(setup_test_session):
    """Test POST /generate-quiz with Gemma 4 model and verify strict question validation rules."""
    session_id = setup_test_session
    response = client.post(
        "/generate-quiz",
        json={
            "session_id": session_id,
            "num_questions": 3,
            "difficulty": "Medium",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "quiz_id" in data
    assert len(data["questions"]) >= 1

    for q in data["questions"]:
        # Meaningful question
        assert len(q["question"]) >= 10
        # Exactly 4 distinct options
        assert len(q["options"]) == 4
        opt_ids = {opt["id"] for opt in q["options"]}
        assert opt_ids == {"A", "B", "C", "D"}
        opt_texts = {opt["text"].strip().lower() for opt in q["options"]}
        assert len(opt_texts) == 4
        # Answer key is strictly hidden on client response
        assert "correct_option_id" not in q
        assert "correct_option_text" not in q


def test_student_gamification_and_duplicate_prevention():
    """Verify student profile progression, level-up calculation, and duplicate reward protection."""
    # 1. Check profile retrieval
    resp = client.get("/student/profile")
    assert resp.status_code == 200
    profile = resp.json()
    assert "xp" in profile
    assert "level" in profile
    assert "badges" in profile
    assert len(profile["badges"]) == 6

    # 2. Record quiz
    test_quiz_id = f"test_quiz_run_{os.getpid()}"
    record_resp = client.post(
        "/student/record-quiz",
        json={
            "quiz_id": test_quiz_id,
            "topic": "Cellular Respiration",
            "results": [
                {
                    "question": {"id": "q1", "question": "Where does glycolysis take place?"},
                    "selected_option_id": "B",
                    "evaluation": {
                        "is_correct": True,
                        "correct_option_id": "B",
                        "correct_option_text": "Cytoplasm",
                        "explanation": "Takes place in cytoplasm.",
                    },
                }
            ],
        },
    )
    assert record_resp.status_code == 200
    rec_data = record_resp.json()
    assert rec_data["is_duplicate"] is False
    assert rec_data["xp_earned"] > 0

    # 3. Resubmit same quiz_id -> must be marked duplicate with 0 XP
    dup_resp = client.post(
        "/student/record-quiz",
        json={
            "quiz_id": test_quiz_id,
            "topic": "Cellular Respiration",
            "results": [],
        },
    )
    assert dup_resp.status_code == 200
    dup_data = dup_resp.json()
    assert dup_data["is_duplicate"] is True
    assert dup_data["xp_earned"] == 0
