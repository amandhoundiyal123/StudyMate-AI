"""PDF and Text extraction module for StudyMate AI using PyMuPDF."""

import io
import re
from typing import List
import pymupdf
from backend.models import Chunk


def _split_into_chunks(text: str, document_name: str, page_number: int, start_index: int) -> List[Chunk]:
    """Split page text into searchable chunks of approximately 100-200 words with slight overlap."""
    clean_text = re.sub(r"\s+", " ", text).strip()
    if not clean_text:
        return []

    words = clean_text.split(" ")
    # If the text is short enough, keep it as a single chunk
    if len(words) <= 200:
        return [
            Chunk(
                id=f"c_{start_index}",
                document_name=document_name,
                page_number=page_number,
                chunk_index=start_index,
                text=clean_text,
                word_count=len(words),
            )
        ]

    chunks: List[Chunk] = []
    chunk_size = 180
    overlap = 35
    i = 0
    current_index = start_index

    while i < len(words):
        chunk_words = words[i : i + chunk_size]
        chunk_str = " ".join(chunk_words)
        chunks.append(
            Chunk(
                id=f"c_{current_index}",
                document_name=document_name,
                page_number=page_number,
                chunk_index=current_index,
                text=chunk_str,
                word_count=len(chunk_words),
            )
        )
        current_index += 1
        i += chunk_size - overlap

    return chunks


def extract_chunks_from_pdf(pdf_bytes: bytes, document_name: str = "document.pdf") -> List[Chunk]:
    """
    Extract text page-by-page from a PDF using PyMuPDF and produce annotated chunks.
    Raises ValueError for corrupted, empty, or unreadable PDFs.
    """
    if not pdf_bytes or len(pdf_bytes) == 0:
        raise ValueError("Uploaded file is empty (0 bytes).")

    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:
        raise ValueError(f"Corrupted or invalid PDF file: {str(exc)}") from exc

    try:
        if doc.page_count == 0:
            raise ValueError("The uploaded PDF has 0 pages.")

        all_chunks: List[Chunk] = []
        total_extracted_words = 0

        for page_idx in range(doc.page_count):
            page_number = page_idx + 1  # 1-indexed for student-facing UI
            page = doc.load_page(page_idx)
            page_text = page.get_text("text").strip()

            if page_text:
                total_extracted_words += len(page_text.split())
                page_chunks = _split_into_chunks(
                    text=page_text,
                    document_name=document_name,
                    page_number=page_number,
                    start_index=len(all_chunks) + 1,
                )
                all_chunks.extend(page_chunks)

        if total_extracted_words == 0 or len(all_chunks) == 0:
            raise ValueError(
                "No readable text could be extracted from this PDF. "
                "The document may be scanned images only without a text layer."
            )

        return all_chunks
    finally:
        doc.close()


def process_pasted_notes(text: str, document_name: str = "Study Notes") -> List[Chunk]:
    """
    Process raw student-pasted study notes into chunks, assigning realistic page divisions.
    """
    cleaned = text.strip()
    if not cleaned:
        raise ValueError("Pasted notes cannot be empty.")

    words = cleaned.split()
    if len(words) < 15:
        raise ValueError("Pasted notes are too short. Please provide at least 15 words of study material.")

    # Assign page breaks approximately every 350 words so citations mimic standard pages
    words_per_page = 350
    chunks: List[Chunk] = []
    chunk_counter = 1

    for page_idx, i in enumerate(range(0, len(words), words_per_page)):
        page_num = page_idx + 1
        page_words = words[i : i + words_per_page]
        page_text = " ".join(page_words)
        page_chunks = _split_into_chunks(
            text=page_text,
            document_name=document_name,
            page_number=page_num,
            start_index=chunk_counter,
        )
        chunks.extend(page_chunks)
        chunk_counter += len(page_chunks)

    return chunks
