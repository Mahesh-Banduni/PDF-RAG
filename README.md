# AI-Powered PDF RAG System

**AI-powered Retrieval-Augmented Generation (RAG) platform** is built with **Next.js** and **TailwindCSS**, enabling users to upload PDFs, semantically search content, and engage in contextual AI chat experiences powered by vector search.

## Features

### Authentication & User Management

* Seamless authentication and user management with **Clerk**.
* Webhooks auto-sync user data — create, update, and delete user records in the database based on Clerk events.

### RAG Pipeline & Vector Search

* Full RAG workflow using **LangChain** for:

  * PDF text extraction
  * Splitting & chunking
  * Embedding generation using **Gemini Embedding Model**
* **Pinecone Vector DB** integration for scalable semantic search & retrieval.
* Vector isolation using user-based namespaces to ensure data privacy, optimized search performance, and scoped retrieval.

### PDF Upload & Management

* Authenticated users can upload PDFs and manage their document library.
* View, download, and remove previously uploaded PDFs.
* PDFs are associated with individual users for secure, isolated access.

### AI Chat with Context Awareness

* Streaming AI chat powered by **Google Generative AI SDK** for real-time responses.
* Short-term conversational memory allows for contextual awareness within each chat session.
* Enhanced chat UI features:

  * Message editing
  * Response regeneration
  * Copy-to-clipboard
  * Clear chat history

### Multi‑Channel Chat Architecture

* Multi‑channel chat system enabling separate conversations with isolated context.
* Full CRUD for chat channels:

  * Create, rename, and delete channels
  * Remove all associated context and PDF data upon channel deletion
* Channel‑level PDF context:

  * PDFs are isolated per channel
  * Each channel supports its own PDF uploads, retrieval context, and chat history

### Chat‑Message Attached PDFs

* PDFs uploaded through chat are visually attached to messages.
* Users can view or download attached files from the chat interface.

## 🛠️ Tech Stack

| Category     | Technology                                  |
| ------------ | ------------------------------------------- |
| Frontend     | Next.js, TailwindCSS                        |
| Auth         | Clerk                                       |
| AI / LLM     | Google Generative AI (Gemini)               |
| RAG Pipeline | LangChain                                   |
| Vector DB    | Pinecone                                    |
| Storage      | BackBlaze                                   |

