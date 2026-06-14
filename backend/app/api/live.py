import asyncio
import os
from fastapi import APIRouter, Query
from openai import AsyncOpenAI
from app.rag.web_search import search_news

router = APIRouter()

NEWS_QUERIES = [
    "Kolkata Durga Puja pandal 2024 latest update",
    "Durga Puja Kolkata crowd traffic update today",
    "Kolkata Puja celebration theme 2024",
]

SUMMARIZE_PROMPT_EN = (
    "Summarize the following news article about Kolkata Durga Puja in exactly 2 sentences in English. "
    "Be factual and concise."
)

SUMMARIZE_PROMPT_BN = (
    "নিচের কলকাতা দুর্গাপূজা সংক্রান্ত সংবাদটি বাংলায় ঠিক ২টি বাক্যে সংক্ষেপ করুন। "
    "তথ্যনিষ্ঠ ও সংক্ষিপ্ত হন।"
)


async def summarize_article(client: AsyncOpenAI, article: dict, lang: str) -> dict:
    prompt = SUMMARIZE_PROMPT_BN if lang == "bn" else SUMMARIZE_PROMPT_EN
    text = f"Title: {article['title']}\n\n{article['content']}"

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text},
            ],
            temperature=0.2,
            max_tokens=150,
        )
        summary = response.choices[0].message.content or ""
    except Exception:
        summary = article["content"][:200]

    return {
        "title": article["title"],
        "summary": summary,
        "url": article["url"],
        "published_date": article.get("published_date", ""),
        "source": _extract_domain(article["url"]),
    }


def _extract_domain(url: str) -> str:
    try:
        from urllib.parse import urlparse
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return url


@router.get("/live-feed")
async def live_feed(lang: str = Query(default="en", pattern="^(en|bn)$")):
    all_results: list[dict] = []
    for query in NEWS_QUERIES:
        results = search_news(query, max_results=2)
        all_results.extend(results)

    seen_urls: set[str] = set()
    unique_results = []
    for r in all_results:
        if r["url"] not in seen_urls:
            seen_urls.add(r["url"])
            unique_results.append(r)

    top = sorted(unique_results, key=lambda x: x.get("score", 0), reverse=True)[:6]

    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    cards = await asyncio.gather(*[summarize_article(client, r, lang) for r in top])

    return {"cards": list(cards), "lang": lang}
