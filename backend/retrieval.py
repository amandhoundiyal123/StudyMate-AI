"""Search and passage retrieval for StudyMate AI.

Evaluates evidence sufficiency strictly to prevent hallucination.
Distinguishes Supported, Partially Supported, and Not Found evidence.
"""

import math
import re
from typing import List, Tuple
from backend.models import Chunk, SourceCitation

# Standard English stopwords to filter out non-informative query tokens
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can", "cannot", "could", "did",
    "do", "does", "doing", "down", "during", "each", "explain", "few", "for",
    "from", "further", "had", "has", "have", "having", "he", "her", "here",
    "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into",
    "is", "it", "its", "itself", "just", "me", "more", "most", "my", "myself",
    "no", "nor", "not", "now", "of", "off", "on", "once", "only", "or", "other",
    "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should",
    "so", "some", "such", "tell", "than", "that", "the", "their", "theirs",
    "them", "themselves", "then", "there", "these", "they", "this", "those",
    "through", "to", "too", "under", "until", "up", "very", "was", "we", "were",
    "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with",
    "would", "you", "your", "yours", "yourself", "yourselves"
}


def _tokenize(text: str) -> List[str]:
    """Extract lowercase alphanumeric tokens from text."""
    return re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", text.lower())


def extract_keywords(query: str) -> List[str]:
    """Filter stopwords from query to isolate informative keywords."""
    tokens = _tokenize(query)
    keywords = [t for t in tokens if t not in STOPWORDS]
    return keywords if keywords else tokens


def score_chunk(keywords: List[str], chunk_text: str, raw_query: str) -> Tuple[float, int]:
    """
    Compute a deterministic keyword relevance score for a chunk.
    Returns: (score, matching_unique_keyword_count)
    """
    if not keywords:
        return 0.0, 0

    chunk_lower = chunk_text.lower()
    chunk_tokens = _tokenize(chunk_text)
    chunk_token_set = set(chunk_tokens)

    matched_keywords = 0
    total_term_freq = 0

    for kw in keywords:
        if kw in chunk_token_set or kw in chunk_lower:
            matched_keywords += 1
            total_term_freq += chunk_lower.count(kw)

    if matched_keywords == 0:
        return 0.0, 0

    # Keyword coverage (fraction of distinct query terms found)
    coverage = matched_keywords / len(keywords)

    # Term frequency component with logarithmic dampening
    tf_component = math.log1p(total_term_freq)

    # Phrase match bonus if significant multi-word query appears verbatim
    phrase_bonus = 0.0
    clean_raw_query = re.sub(r"[^\w\s]", "", raw_query.lower()).strip()
    if len(clean_raw_query.split()) > 1 and clean_raw_query in chunk_lower:
        phrase_bonus = 0.5

    total_score = (coverage * 0.7) + (min(tf_component, 2.0) * 0.2) + phrase_bonus
    return total_score, matched_keywords


def retrieve_relevant_passages(
    chunks: List[Chunk],
    query: str,
    top_k: int = 3,
) -> Tuple[List[SourceCitation], str]:
    """
    Perform keyword-based search over notes chunks with strict evidence sufficiency checks.
    Distinguishes:
    - 'Supported': Substantial, multi-term topical coverage with high confidence.
    - 'Partially Supported': Moderate coverage that addresses some concepts but may miss key aspects.
    - 'Not Found': Insufficient evidence. Unrelated or incidental single-word matches are rejected.
    """
    if not chunks:
        return [], "Not Found"

    keywords = extract_keywords(query)
    if not keywords:
        return [], "Not Found"

    scored_chunks = []
    for chunk in chunks:
        score, matches = score_chunk(keywords, chunk.text, query)
        if score > 0.25 and matches > 0:
            citation = SourceCitation(
                chunk_id=chunk.id,
                document_name=chunk.document_name,
                page_number=chunk.page_number,
                passage=chunk.text,
                relevance_score=round(score, 3),
            )
            scored_chunks.append((score, matches, citation))

    if not scored_chunks:
        return [], "Not Found"

    # Sort descending by score, then matches
    scored_chunks.sort(key=lambda x: (x[0], x[1]), reverse=True)
    top_score = scored_chunks[0][0]
    top_matches = scored_chunks[0][1]
    coverage = top_matches / len(keywords)

    # Strict evidence threshold to prevent unrelated or incidental matches from authorizing answers
    if top_score >= 0.70 or (coverage >= 0.60 and top_matches >= 2):
        status = "Supported"
        top_results = [item[2] for item in scored_chunks[:top_k]]
    elif top_score >= 0.40 and (coverage >= 0.40 or top_matches >= 2):
        status = "Partially Supported"
        top_results = [item[2] for item in scored_chunks[:top_k]]
    else:
        # Insufficient evidence - do NOT represent sources as verified
        status = "Not Found"
        top_results = []

    return top_results, status
