"""Unit and integration tests for Step 1 of StudyMate AI."""

import os
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.models import Chunk
from backend.pdf_processor import extract_chunks_from_pdf, process_pasted_notes
from backend.retrieval import retrieve_relevant_passages, extract_keywords
from backend.session_store import store

client = TestClient(app)


def test_extract_keywords():
    """Verify that stop words are removed while preserving key topical terms."""
    keywords = extract_keywords("What happens during the metaphase stage?")
    assert "metaphase" in keywords
    assert "stage" in keywords
    assert "what" not in keywords
    assert "the" not in keywords


def test_pdf_extraction_with_real_pdf():
    """Verify that PyMuPDF extracts text and accurately tracks page numbers."""
    pdf_path = os.path.join(os.path.dirname(__file__), "../../sample-notes/mitosis_and_cell_cycle.pdf")
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    chunks = extract_chunks_from_pdf(pdf_bytes, document_name="mitosis_and_cell_cycle.pdf")
    assert len(chunks) >= 2

    # Verify page numbers are preserved
    page_numbers = {c.page_number for c in chunks}
    assert 1 in page_numbers
    assert 2 in page_numbers

    # Verify content in page 1 and page 2
    p1_chunks = [c for c in chunks if c.page_number == 1]
    p2_chunks = [c for c in chunks if c.page_number == 2]
    assert any("Interphase" in c.text for c in p1_chunks)
    assert any("Metaphase" in c.text or "Anaphase" in c.text for c in p2_chunks)


def test_empty_and_corrupt_pdf_handling():
    """Ensure empty or invalid PDFs produce descriptive ValueError exceptions."""
    with pytest.raises(ValueError, match="empty"):
        extract_chunks_from_pdf(b"", document_name="empty.pdf")

    with pytest.raises(ValueError, match="Corrupted or invalid"):
        extract_chunks_from_pdf(b"Not a valid PDF header content", document_name="corrupt.pdf")


def test_pasted_notes_processing():
    """Verify pasted text chunking and minimum length validation."""
    sample_text = (
        "Cellular respiration is the biochemical process by which organisms combine oxygen "
        "with foodstuff molecules to divert chemical energy into life-sustaining activities. "
        "During glycolysis, glucose is broken down in the cytoplasm into pyruvate, producing ATP."
    )
    chunks = process_pasted_notes(sample_text, document_name="Test Notes")
    assert len(chunks) >= 1
    assert chunks[0].page_number == 1
    assert "glycolysis" in chunks[0].text.lower()

    # Empty text validation
    with pytest.raises(ValueError, match="cannot be empty"):
        process_pasted_notes("   ")

    # Too short validation
    with pytest.raises(ValueError, match="too short"):
        process_pasted_notes("Just two words")


def test_keyword_retrieval_supported_and_not_found():
    """Verify keyword retrieval classifies evidence as Supported, Partially Supported, or Not Found."""
    c1 = Chunk(
        id="c1",
        document_name="doc.pdf",
        page_number=1,
        chunk_index=1,
        text="During the S phase of interphase, the cell replicates all nuclear DNA and duplicates the centrosome.",
        word_count=18,
    )
    c2 = Chunk(
        id="c2",
        document_name="doc.pdf",
        page_number=2,
        chunk_index=2,
        text="In metaphase, chromosomes align along the metaphase plate attached to spindle fibers from opposite poles.",
        word_count=17,
    )

    chunks = [c1, c2]

    # Query for metaphase
    sources, status = retrieve_relevant_passages(chunks, "Where do chromosomes align in metaphase?")
    assert status == "Supported"
    assert len(sources) > 0
    assert sources[0].page_number == 2
    assert "metaphase plate" in sources[0].passage

    # Query with no relevance
    sources, status = retrieve_relevant_passages(chunks, "What is Newtonian gravity and orbital mechanics?")
    assert status == "Not Found"
    assert len(sources) == 0


def test_fastapi_upload_pasted_text_endpoint():
    """Test POST /upload-notes with pasted notes."""
    store.clear()
    sample_notes = (
        "Photosynthesis takes place in chloroplasts. In the light-dependent reactions, "
        "chlorophyll absorbs sunlight to produce ATP and NADPH while releasing oxygen gas. "
        "The Calvin cycle then fixes carbon dioxide into glucose using the energy from ATP."
    )
    response = client.post(
        "/upload-notes",
        data={
            "topic": "Photosynthesis",
            "text": sample_notes,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["topic"] == "Photosynthesis"
    assert data["total_chunks"] >= 1
    assert data["total_pages"] == 1
    assert len(data["preview_chunks"]) >= 1

    session_id = data["session_id"]
    # Verify session retrieval
    session_resp = client.get(f"/sessions/{session_id}")
    assert session_resp.status_code == 200
    assert session_resp.json()["topic"] == "Photosynthesis"


def test_fastapi_upload_pdf_file_endpoint():
    """Test POST /upload-notes with PDF file upload."""
    pdf_path = os.path.join(os.path.dirname(__file__), "../../sample-notes/mitosis_and_cell_cycle.pdf")
    with open(pdf_path, "rb") as f:
        response = client.post(
            "/upload-notes",
            data={"topic": "Cell Division"},
            files={"file": ("mitosis_and_cell_cycle.pdf", f, "application/pdf")},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["topic"] == "Cell Division"
    assert data["document_name"] == "mitosis_and_cell_cycle.pdf"
    assert data["total_pages"] == 2
    assert data["total_chunks"] >= 2
