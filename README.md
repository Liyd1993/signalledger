# EchoReport — a reflective agent for real conversations

EchoReport helps a person slow down, name what they are carrying, and turn ten short expressions into a private reflection report and a shareable keepsake card. It is intentionally non-clinical: it does not diagnose, treat, or replace emergency support.

## Why this matters

People often know they are overwhelmed before they know how to explain it. EchoReport gives them a low-pressure conversation, a concrete next step, and a visual artifact they can keep or share. The target audience is adults who want structured self-reflection, not medical advice.

## Architecture

The production path uses the Strands Agents SDK with an AWS Bedrock model. The Vue client sends conversation turns to the Python service in `agent/`. The service owns the safety prompt and report schema, then returns the agent response. See [`docs/architecture.mmd`](docs/architecture.mmd) and [`docs/testing.md`](docs/testing.md).

## Local development

### UI-only mode

```bash
npm install
npm run dev
```

Without `VITE_AGENT_API_URL`, the browser uses a clearly scoped deterministic fallback so the layout and safety states can be tested offline. This fallback is not the production AI implementation.

### Strands agent mode

Requirements: Python 3.10+, AWS credentials with Bedrock model access, and a model available in your region.

```bash
cd agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python3 server.py
```

In another terminal:

```bash
VITE_AGENT_API_URL=http://127.0.0.1:8787 npm run dev
```

The service exposes `GET /health`, `POST /api/chat`, and `POST /api/report`. No secret is placed in the frontend bundle. For deployment, put credentials in the server environment or an AWS-managed secret store; never commit them.

## Verification

```bash
npm test -- --run
npm run build
python3 -m py_compile agent/server.py
```

## Safety and data boundaries

The app stores demo conversations in browser `localStorage`. Do not enter real medical records or another person's private information. The agent prompt disallows diagnosis and asks for local emergency help when imminent harm is described. Before a public deployment, configure retention, access controls, logging redaction, and a privacy notice appropriate to the chosen provider.

## Hackathon disclosure

The project is a new submission. Third-party SDKs are used under their own licenses; this repository is released under Apache-2.0. The public demo should include a working video, architecture diagram, English testing instructions, and this public repository.
