"""
One-time script to collect data on top 50 Kolkata Durga Puja pandals
using Tavily search and GPT-4o to structure the results.

Usage:
  cd backend
  python scripts/collect_pandal_data.py
"""

import json
import os
import sys
import time

TOP_50_PANDALS = [
    "Kumartuli Sarbojanin",
    "Bagbazar Sarbojanin",
    "College Square Puja",
    "Shyambazar Panchauthi",
    "Hatibagan Sarbojanin",
    "Mohammad Ali Park",
    "Mudiali Club",
    "Ekdalia Evergreen",
    "Sreebhumi Sporting Club",
    "Deshapriya Park",
    "Chetla Agrani Club",
    "Tridhara Sammilani",
    "Suruchi Sangha",
    "Behala Friends",
    "Barisha Club",
    "Santosh Mitra Square",
    "Naktala Udayan Sangha",
    "Jodhpur Park",
    "Bosepukur Sitala Mandir",
    "Dum Dum Park Bharat Chakra",
    "Ultadanga Junction",
    "FD Block Salt Lake",
    "AJ Block Salt Lake",
    "Tala Park Prattoy",
    "Beleghata 33 Pally",
    "Maniktala Chaltabagan",
    "Rajdanga Naba Uday Sangha",
    "Ballygunge Cultural Association",
    "Hindustan Park Sarbojanin",
    "Kasba Bosepukur Talbagan",
    "Kashi Bose Lane",
    "Barisha Sarbojanin",
    "Singhi Park",
    "Vivekananda Sarani Sarbojanin",
    "Telengabagan Durgotsav",
    "Golpark Rammohan Samity",
    "Selimpur Pally",
    "Triangular Park",
    "New Alipore Multistorey",
    "Badamtala Ashar Sangha",
    "Nawab Katra",
    "Shibpur Dharmadas Institution",
    "South Howrah Sarbojanin",
    "Bansdroni Pallimangal",
    "Tobin Road Puja",
    "Purbasha",
    "Lake Town Block A",
    "Kalighat Milan Sangha",
    "Rashbehari Sadharan",
    "Survey Park Sarbojanin",
]

EXTRACT_SCHEMA_PROMPT = """Extract structured information about the Durga Puja pandal from the search results below.
Return ONLY a valid JSON object with these exact fields (use empty string "" if unknown):

{
  "id": "<snake_case_id>",
  "name_en": "<English name>",
  "name_bn": "<Bengali name in Unicode>",
  "location_en": "<area, city in English>",
  "location_bn": "<area, city in Bengali>",
  "address": "<full address if available>",
  "coordinates": [<lat>, <lng>],
  "nearest_metro": "<station name and line>",
  "how_to_reach_en": "<detailed directions in English>",
  "how_to_reach_bn": "<detailed directions in Bengali>",
  "crowd_level": "<low|medium|high|very_high>",
  "best_visiting_time": "<e.g. early morning 4-7 AM>",
  "specialty_en": "<what makes this pandal special>",
  "specialty_bn": "<Bengali description of specialty>",
  "theme_2024": "<2024 puja theme if known>",
  "established_year": <year as integer or null>,
  "timings": "<operating hours during puja>",
  "tags": ["<tag1>", "<tag2>"]
}

Return ONLY the JSON, no explanation."""


def collect_one(pandal_name: str, tavily_client, openai_client) -> dict | None:
    print(f"  Collecting: {pandal_name}")

    try:
        result = tavily_client.search(
            query=f"{pandal_name} Kolkata Durga Puja pandal location directions crowd",
            search_depth="basic",
            max_results=4,
        )
        snippets = "\n\n".join(
            f"[{r.get('title', '')}]\n{r.get('content', '')}"
            for r in result.get("results", [])
        )
    except Exception as e:
        print(f"    Tavily error: {e}")
        return None

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": EXTRACT_SCHEMA_PROMPT},
                {
                    "role": "user",
                    "content": f"Pandal: {pandal_name}\n\nSearch results:\n{snippets}",
                },
            ],
            temperature=0.1,
            max_tokens=800,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)

        if not data.get("id"):
            data["id"] = pandal_name.lower().replace(" ", "_").replace("-", "_")

        return data
    except Exception as e:
        print(f"    GPT error: {e}")
        return None


def main():
    from dotenv import load_dotenv
    load_dotenv()

    openai_key = os.getenv("OPENAI_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")

    if not openai_key or not tavily_key:
        print("ERROR: Set OPENAI_API_KEY and TAVILY_API_KEY in .env")
        sys.exit(1)

    from tavily import TavilyClient
    from openai import OpenAI

    tavily = TavilyClient(api_key=tavily_key)
    openai_client = OpenAI(api_key=openai_key)

    output_dir = os.path.join(os.path.dirname(__file__), "../data/pandals")
    os.makedirs(output_dir, exist_ok=True)

    for i, pandal in enumerate(TOP_50_PANDALS):
        safe_id = pandal.lower().replace(" ", "_").replace("-", "_")
        out_path = os.path.join(output_dir, f"{safe_id}.json")

        if os.path.exists(out_path):
            print(f"  [{i+1}/50] Skipping (exists): {pandal}")
            continue

        print(f"[{i+1}/50]", end=" ")
        data = collect_one(pandal, tavily, openai_client)

        if data:
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"    Saved to {out_path}")
        else:
            print(f"    FAILED for {pandal}")

        time.sleep(1.5)

    files = [f for f in os.listdir(output_dir) if f.endswith(".json")]
    print(f"\nCollection complete. {len(files)}/50 pandal files in {output_dir}")


if __name__ == "__main__":
    main()
