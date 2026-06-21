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

Rules:
- Always respond in the same language the user wrote in (Bengali or English).
- If the user writes in Bengali (বাংলা), respond entirely in Bengali.
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
                yield f"data: {json.dumps(chunk.content)}\n\n"

        elif kind == "on_chain_end" and event.get("name") == "LangGraph":
            output = event["data"].get("output") or {}
            msgs = output.get("messages", [])
            map_data = extract_map_data(msgs)
            if map_data["markers"] or map_data["polylines"]:
                yield f"data: __MAP_DATA__{json.dumps(map_data)}\n\n"

    if not source_determined:
        yield "data: __SOURCE__database\n\n"

    yield "data: [DONE]\n\n"
