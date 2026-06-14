import os
import chromadb
from chromadb.config import Settings
from app.rag.embeddings import embed_text

_chroma_client = None
_collection = None

COLLECTION_NAME = "puja_pandals"


def get_collection():
    global _chroma_client, _collection
    if _collection is None:
        persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        _chroma_client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(anonymized_telemetry=False),
        )
        _collection = _chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


async def retrieve(query: str, n_results: int = 5) -> list[dict]:
    collection = get_collection()
    embedding = await embed_text(query)

    results = collection.query(
        query_embeddings=[embedding],
        n_results=min(n_results, max(1, collection.count())),
        include=["documents", "metadatas", "distances"],
    )

    if not results["documents"] or not results["documents"][0]:
        return []

    threshold = float(os.getenv("SIMILARITY_THRESHOLD", "0.75"))
    chunks = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        # Chroma cosine distance: 0 = identical, 2 = opposite. Convert to similarity.
        similarity = 1 - (dist / 2)
        if similarity >= threshold:
            chunks.append({"text": doc, "metadata": meta, "similarity": similarity})

    return chunks
