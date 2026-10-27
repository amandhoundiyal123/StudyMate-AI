"""FastAPI Application for StudyMate AI — CTRL + KNOWLEDGE.

Authoritative Single Backend API for Hacktoberfest HackDay 2026, Track 1.
"""

import os
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from backend.models import (
    UploadNotesResponse,
    AskQuestionRequest,
    AskQuestionResponse,
    GenerateQuizRequest,
    GenerateQuizResponse,
    QuizQuestion,
    QuizOption,
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    SourceCitation,
    RecordQuizRequest,
    RecordRevisionRequest,
    FlashcardsRequest,
    Chunk,
)
from backend.pdf_processor import extract_chunks_from_pdf, process_pasted_notes
from backend.retrieval import retrieve_relevant_passages
from backend.session_store import store
from backend.ai_service import (
    answer_question_with_gemma,
    generate_quiz_with_gemma,
    generate_flashcards_with_gemma,
)
from backend.gamification import (
    get_level_info,
    calculate_quiz_xp,
    calculate_topic_mastery_status,
    load_student_profile,
    save_student_profile,
)

app = FastAPI(
    title="StudyMate AI Backend",
    description="Backend service for CTRL + KNOWLEDGE's StudyMate AI study application.",
    version="1.0.0",
)

# Allow requests from Vite frontend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Health check endpoint to verify backend status."""
    model_name = os.environ.get("GEMMA_MODEL", "gemma-4-26b-a4b-it")
    if not model_name or model_name.strip() in {"", "1234", "default"}:
        model_name = "gemma-4-26b-a4b-it"
    return {
        "status": "healthy",
        "service": "StudyMate AI Backend",
        "team": "CTRL + KNOWLEDGE",
        "ai_model": model_name,
    }


def pregenerate_quiz_background(session_id: str, topic: str, chunks: List[Chunk]):
    """Background task to pregenerate default quiz so opening the quiz is instant."""
    try:
        raw_items = generate_quiz_with_gemma(
            topic=topic or "Study Notes",
            chunks=chunks,
            num_questions=3,
            difficulty="Medium",
        )
        if raw_items:
            quiz_id = str(uuid.uuid4())
            stored_records = {}
            student_questions = []

            for item in raw_items:
                q_id = item["id"]
                correct_text = ""
                for opt in item["options"]:
                    if opt["id"] == item["correct_option_id"]:
                        correct_text = opt["text"]
                        break

                citation = SourceCitation(
                    chunk_id=item.get("chunk_id", f"quiz_ref_{q_id}"),
                    document_name=item["document_name"],
                    page_number=item["page_number"],
                    passage=item["passage"],
                    relevance_score=1.0,
                )

                stored_records[q_id] = {
                    "id": q_id,
                    "question": item["question"],
                    "options": item["options"],
                    "correct_option_id": item["correct_option_id"],
                    "correct_option_text": correct_text or item["correct_option_id"],
                    "explanation": item["explanation"],
                    "source_citation": citation,
                }
                student_questions.append(
                    {
                        "id": q_id,
                        "question": item["question"],
                        "options": item["options"],
                    }
                )

            store.store_quiz(session_id, quiz_id, stored_records)
            cache_payload = {
                "quiz_id": quiz_id,
                "session_id": session_id,
                "questions": student_questions,
                "total_questions": len(student_questions),
                "difficulty": "Medium",
            }
            cache_key = f"{topic.lower()}:Medium:3"
            store.cache_quiz(session_id, cache_key, cache_payload)
            store.cache_quiz(session_id, "default", cache_payload)
    except Exception as exc:
        print(f"Background quiz pre-generation notice: {exc}")


