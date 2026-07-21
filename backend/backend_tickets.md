# RAG Project Backend Roadmap

## Current Status

✅ Authentication

* Signup
* Login
* Access Token
* Refresh Token
* Sessions
* Logout

✅ Document Upload

* Upload PDF
* Store metadata in MongoDB
* Chunk PDF
* Generate embeddings
* Store vectors in ChromaDB

---

# Suggested Schema Change

Instead of:

```ts
documentId: Types.ObjectId;
```

Use:

```ts
documentIds: Types.ObjectId[];
```

inside `ChatSession`.

This enables multi-document chat from day one.

---

# EPIC 1: Chat Sessions

---

## CHAT-1 Create Chat

### Mutation

```graphql
createChat(input: CreateChatInput!): ChatSession!
```

### Input

```graphql
title: String
documentIds: [ID!]!
```

### Flow

```text
User
↓
Create Chat
↓
Validate ownership
↓
Save ChatSession
↓
Return session
```

---

## CHAT-2 List Chats

### Query

```graphql
chatSessions: [ChatSession!]!
```

Returns:

* id
* title
* updatedAt

---

## CHAT-3 Get Chat Details

### Query

```graphql
chatSession(id:ID!): ChatSession!
```

Returns:

* title
* documentIds
* createdAt

Validate ownership.

---

## CHAT-4 Delete Chat

Delete:

* ChatSession
* Messages

Do NOT delete:

* PDFs
* Chunks
* Embeddings

---

# EPIC 2: Messages

---

## MSG-1 Get Messages

### Query

```graphql
messages(sessionId:ID!): [Message!]!
```

Sort:

```ts
createdAt ASC
```

---

## MSG-2 Save User Message

Internal service:

```ts
saveUserMessage()
```

---

## MSG-3 Save Assistant Message

Internal service:

```ts
saveAssistantMessage()
```

---

# EPIC 3: Retrieval

---

## ✅ RET-1 Query Embedding

Input:

```text
What is JWT?
```

Output:

```ts
vector[]
```

---

## ✅ RET-2 Chroma Search

Filter by:

```ts
documentIds[]
```

Use:

```ts
k = 5
```

Return:

```ts
[
{
 chunk,
 similarity,
 documentId
}
]
```

---

## ✅ RET-3 Conversation Memory

Load:

```text
Last 5 messages
```

---

# EPIC 4: Prompt Builder

Create:

```ts
PromptBuilderService
```

---

## PROMPT-1 Build Prompt

Input:

* question
* retrievedChunks
* previousMessages

Output:

```text
Previous Conversation:

User:
...

Assistant:
...

Context:
...

Question:
...

Answer only from context.
```

---

## PROMPT-2 Context Limits

Use:

* Last 5 messages
* Top 5 chunks

---

# EPIC 5: Ollama Service

Create:

```ts
OllamaService
```

---

## OLLAMA-1 Generate Answer

Method:

```ts
generateAnswer(prompt)
```

Model:

```text
qwen3-coder:30b
```

Returns:

```ts
answer
```

---

## OLLAMA-2 Streaming Support

Future feature.

---

## OLLAMA-3 Integrate AI Title Generation

Pending task for CHAT-6: Once OllamaService is complete, integrate `ChatService.generateAiTitle` with the actual prompt to generate titles based on the first message.

---

# EPIC 6: Ask Question

⭐ Core Ticket

---

## ASK-1 GraphQL Mutation

```graphql
askQuestion(input: AskQuestionInput!): AskQuestionResponse!
```

Input:

```graphql
sessionId
question
```

---

## Flow

```text
User
↓
Validate session ownership
↓
Save user message
↓
Load session
↓
Get documentIds
↓
Generate query embedding
↓
Search Chroma
↓
Retrieve top 5 chunks
↓
Load previous messages
↓
Build prompt
↓
Call Qwen
↓
Save assistant message
↓
Return answer
```

---

## ASK-2 Response

```graphql
type AskQuestionResponse {
  answer: String!
  sources: [Source!]!
}
```

Source:

```graphql
type Source {
  documentId: ID!
  chunk: String!
  similarity: Float!
}
```

Future:

* page number
* filename

---

# EPIC 7: Auto Chat Title

---

## CHAT-5 Default Title

```text
New Chat
```

---

## CHAT-6 AI Generated Title

After first message:

Example:

```text
JWT Authentication
```

Save:

```ts
ChatSession.title
```

Generate only once.

---

# EPIC 8: Document Management

---

## DOC-1 List Documents

Current user only.

---

## DOC-2 Document Details

Query:

```graphql
document(id)
```

Return:

* pages
* chunksCount
* status
* createdAt

---

## DOC-3 Delete Document

Delete:

### Mongo

UploadedDoc

### File

PDF

### Chroma

Embeddings

### DocumentChunk Collection

Chunks

---

## DOC-4 Update Chats

If document deleted:

Remove document from chat sessions automatically.

---

# EPIC 9: Dashboard

---

## DASH-1 Stats Query

Return:

```graphql
dashboardStats {
 documentsCount
 chatsCount
 messagesCount
}
```

---

# EPIC 10: Search

---

## SEARCH-1 Search Chats

```graphql
searchChats(query:String!)
```

---

## SEARCH-2 Search Documents

```graphql
searchDocuments(query:String!)
```

---

# EPIC 11: Streaming

Future feature.

Possible implementations:

* GraphQL Subscriptions
* Server Sent Events

---

# EPIC 12: Multi-Document Chat

Supported by:

```ts
documentIds[]
```

Example:

* NodeJS.pdf
* JWT.pdf
* GraphQL.pdf

Question:

```text
Explain JWT in NodeJS.
```

Flow:

```text
Question
↓
Embedding
↓
Chroma Search
↓
Filter by selected documents
↓
Top chunks
↓
Qwen
↓
Answer
```

---

# Build Order

## Phase 1 (Core MVP)

1. CHAT-1 Create Chat
2. CHAT-2 List Chats
3. MSG-1 Get Messages
4. ✅ RET-1 Query Embedding
5. ✅ RET-2 Chroma Search
6. PROMPT-1 Build Prompt
7. OLLAMA-1 Generate Answer
8. ASK-1 Ask Question ⭐
9. ASK-2 Sources

---

## Phase 2

10. Save messages
11. Conversation memory
12. Delete chat
13. Document details
14. Dashboard stats

---

## Phase 3

15. Auto title generation
16. Multi-document chat
17. Streaming
18. Search

---

# Next Ticket To Start

⭐ ASK-1

This ticket connects:

```text
Session
↓
Retrieval
↓
Prompt Builder
↓
Qwen
↓
Save Messages
↓
Return Answer
```

Once ASK-1 works, the entire backend MVP is functional and frontend development becomes straightforward.
