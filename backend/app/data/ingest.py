"""
Run once to load pandal JSON files into ChromaDB.
Usage: python -m app.data.ingest
"""

import json
import os
import sys
import time
import chromadb
from chromadb.config import Settings
from openai import OpenAI

PANDALS_DIR = os.path.join(os.path.dirname(__file__), "../../data/pandals")
COLLECTION_NAME = "puja_pandals"


def pandal_to_chunks(data: dict) -> list[tuple[str, dict]]:
    """Convert a pandal JSON record into text chunks with metadata."""
    name_en = data.get("name_en", "")
    name_bn = data.get("name_bn", "")
    pandal_id = data.get("id", "")

    chunks = []

    # Basic info chunk
    basic = (
        f"Pandal: {name_en} ({name_bn})\n"
        f"Location: {data.get('location_en', '')} ({data.get('location_bn', '')})\n"
        f"Address: {data.get('address', '')}\n"
        f"Nearest Metro: {data.get('nearest_metro', 'N/A')}\n"
        f"Coordinates: {data.get('coordinates', [])}\n"
        f"Established: {data.get('established_year', 'N/A')}\n"
        f"Timings: {data.get('timings', '')}\n"
        f"Crowd Level: {data.get('crowd_level', '')}\n"
        f"Best Visiting Time: {data.get('best_visiting_time', '')}"
    )
    chunks.append((basic, {"pandal_id": pandal_id, "chunk_type": "basic", "lang": "en"}))

    # How to reach chunk
    if data.get("how_to_reach_en"):
        reach = (
            f"How to reach {name_en}:\n{data['how_to_reach_en']}\n\n"
            f"কীভাবে পৌঁছাবেন {name_bn}:\n{data.get('how_to_reach_bn', '')}"
        )
        chunks.append((reach, {"pandal_id": pandal_id, "chunk_type": "directions", "lang": "bilingual"}))

    # Specialty / theme chunk
    if data.get("specialty_en"):
        specialty = (
            f"{name_en} Specialty:\n{data['specialty_en']}\n\n"
            f"{name_bn} বিশেষত্ব:\n{data.get('specialty_bn', '')}\n\n"
            f"2024 Theme: {data.get('theme_2024', 'N/A')}"
        )
        chunks.append((specialty, {"pandal_id": pandal_id, "chunk_type": "specialty", "lang": "bilingual"}))

    return chunks


def embed_batch(client: OpenAI, texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [item.embedding for item in response.data]


def main():
    from dotenv import load_dotenv
    load_dotenv()

    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        print("ERROR: OPENAI_API_KEY not set in .env")
        sys.exit(1)

    persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
    client_openai = OpenAI(api_key=openai_key)

    chroma = chromadb.PersistentClient(
        path=persist_dir,
        settings=Settings(anonymized_telemetry=False),
    )

    collection = chroma.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    pandal_files = [f for f in os.listdir(PANDALS_DIR) if f.endswith(".json")]
    print(f"Found {len(pandal_files)} pandal files")

    all_texts, all_ids, all_metas = [], [], []

    for fname in pandal_files:
        with open(os.path.join(PANDALS_DIR, fname)) as f:
            data = json.load(f)

        chunks = pandal_to_chunks(data)
        for idx, (text, meta) in enumerate(chunks):
            chunk_id = f"{data['id']}_{idx}"
            all_texts.append(text)
            all_ids.append(chunk_id)
            all_metas.append(meta)

    print(f"Total chunks to embed: {len(all_texts)}")

    batch_size = 20
    for i in range(0, len(all_texts), batch_size):
        batch_texts = all_texts[i : i + batch_size]
        batch_ids = all_ids[i : i + batch_size]
        batch_metas = all_metas[i : i + batch_size]

        embeddings = embed_batch(client_openai, batch_texts)
        collection.upsert(
            ids=batch_ids,
            embeddings=embeddings,
            documents=batch_texts,
            metadatas=batch_metas,
        )
        print(f"  Ingested chunks {i}–{i + len(batch_texts) - 1}")
        if i + batch_size < len(all_texts):
            time.sleep(0.5)

    print(f"\nDone. Collection now has {collection.count()} chunks.")


if __name__ == "__main__":
    main()