@app.post("/upload-notes", response_model=UploadNotesResponse)
async def upload_notes(
    request: Request,
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    topic: Optional[str] = Form(""),
):
    """
    Process study notes from either an uploaded PDF file or pasted text.
    Extracts text page-by-page, splits into smaller chunks, preserves metadata,
    and returns a unique session ID.
    """
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            text = body.get("text", "")
            topic = body.get("topic", "") or "General Study Notes"
            file = None
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON body: {str(e)}")

    if not file and (not text or not text.strip()):
        raise HTTPException(
            status_code=400,
            detail="Please provide either a PDF file or paste text notes to begin studying.",
        )

    topic_name = (topic or "").strip() or "General Study Notes"
    chunks = []
    document_name = "Study Notes"
    total_pages = 1

    try:
        if file is not None and file.filename:
            document_name = file.filename
            if not document_name.lower().endswith(".pdf"):
                raise HTTPException(
                    status_code=400,
                    detail="Unsupported file format. Please upload a standard PDF (.pdf) document.",
                )

            pdf_bytes = await file.read()
            if len(pdf_bytes) == 0:
                raise HTTPException(status_code=400, detail="The uploaded PDF file is empty (0 bytes).")

            chunks = extract_chunks_from_pdf(pdf_bytes=pdf_bytes, document_name=document_name)
            if chunks:
                total_pages = max(c.page_number for c in chunks)
        elif text and text.strip():
            document_name = "Pasted Study Notes"
            chunks = process_pasted_notes(text=text, document_name=document_name)
            if chunks:
                total_pages = max(c.page_number for c in chunks)
        else:
            raise HTTPException(
                status_code=400,
                detail="Empty notes provided. Please enter study material.",
            )

    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the document: {str(exc)}",
        )

    session_id = store.create_session(
        topic=topic_name,
        document_name=document_name,
        total_pages=total_pages,
        chunks=chunks,
    )

    # Trigger background quiz pre-generation for instant quiz delivery
    if chunks:
        background_tasks.add_task(pregenerate_quiz_background, session_id, topic_name, chunks)

    return UploadNotesResponse(
        session_id=session_id,
        topic=topic_name,
        document_name=document_name,
        total_pages=total_pages,
        total_chunks=len(chunks),
        message=f"Successfully processed {len(chunks)} study passages from {document_name}.",
        preview_chunks=chunks[:3],
    )


@app.post("/ask-question", response_model=AskQuestionResponse)
async def ask_question(payload: AskQuestionRequest):
    """
    Answers a student question strictly grounded in their uploaded notes.
    Retrieves relevant passages, validates evidence sufficiency, queries Gemma 4,
    and returns citations with real page numbers.
    """
    session = store.get_session(payload.session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Study session not found or expired. Please upload your notes again.",
        )

    clean_question = payload.question.strip()
    if not clean_question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    chunks = session.get("chunks", [])
    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="No study material found in this session.",
        )

    # Check QA Cache for repeated queries to return instantly
    norm_q = clean_question.lower()
    cached_qa = store.get_cached_qa(payload.session_id, norm_q)
    if cached_qa:
        return AskQuestionResponse(**cached_qa)

    # 1. Retrieve relevant passages with strict evidence sufficiency check
    sources, evidence_status = retrieve_relevant_passages(chunks, clean_question, top_k=3)

    # 2. If evidence is Not Found, never hallucinate an answer
    if evidence_status == "Not Found" or not sources:
        not_found_resp = AskQuestionResponse(
            session_id=payload.session_id,
            question=clean_question,
            answer=(
                "Out of Syllabus: This question is not covered in your uploaded study notes or PDF document. "
                "StudyMate AI strictly prevents answering outside of your provided curriculum."
            ),
            evidence_status="Not Found",
            sources=[],
        )
        store.cache_qa(payload.session_id, norm_q, not_found_resp.model_dump())
        return not_found_resp

    # 3. Query Gemma 4 strictly with the retrieved evidence passages
    try:
        answer_text = answer_question_with_gemma(
            question=clean_question,
            retrieved_passages=sources,
            topic=session.get("topic", ""),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Inference error with Gemma 4: {str(exc)}",
        )

    # If Gemma 4 flags out-of-syllabus, clear ungrounded sources
    if "Out of Syllabus:" in answer_text:
        resp = AskQuestionResponse(
            session_id=payload.session_id,
            question=clean_question,
            answer=answer_text,
            evidence_status="Not Found",
            sources=[],
        )
    else:
        resp = AskQuestionResponse(
            session_id=payload.session_id,
            question=clean_question,
            answer=answer_text,
            evidence_status=evidence_status,
            sources=sources,
        )

    store.cache_qa(payload.session_id, norm_q, resp.model_dump())
    return resp


