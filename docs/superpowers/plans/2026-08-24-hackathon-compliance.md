# Hackathon compliance implementation plan

## Goal

Turn EchoReport from a deterministic browser prototype into a credible, runnable Strands Agents submission while preserving the existing Vue experience and keeping the local demo usable when cloud credentials are unavailable.

## Scope

1. **Agent runtime** — add a small Python HTTP service using the official `strands-agents` SDK. It exposes `/health`, `/api/chat`, and `/api/report`; prompts explicitly constrain the agent to reflective, non-clinical support and return JSON-compatible text.
2. **Frontend integration** — add a single API adapter controlled by `VITE_AGENT_API_URL`. The UI calls the Strands service when configured and retains the existing local fallback only for offline development, with a visible mode indicator in the README.
3. **Submission artifacts** — add Apache-2.0 license, English README/setup/testing instructions, an architecture diagram source, and a reproducible smoke-test command. The README will state model/provider prerequisites and data-safety boundaries.
4. **Verification** — run Vue tests/build, Python syntax checks, and an HTTP health smoke test. Then inspect the Devpost submission in the browser and update only fields supported by the completed artifacts.

## Files to create or change

- `agent/server.py`: stdlib HTTP server, Strands `Agent`, request validation, CORS, `/health`, `/api/chat`, `/api/report`.
- `agent/requirements.txt`: pinned major-compatible `strands-agents` dependency.
- `agent/.env.example`: model/provider and port settings, no secrets.
- `src/lib/agentApi.ts`: typed frontend adapter and fallback-aware errors.
- `src/stores/conversation.ts`: async send/report flow through the adapter, preserving local fallback behavior.
- `README.md`: English-first project overview, problem/audience/impact, setup, testing, architecture, safety, and deployment notes.
- `LICENSE`: Apache License 2.0.
- `docs/architecture.mmd`: Mermaid diagram covering UI, Strands loop, tools/integrations, AWS model service, and output.
- `docs/testing.md`: short English judge-facing test script.

## Acceptance criteria

- `npm test -- --run` and `npm run build` pass.
- `python3 -m py_compile agent/server.py` passes without installed cloud credentials.
- `GET /health` returns JSON with service status when the agent server is started.
- Frontend has no hard-coded secret and documents the cloud API switch.
- README and Devpost-ready materials clearly disclose that production calls use Strands and AWS Bedrock, while offline fallback is only a local-development path.
