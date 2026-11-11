# Looplab — LLM chat & comparison

A private, user-supplied-key workspace for text conversations and side-by-side comparisons. The previous code playground has been replaced.

## Features

- Single-model conversation or up to three models per prompt.
- OpenAI Chat Completions, native Anthropic Messages, Gemini's OpenAI-compatible API, OpenRouter, and custom public HTTPS OpenAI-compatible endpoints.
- Provider model listing, editable model IDs and display names.
- Streaming text, cancellation, per-model retry, useful connection errors, user-selected preferred answers.
- First visible text latency, total response duration, and provider-reported input/output token usage. Missing usage remains unknown; scores and costs are not invented.
- Follow-up questions send each model its own successful conversation history. The first comparison question and system instructions are identical across models.
- System instructions and output limit are snapshotted when a new conversation starts.
- Model profiles and up to 30 conversations are saved in this browser's localStorage. JSON export does not contain API keys.
- API keys exist only in the open tab's memory and the outbound request. They are sent to this Site's backend and then to the explicitly chosen provider; they are never stored in localStorage, server storage, source, or logs. Reloading requires re-entry. Key entries are bound to their provider and endpoint.

## Build and run

No dependencies required. Node 22+:

```sh
node scripts/build.mjs
node scripts/validate-artifact.mjs
node --test tests/*.test.mjs
node scripts/dev.mjs
```

Open http://127.0.0.1:4173. The build embeds the UI in `dist/server/index.js` for Cloudflare Workers; no external frontend CDN is required. Keep `.openai/hosting.json` without `static` for this server-backed Site.

## Use

1. Open **모델 연결**, select a provider, enter an API key, load the provider's models or enter an exact model ID, and save.
2. Select **대화하기** for one model or **나란히 비교** for up to three.
3. Choose models and send a prompt. API charges are determined by each provider.
4. Add a key again after refreshing. Model names and conversation history remain on this device.

The model list is not a guarantee that every listed model supports text Chat Completions. Multimodal inputs, tools, Responses-only models, fine-tuning jobs, automatic quality grading, cloud history sync, and local/private network endpoints are outside this version. Responses are displayed as plain text. Streaming requests time out after 90 seconds. Stop cancels the network request but cannot undo provider usage already incurred.

## Validation

Automated checks cover provider payloads, stream parsing, UTF-8 boundaries, cancellation, usage reporting, truncation, credentials, cross-origin rejection, endpoint validation, key isolation, local persistence, and independent per-model context. Real provider inference requires the user's own API keys and has not been tested with live credentials. The initial desktop page and model-connection dialog were visually inspected in Chrome.

## API references

- https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
- https://platform.claude.com/docs/en/build-with-claude/streaming
- https://ai.google.dev/gemini-api/docs/openai