@app.post("/generate-quiz", response_model=GenerateQuizResponse)
async def generate_quiz(payload: GenerateQuizRequest):
    """
    Generate multiple-choice questions strictly from notes using Gemma 4.
    The answer key is stored securely in backend session storage.
    """
    session = store.get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found or expired.")

    chunks = session.get("chunks", [])
    if not chunks:
        raise HTTPException(status_code=400, detail="No study notes available to generate a quiz.")

    diff = payload.difficulty or "Medium"
    q_count = payload.num_questions or 3
    cache_key = f"{session.get('topic', '').lower()}:{diff}:{q_count}"

    # Check if a quiz matching parameters is already cached for 0ms loading
    cached = store.get_cached_quiz(payload.session_id, cache_key)
    if not cached and (q_count == 3 or not payload.num_questions):
        cached = store.get_cached_quiz(payload.session_id, "default")

    if cached:
        return GenerateQuizResponse(
            session_id=payload.session_id,
            quiz_id=cached["quiz_id"],
            questions=[QuizQuestion(**q) for q in cached["questions"]],
            total_questions=len(cached["questions"]),
            difficulty=cached.get("difficulty", diff),
        )

    try:
        raw_items = generate_quiz_with_gemma(
            topic=session.get("topic", "Study Notes"),
            chunks=chunks,
            num_questions=q_count,
            difficulty=diff,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to generate quiz: {str(exc)}",
        )

    quiz_id = str(uuid.uuid4())
    stored_records = {}
    student_questions = []

    for item in raw_items:
        q_id = item["id"]
        correct_text = ""
        for opt in item["options"]:
            if opt["id"] == item["correct_option_id"]:
                correct_text = opt["text"]
                break

        citation = SourceCitation(
            chunk_id=item.get("chunk_id", f"quiz_ref_{q_id}"),
            document_name=item["document_name"],
            page_number=item["page_number"],
            passage=item["passage"],
            relevance_score=1.0,
        )

        stored_records[q_id] = {
            "id": q_id,
            "question": item["question"],
            "options": item["options"],
            "correct_option_id": item["correct_option_id"],
            "correct_option_text": correct_text or item["correct_option_id"],
            "explanation": item["explanation"],
            "source_citation": citation,
        }

        # Send to student WITHOUT answer key
        student_questions.append(
            QuizQuestion(
                id=q_id,
                question=item["question"],
                options=[QuizOption(id=opt["id"], text=opt["text"]) for opt in item["options"]],
            )
        )

    # Save hidden answer keys in session storage
    store.store_quiz(payload.session_id, quiz_id, stored_records)

    resp_data = {
        "session_id": payload.session_id,
        "quiz_id": quiz_id,
        "questions": [q.model_dump() for q in student_questions],
        "total_questions": len(student_questions),
        "difficulty": diff,
    }
    store.cache_quiz(payload.session_id, cache_key, resp_data)

    return GenerateQuizResponse(
        session_id=payload.session_id,
        quiz_id=quiz_id,
        questions=student_questions,
        total_questions=len(student_questions),
        difficulty=diff,
    )


@app.post("/evaluate-answer", response_model=EvaluateAnswerResponse)
async def evaluate_answer(payload: EvaluateAnswerRequest):
    """
    Evaluate student submitted answer deterministically in Python against stored answer keys.
    Returns correctness, correct answer, explanation, and supporting source citation.
    """
    record = store.get_quiz_question(
        session_id=payload.session_id,
        quiz_id=payload.quiz_id,
        question_id=payload.question_id,
    )
    if not record:
        raise HTTPException(
            status_code=404,
            detail="Quiz or question record not found. Please regenerate the quiz.",
        )

    user_choice = payload.selected_option_id.strip().upper()
    correct_choice = record["correct_option_id"].strip().upper()
    is_correct = (user_choice == correct_choice)

    return EvaluateAnswerResponse(
        is_correct=is_correct,
        selected_option_id=user_choice,
        correct_option_id=correct_choice,
        correct_option_text=record["correct_option_text"],
        explanation=record["explanation"],
        source_citation=record["source_citation"],
    )


