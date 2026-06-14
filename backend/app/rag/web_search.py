import os
from tavily import TavilyClient

_client = None


def get_tavily() -> TavilyClient:
    global _client
    if _client is None:
        _client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    return _client


def search_web(query: str, max_results: int = 5) -> list[dict]:
    client = get_tavily()
    enriched_query = f"Kolkata Durga Puja {query}"
    response = client.search(
        query=enriched_query,
        search_depth="basic",
        max_results=max_results,
        include_answer=False,
    )
    return [
        {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "content": r.get("content", ""),
            "score": r.get("score", 0),
        }
        for r in response.get("results", [])
    ]


def search_news(query: str, max_results: int = 5) -> list[dict]:
    client = get_tavily()
    response = client.search(
        query=query,
        search_depth="basic",
        max_results=max_results,
        topic="news",
        include_answer=False,
    )
    return [
        {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "content": r.get("content", ""),
            "published_date": r.get("published_date", ""),
            "score": r.get("score", 0),
        }
        for r in response.get("results", [])
    ]
