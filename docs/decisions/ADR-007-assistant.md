# ADR-007: The assistant uses a knowledge base first, behind a model interface

Status: Accepted. Date: 2026-11-14.

## Context

We want a chat assistant that explains results. Two questions: how it gets its facts, and which AI model it runs on. The model has not been chosen.

## Decision

Facts come from a small set of documents we maintain, all of which are sent with each question, and from tools that call our own API. Retrieval is added only if the documents outgrow one request. The service talks to the model through one interface, so the provider is a configuration choice.

## Consequences

- No vector store or embedding step to build or operate now.
- Every number the assistant gives was computed by our engine.
- Changing the model does not touch the service's logic.
- The knowledge base must stay small and curated, and each file must list its sources.
- If the model is unavailable, only the chat panel is affected.

## Alternatives considered

- **Retrieval from the start.** Scales to many documents, but adds parts that can fail, for a knowledge base that fits in one request.
- **Letting the model answer from its own knowledge.** No documents to write, but answers cannot be traced to a source, and numbers could be invented.
- **Building directly on one provider's SDK.** Less code now, but the model choice is open.