@app.get("/sessions/{session_id}")
def get_session_info(session_id: str):
    """Retrieve metadata about an active study session."""
    session = store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found or expired.")
    return {
        "session_id": session["session_id"],
        "topic": session["topic"],
        "document_name": session["document_name"],
        "total_pages": session["total_pages"],
        "total_chunks": len(session["chunks"]),
        "created_at": session["created_at"],
    }


# --- STUDENT GAMIFICATION & MASTERY ENDPOINTS ---

@app.get("/student/profile")
def get_student_profile():
    """Retrieve persistent student profile with current level, XP, badges, and topic mastery."""
    profile = load_student_profile()
    level = get_level_info(profile["xp"])
    return {**profile, "level": level}


@app.post("/student/record-quiz")
def record_quiz_result(payload: RecordQuizRequest):
    """
    Record completed quiz results, calculate verified XP, detect level-up,
    record mistakes, and evaluate achievements.
    Strictly prevents duplicate XP rewards for repeat submissions.
    """
    profile = load_student_profile()
    quiz_id = payload.quiz_id

    # Duplicate activity check
    if quiz_id in profile.get("completed_activities", []):
        level = get_level_info(profile["xp"])
        return {
            "profile": {**profile, "level": level},
            "xp_earned": 0,
            "leveled_up": False,
            "new_badges": [],
            "is_duplicate": True,
        }

    results = payload.results
    total_questions = len(results)
    correct_count = sum(1 for r in results if r.get("evaluation", {}).get("is_correct"))
    score_percent = round((correct_count / total_questions) * 100) if total_questions > 0 else 0

    # Check for comeback score improvement on this topic
    topic = payload.topic or "General Notes"
    previous_attempts = [
        a for a in profile.get("quiz_attempts", [])
        if (a.get("topic") or "").lower() == topic.lower()
    ]
    is_comeback = False
    if previous_attempts:
        last_score = previous_attempts[-1].get("score_percent", 0)
        if score_percent > last_score:
            is_comeback = True

    xp_earned = calculate_quiz_xp(correct_count, total_questions, is_comeback)
    old_level = get_level_info(profile["xp"])

    profile["xp"] += xp_earned
    new_level = get_level_info(profile["xp"])
    leveled_up = new_level["level"] > old_level["level"]

    profile.setdefault("completed_activities", []).append(quiz_id)

    today = datetime.now().strftime("%Y-%m-%d")
    if today not in profile.setdefault("study_days", []):
        profile["study_days"].append(today)

    # Record mistakes for review
    wrong_questions = []
    for r in results:
        eval_data = r.get("evaluation", {})
        if not eval_data.get("is_correct"):
            q_data = r.get("question", {})
            wrong_questions.append({
                "id": q_data.get("id", str(uuid.uuid4())),
                "question": q_data.get("question", ""),
                "selected_option_id": r.get("selected_option_id", ""),
                "selected_option_text": next(
                    (o.get("text", "") for o in q_data.get("options", []) if o.get("id") == r.get("selected_option_id")),
                    ""
                ),
                "correct_option_id": eval_data.get("correct_option_id", ""),
                "correct_option_text": eval_data.get("correct_option_text", ""),
                "explanation": eval_data.get("explanation", ""),
                "page_number": eval_data.get("source_citation", {}).get("page_number", 1) if eval_data.get("source_citation") else 1,
                "passage": eval_data.get("source_citation", {}).get("passage", "") if eval_data.get("source_citation") else "",
            })

    profile.setdefault("quiz_attempts", []).append({
        "id": quiz_id,
        "session_id": payload.session_id,
        "topic": topic,
        "total_questions": total_questions,
        "correct_count": correct_count,
        "score_percent": score_percent,
        "timestamp": datetime.now().isoformat(),
        "is_comeback": is_comeback,
        "wrong_questions": wrong_questions,
    })

    # Update Topic Mastery
    mastery = profile.setdefault("topic_mastery", {}).setdefault(topic, {
        "topic": topic,
        "total_quizzes": 0,
        "total_questions": 0,
        "total_correct": 0,
        "average_score": 0,
        "status": "Insufficient Data",
        "last_attempt_date": today,
        "wrong_questions": [],
    })

    mastery["total_quizzes"] += 1
    mastery["total_questions"] += total_questions
    mastery["total_correct"] += correct_count
    mastery["average_score"] = round((mastery["total_correct"] / mastery["total_questions"]) * 100) if mastery["total_questions"] > 0 else 0
    mastery["status"] = calculate_topic_mastery_status(mastery["average_score"], mastery["total_quizzes"])
    mastery["last_attempt_date"] = today
    mastery["wrong_questions"] = (wrong_questions + mastery.get("wrong_questions", []))[:30]

    # Evaluate Badges
    new_badges = []
    now_str = datetime.now().strftime("%b %d, %Y")
    total_quizzes = len(profile["quiz_attempts"])

    for b in profile.get("badges", []):
        if b.get("unlocked"):
            continue
        should_unlock = False

        if b["id"] == "first_steps" and total_quizzes >= 1:
            should_unlock = True
        elif b["id"] == "quiz_explorer" and total_quizzes >= 10:
            should_unlock = True
        elif b["id"] == "perfect_recall" and score_percent == 100:
            should_unlock = True
        elif b["id"] == "comeback" and is_comeback:
            should_unlock = True
        elif b["id"] == "consistent_learner" and len(profile.get("study_days", [])) >= 5:
            should_unlock = True
        elif b["id"] == "topic_master":
            if any(m.get("total_quizzes", 0) >= 2 and m.get("average_score", 0) >= 80 for m in profile.get("topic_mastery", {}).values()):
                should_unlock = True

        if should_unlock:
            b["unlocked"] = True
            b["unlocked_at"] = now_str
            new_badges.append(dict(b))

    save_student_profile(profile)

    return {
        "profile": {**profile, "level": new_level},
        "xp_earned": xp_earned,
        "leveled_up": leveled_up,
        "new_level": new_level if leveled_up else None,
        "new_badges": new_badges,
        "is_duplicate": False,
    }


