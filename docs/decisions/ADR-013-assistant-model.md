# ADR-013: The assistant chains free model providers

Status: Accepted. Date: 2026-11-15.

## Context

[ADR-007](ADR-007-assistant.md) left the model open. The team wants a model that costs nothing during the hackathon, supports tool calling (the assistant must get every number from the API), and can be swapped without code changes.

## Decision

The API talks to OpenAI-compatible chat completions endpoints and chains every free provider that has a key: NVIDIA, Groq, Google Gemini, Cloudflare Workers AI, SambaNova, OpenRouter and Cohere, in that order, then any other endpoint. When one is rate limited or down, the next answers. Each uses free models that support tool calling, picked from the provider's own model list and documentation on 2026-11-15. The list, with sources, is in [backend/assistant.md](../backend/assistant.md#model). The order puts the largest stated daily quota first.

Cerebras, Mistral, GitHub Models, Together and Hugging Face were checked the same day and left out: their own pages show no free API use (a payment method or credits are required, or the service is retired).

## Consequences

- No cost. Each free tier is small (OpenRouter: 50 requests a day; Groq: 1,000; NVIDIA: up to 10,000), and one answer can use up to four requests. Chaining adds the quotas up. The API also limits each visitor to 6 questions a minute and 60 a day.
- Free models can be slow and their quality varies. The panel says that answers can be wrong, and the guardrails do not depend on the model behaving well.
- Adding a provider is one entry in `apps/api/app/services/providers.py` and one setting.
- Different models answer in slightly different styles; the guardrails do not depend on which one answers.
- Data use differs: Gemini's free tier uses prompts to improve Google's products; Cloudflare says it does not train on customer content; for the others it is to confirm. The assistant asks for and stores no personal data.

## Alternatives considered

- **A paid model.** Better answers, but costs money and needs a card on file.
- **Only OpenRouter.** Simplest, but 50 requests a day is about 12 to 25 answers.
- **One provider's own SDK.** Ties the code to one provider; ADR-007 asks for an interface.
- **A local model.** No limits, but needs a server with a GPU that the team does not have.
