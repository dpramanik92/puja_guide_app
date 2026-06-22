import asyncio
import json
import os
from typing import AsyncIterator

_agent = None


def _build_agent():
    """Synchronous agent construction — call via asyncio.to_thread."""
    from langchain_core.messages import SystemMessage
    from langchain_core.tools import tool
    from langchain_openai import ChatOpenAI
    from langgraph.prebuilt import create_react_agent
    from app.rag.map_tools import MAP_TOOLS

    system = SystemMessage(content="""\
You are a knowledgeable and friendly guide for Kolkata Durga Puja 2026.

Tool selection:
- rag_search: pandal history, theme/idol specialty, crowd levels, timings, cultural info, general puja knowledge
- search_nearby_pujas: find or list Durga Puja pandals near a specific location
- search_nearby_places: restaurants, cafes, or any non-puja venue near a location
- get_directions: turn-by-turn directions between two specific places
- plan_puja_route: itinerary or optimised route to visit multiple pandals

You may call multiple tools for a single question.

LANGUAGE RULES (strictly follow):
- Detect the language of the user's message.
- If the user writes in Bengali (বাংলা), respond ENTIRELY in Bengali. Every word of your response must be in Bengali. Do not mix in English words except for proper names (pandal names, street names) when no Bengali equivalent exists.
- If the user writes in English, respond entirely in English.
- Be concise but helpful. Format lists with bullet points and include distances/durations when available.
- Current context: Durga Puja 2026, Kolkata, West Bengal, India.\
""")

    @tool
    async def rag_search(query: str) -> dict:
        """
        Search the Durga Puja pandal database and web for information.
        Use for questions about pandal history, theme, specialty, crowd levels, timings, cultural info.

        Args:
            query: The user's question or search query.
        """
        from app.rag.retriever import retrieve
        from app.rag.web_search import search_web

        doc_chunks = await retrieve(query)
        if doc_chunks:
            return {
                "source": "database",
                "content": "\n\n".join(c["text"] for c in doc_chunks),
            }
        web_results = search_web(query)
        if web_results:
            return {
                "source": "web",
                "content": "\n\n".join(f"[{r['title']}]\n{r['content']}" for r in web_results),
            }
        return {"source": "none", "content": "No relevant information found."}

    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0.3,
        api_key=os.getenv("OPENAI_API_KEY"),
    )

    return create_react_agent(
        model=llm,
        tools=[rag_search] + MAP_TOOLS,
        prompt=system,
    )


async def _get_agent():
    global _agent
    if _agent is None:
        _agent = await asyncio.to_thread(_build_agent)
    return _agent


import re as _re


def _clean_word(w: str) -> str:
    """Strip leading/trailing non-alphanumeric characters from a word."""
    return _re.sub(r"^[^\w]+|[^\w]+$", "", w)


def _filter_markers_by_text(markers: list, text: str) -> list:
    """Keep only markers whose names the chatbot actually wrote in its response.

    Uses first-two-word phrase matching: 'Baghbazar Sarbojanin' must appear as
    a consecutive phrase in the text to pass.  This avoids false positives from
    address strings that contain neighbourhood names without the full pandal phrase.
    Direction markers (origin/destination) are always kept.
    """
    if not text or not markers:
        return markers
    text_lower = text.lower()
    result = []
    for m in markers:
        if m.get("type") in ("origin", "destination"):
            result.append(m)
            continue
        words = [_clean_word(w) for w in m.get("name", "").split()]
        words = [w for w in words if w]
        matched = False
        if len(words) >= 2:
            # Multi-word name: require the first-two-word phrase in the text.
            # Single-word fallback is intentionally NOT used here because common
            # neighbourhood words (Kolkata, Sovabazar) appear in many addresses.
            phrase = (words[0] + " " + words[1]).lower()
            matched = phrase in text_lower
        elif len(words) == 1 and len(words[0]) > 4:
            matched = words[0].lower() in text_lower
        if matched:
            result.append(m)
    # Fall back to all markers if nothing matched (e.g. Bengali response)
    return result if result else markers


async def run_agent_pipeline(
    user_message: str,
    chat_history: list[dict],
) -> AsyncIterator[str]:
    from app.rag.map_tools import MAP_TOOL_NAMES, extract_map_data

    agent = await _get_agent()

    _role_map = {"user": "human", "assistant": "ai"}
    messages = [
        (_role_map.get(m["role"], m["role"]), m["content"])
        for m in chat_history[-6:]
    ]
    messages.append(("human", user_message))

    source_determined = False
    rag_used_web = False
    map_tools_called = False
    final_ai_text = ""

    async for event in agent.astream_events({"messages": messages}, version="v2"):
        kind = event["event"]

        if kind == "on_tool_start":
            tool_name = event.get("name", "")
            if tool_name in MAP_TOOL_NAMES:
                map_tools_called = True

        elif kind == "on_tool_end":
            tool_name = event.get("name", "")
            if tool_name == "rag_search":
                output = event["data"].get("output") or {}
                if isinstance(output, dict) and output.get("source") == "web":
                    rag_used_web = True

        elif kind == "on_chat_model_stream":
            chunk = event["data"].get("chunk")
            if chunk and chunk.content and not getattr(chunk, "tool_call_chunks", []):
                if not source_determined:
                    if map_tools_called:
                        source = "maps"
                    elif rag_used_web:
                        source = "web"
                    else:
                        source = "database"
                    yield f"data: __SOURCE__{source}\n\n"
                    source_determined = True
                final_ai_text += chunk.content
                yield f"data: {json.dumps(chunk.content)}\n\n"

        elif kind == "on_chain_end" and event.get("name") == "LangGraph":
            output = event["data"].get("output") or {}
            msgs = output.get("messages", [])
            map_data = extract_map_data(msgs)
            if map_data["markers"] or map_data["polylines"]:
                filtered = _filter_markers_by_text(map_data["markers"], final_ai_text)
                if filtered != map_data["markers"]:
                    map_data["markers"] = filtered
                    if filtered:
                        map_data["center"] = {
                            "lat": sum(m["lat"] for m in filtered) / len(filtered),
                            "lng": sum(m["lng"] for m in filtered) / len(filtered),
                        }
                yield f"data: __MAP_DATA__{json.dumps(map_data)}\n\n"

    if not source_determined:
        yield "data: __SOURCE__database\n\n"

    yield "data: [DONE]\n\n"
