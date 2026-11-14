# Assistant

Status: Design. Last updated: 2026-11-14.

The assistant is a chat panel that explains what the app shows. It exists because much of the vocabulary (ephemeris, libration, Earthset) is new to most people, and because asking a question is sometimes faster than setting up a comparison by hand.

## What it must and must not do

It must:

- answer questions about the Moon, the south pole, the terms used in the app, and the data behind it;
- explain a result the user is looking at;
- run a calculation when asked ("which of these sites gets the most sunlight in March 2027?") and report the numbers;
- say where each part of its answer comes from;
- say that it does not know when the answer is not in its documents or its tool results.

It must not:

- state a computed value (an angle, a percentage, a time) that did not come from a tool call in the same answer;
- answer questions unrelated to the app's subject; it declines in one sentence;
- store anything about the user.

## Two sources of truth

1. **The knowledge base.** Markdown files in `apps/api/app/data/knowledge/`. They are short and written or collected by the team, each with its sources listed.

   | File | Contents |
   | --- | --- |
   | `challenge.md` | What the challenge asks for, in our words, with a link to the official page |
   | `glossary.md` | The same terms as [reference/glossary.md](../reference/glossary.md) |
   | `sites.md` | One paragraph per curated site, generated from `sites.json` |
   | `data-notes.md` | Which NASA data we use and what its limits are |
   | `missions.md` | Background on past and planned Moon missions, from NASA and the Canadian Space Agency portal |
   | `app-help.md` | How to use each screen and what each metric means |

2. **The app's own API**, through tools.

   | Tool | Calls | Returns to the model |
   | --- | --- | --- |
   | `list_sites` | `sites.list_sites()` | id, name, coordinates and kind of each site |
   | `analyze` | `metrics.run(scenarios)` | metrics, status and windows; the long series are left out |
   | `scene` | `scene.at(t)` | sub-solar and sub-Earth points, Moon distance |

   Tools call the service functions directly, in process. They are bound by the same limits as the public endpoints.

## Knowledge base first, retrieval later

While the knowledge base is small (a few thousand words), all of it goes into the system prompt on every request. This is simple, has no moving parts, and the model sees everything.

Retrieval (RAG) is added only when the knowledge base no longer fits comfortably:

1. Split each file at its headings into passages.
2. Compute an embedding for each passage and store them in a file.
3. For each question, embed the question, take the closest passages, and put only those in the prompt.

The service is written so this change stays inside one function, `knowledge.select(question) -> passages`. Today that function returns everything.

## Model

The model is not chosen yet. The service talks to it through one interface:

```python
class LLMClient(Protocol):
    def complete(self, system: str, messages: list[Message], tools: list[ToolSpec]) -> ModelTurn: ...
```

One implementation per provider lives behind it and is picked by configuration (`LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`). Requirements for whichever model is chosen: tool calling, enough context for the knowledge base, and an acceptable response time on a free or low-cost tier.

## One answer, step by step

1. The router receives the messages and the current scenarios.
2. The service builds the system prompt: role, rules, the knowledge base, and a short description of the scenarios on screen.
3. It calls the model with the tool list.
4. If the model asks for a tool, the service runs it and sends the result back. At most 3 tool rounds per answer.
5. The final text is returned with the list of sources: the knowledge files it was given that it cites, and the tools it used.

If the model cannot be reached or no key is configured, the endpoint returns `assistant_unavailable` and the rest of the app is unaffected.

## Prompt rules (kept in `app/services/assistant_prompt.md`)

- You are the assistant inside Moon Maps. Answer from the documents below and from tool results only.
- For any number about a site or a date, call a tool. Never estimate.
- Name your source at the end of the answer.
- If you do not know, say so and suggest what the user could try in the app.
- Keep answers short. Use plain words. Explain a technical term the first time you use it.
- Decline unrelated requests in one sentence.

## Safety and cost

- The API key exists only in the API's environment. The browser never sees it.
- Rate limit per client address, a cap on message length and on messages per request.
- The model's output is shown as text, never run as code or inserted as HTML.
- Text from the knowledge base and from tool results is treated as data. Instructions found inside it are not followed.
- No conversation is stored on the server. The browser keeps the current conversation in memory and sends it with each request.

## In the interface

- The panel is labelled as an AI assistant.
- Each answer shows its sources under it.
- When an answer used the `analyze` tool, a button loads those scenarios into the app, so the user can check the numbers on screen.
