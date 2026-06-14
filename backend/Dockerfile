FROM python:3.11-slim

WORKDIR /app

# Build tools required by chromadb / onnxruntime
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (layer-cache friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application source
COPY app/ ./app/

# Pandal JSON source files (needed if re-ingestion is ever required)
COPY data/ ./data/

# Pre-ingested ChromaDB vector store (92 chunks, ~7 MB — bundle for zero cold-start)
COPY chroma_db/ ./chroma_db/

ENV CHROMA_PERSIST_DIR=./chroma_db
ENV PORT=8000

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
