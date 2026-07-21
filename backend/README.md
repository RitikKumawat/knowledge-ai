## RAG PROJECT 

Commands for running redis and chroma db 
1. Run Redis locally

Pull and start Redis:
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7

2. Run ChromaDB locally

Start ChromaDB:
docker run -d \
  --name chromadb \
  -p 8000:8000 \
  chromadb/chroma