import json
import os
from typing import AsyncIterator
from openai import AsyncOpenAI
from app.rag.retriever import retrieve
from app.rag.web_search import search_web

SYSTEM_PROMPT = """You are a knowledgeable and friendly guide for Kolkata Durga Puja.
You help visitors and locals with information about pandals, their locations, how to reach them,
crowd levels, special attractions, timings, and any other Puja-related queries.

Rules:
- Always respond in the same language the user wrote in (Bengali or English).
- If the user writes in Bengali (বাংলা), respond entirely in Bengali.
- If context is provided from documents, use it as the primary source.
- If context comes from web search, mention it naturally (e.g., "According to recent reports...").
- Be concise but helpful. For directions, be specific about landmarks and transport.
- If you don't know something, say so honestly rather than guessing.
- Current year context: Durga Puja 2026, Kolkata, West Bengal, India."""


def _build_context(doc_chunks: list[dict], web_results: list[dict]) -> str:
    parts = []
    if doc_chunks:
        parts.append("=== From Pandal Database ===")
        for chunk in doc_chunks:
            parts.append(chunk["text"])

    if web_results:
        parts.append("\n=== From Web Search ===")
        for r in web_results:
            parts.append(f"[{r['title']}]\n{r['content']}")

    return "\n\n".join(parts)


async def run_pipeline(
    user_message: str,
    chat_history: list[dict],
) -> AsyncIterator[str]:
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    doc_chunks = await retrieve(user_message)
    web_results = []
    source = "database"

    if not doc_chunks:
        web_results = search_web(user_message)
        source = "web"

    context = _build_context(doc_chunks, web_results)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for msg in chat_history[-6:]:
        messages.append(msg)

    user_content = user_message
    if context:
        user_content = f"Context:\n{context}\n\nUser question: {user_message}"

    messages.append({"role": "user", "content": user_content})

    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        stream=True,
        temperature=0.3,
        max_tokens=1024,
    )

    yield f"data: __SOURCE__{source}\n\n"

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield f"data: {json.dumps(delta.content)}\n\n"

    yield "data: [DONE]\n\n"
