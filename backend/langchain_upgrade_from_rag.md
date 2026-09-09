# Rebuilding the RAG Project with Langchain

This document outlines the plan to refactor your current custom RAG implementation to use **LangChain**. 

## Why LangChain? Is it feasible? What difference will it make?

### Feasibility
**Yes, it is highly feasible.** LangChain has a robust JavaScript/TypeScript library (`langchain`, `@langchain/core`, `@langchain/community`) that works perfectly with NestJS. Furthermore, LangChain already has official integrations for all the technologies you are currently using: **Ollama**, **Groq**, **HuggingFace**, **Chroma**, and **Upstash**.

### Why use LangChain?
1. **Standardized Abstractions**: Instead of writing custom logic to connect Ollama, Chroma, and Hugging Face, LangChain provides standard interfaces (`ChatModels`, `Embeddings`, `VectorStores`). If you ever want to switch from Groq to OpenAI, you only change one line of code instead of rewriting your service.
2. **Built-in Advanced Tools**: You are currently using a custom word-based chunker. LangChain provides advanced splitters like `RecursiveCharacterTextSplitter` that respect sentence and paragraph boundaries, leading to better context retrieval.
3. **Declarative Pipelines (LCEL)**: LangChain Expression Language (LCEL) allows you to define your entire RAG pipeline (Retrieval -> Prompt Formatting -> LLM Generation -> Output Parsing) as a clean, declarative sequence.
4. **Learning Value**: As an AI developer, LangChain is an industry standard. Learning its patterns (Document Loaders, Text Splitters, Retrievers, and Chains) is highly valuable.

### Differences It Will Make in Your Code
*   **`DocumentsProcessor`**: Will use LangChain's `PDFLoader` and `RecursiveCharacterTextSplitter` instead of manual file reading and word-chunking.
*   **`VectorDbService`**: Will be replaced by LangChain `VectorStore` instances (`Chroma` and `UpstashVectorStore`). The manual `upsertChunks` and `queryChunks` logic will be handled automatically by LangChain.
*   **`EmbeddingsService`**: Will instantiate `OllamaEmbeddings` and `HuggingFaceInferenceEmbeddings` from LangChain, removing the manual API call loops and batching logic.
*   **`AskQuestionService`**: Instead of manually building prompts and fetching recent messages, we will use LangChain's `createHistoryAwareRetriever` and `createRetrievalChain` to automatically handle history and context ingestion.

---

## Proposed Changes

To accomplish this, we will update your existing services to use LangChain components while keeping your NestJS structure intact.

### 1. Dependencies

We will install the necessary LangChain packages.

#### [MODIFY] package.json
*   Add dependencies: `@langchain/core`, `langchain`, `@langchain/community`, `@langchain/ollama`, `@langchain/groq`, `@upstash/vector` (if missing specific version), `@langchain/core/documents` etc.

---

### 2. Embeddings & LLM Services

We will refactor these to return LangChain `Embeddings` and `BaseChatModel` instances so they can be plugged into LangChain chains.

#### [MODIFY] src/embeddings/embeddings.service.ts
*   Refactor to return `HuggingFaceInferenceEmbeddings` for production and `OllamaEmbeddings` for local development.
*   This will completely replace the custom batching and fetch logic, as LangChain handles that internally.

#### [MODIFY] src/ollama/ollama.service.ts
*   Refactor to return an instantiated `ChatGroq` for production and `ChatOllama` for local development.
*   Remove the manual `groq.chat.completions.create` and `ollama.chat` logic.

---

### 3. Vector Database Service

We will adapt your Vector DB service to use LangChain's `VectorStore` abstraction.

#### [MODIFY] src/vector-db/vector-db.service.ts
*   Create getters for LangChain `VectorStore` objects (`Chroma` or `UpstashVectorStore`).
*   This allows the Vector Store to natively consume LangChain `Document` objects and use LangChain's `Retriever` interface.

---

### 4. Document Processing (Ingestion Pipeline)

We will upgrade your chunking and parsing logic.

#### [MODIFY] src/documents/documents.processor.ts
*   Replace `pdf-parse` manual logic with LangChain's `PDFLoader`.
*   Replace `chunkText` with `RecursiveCharacterTextSplitter` for semantic chunking.
*   Use `vectorStore.addDocuments(...)` to ingest chunks directly instead of manual loops.

---

### 5. Chat Generation (RAG Pipeline)

We will use LCEL (LangChain Expression Language) to construct the RAG chain.

#### [MODIFY] src/ask-question/ask-question.service.ts
*   Refactor to use `createRetrievalChain`, `createStuffDocumentsChain`, and `createHistoryAwareRetriever`.
*   Pass the chat history and the current question to the chain, and use `.stream()` to yield chunks to the GraphQL subscription.

#### [DELETE] src/prompt-builder/prompt-builder.service.ts
*   This service will likely become obsolete or significantly reduced, as LangChain's `ChatPromptTemplate` will handle prompt construction and history formatting natively.

---

## Verification Plan

### Automated/Manual Verification
-   **Ingestion**: Upload a new PDF from the frontend. Verify in MongoDB and Chroma/Upstash that the document is chunked properly (we should see better chunk quality due to `RecursiveCharacterTextSplitter`).
-   **Retrieval & Chat**: Ask a question about the uploaded document. Ensure the LangChain retrieval chain correctly fetches context and streams the LLM response back to the UI.
-   **Environment Switching**: Test with both `NODE_ENV=production` (Groq/Upstash/HF) and local (Ollama/Chroma) to ensure the LangChain integrations work in both scenarios.

---

## User Review Required

> [!IMPORTANT]
> Since we are switching the chunking strategy (from a custom word chunker to LangChain's `RecursiveCharacterTextSplitter`), any existing documents in your Vector DB were chunked differently. 
> For the best experience, you might need to re-upload your existing PDFs after this migration so they are re-chunked using the improved LangChain splitter.

> [!TIP]
> Are you ready to proceed with installing the LangChain packages and beginning the migration?