@app.post("/student/record-revision")
def record_revision(payload: RecordRevisionRequest):
    """Record revision activity and award daily session XP."""
    profile = load_student_profile()
    today = datetime.now().strftime("%Y-%m-%d")
    activity_key = f"revision_{payload.session_id}_{today}"

    if activity_key in profile.get("completed_activities", []):
        level = get_level_info(profile["xp"])
        return {
            "profile": {**profile, "level": level},
            "xp_earned": 0,
            "leveled_up": False,
            "is_duplicate": True,
        }

    xp_earned = 25
    old_level = get_level_info(profile["xp"])
    profile["xp"] += xp_earned
    new_level = get_level_info(profile["xp"])
    leveled_up = new_level["level"] > old_level["level"]

    profile.setdefault("completed_activities", []).append(activity_key)
    if today not in profile.setdefault("study_days", []):
        profile["study_days"].append(today)

    save_student_profile(profile)

    return {
        "profile": {**profile, "level": new_level},
        "xp_earned": xpEarned,
        "leveled_up": leveledUp,
        "new_level": new_level if leveled_up else None,
        "is_duplicate": False,
    }


@app.post("/student/flashcards")
def get_flashcards(payload: FlashcardsRequest):
    """Generate 5 study flashcards grounded in syllabus notes."""
    chunks = []
    if payload.session_id:
        session = store.get_session(payload.session_id)
        if session:
            chunks = session.get("chunks", [])

    if not chunks:
        # Check if any session in memory has this topic
        for sid, s in store._sessions.items():
            if (s.get("topic") or "").lower() == payload.topic.lower():
                chunks = s.get("chunks", [])
                break

    flashcards = generate_flashcards_with_gemma(payload.topic, chunks)
    return {"topic": payload.topic, "flashcards": flashcards}
