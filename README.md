# Parrot WXT Extension

An interview practice assistant that enables mock interviews on LeetCode problems to be conducted with an AI agent. It:

- Detects the current problem (title + description) directly from the page DOM.
- Lets you start an interview session with selected time & difficulty.
- Streams audio via LiveKit and exchanges structured text messages.
- Responds to agent requests for your current code by scraping the editor.
- Ends with a generated markdown feedback summary.

---

## Core Features

1. Stage-based UX
   - Welcome → Interview (timer + status) → Summary (markdown feedback).
2. LiveKit Integration
   - Room creation & token-based authentication.
   - Text streams for problem, difficulty, code requests, end signals, and feedback.
3. Dynamic Problem Detection
   - MutationObserver resets flow when the user navigates to a new challenge.
4. Code Snapshot Delivery
   - Scrapes DOM elements and sends current code on agent request.
5. Feedback Handling
   - Registers a one-off text stream handler to receive full feedback blob after interview end.
6. Simple, portable frontend (React + WXT extension context ready).

---

## High-Level Architecture

Frontend (this repo):

- Components:
  - Session: Orchestrator (state machine + LiveKit wiring).
  - Welcome: Collects timer/difficulty (not shown here but assumed).
  - Interview: Countdown + agent status + control buttons.
  - Summary: Renders markdown feedback or loading skeleton.
- LiveKit Client:
  - Connects with token from local backend.
  - Sends text messages on specific topics.
  - Listens for agent connection & feedback streams.

Backend (expected local Python services):

- token_server.py: Issues LiveKit access tokens.
- agent.py: Connects as the AI/agent participant, consumes topics, generates feedback, requests code, sends final summary.

---

## Session Flow

1. User lands on a coding problem page.
2. Session component captures title + description.
3. User starts interview (selects duration + difficulty).
4. Frontend fetches LiveKit token → creates Room → connects.
5. When agent joins:
   - Sends problem (topic: `problem`).
   - Sends difficulty (topic: `difficulty`).
6. Agent may send `request_code` → frontend scrapes and returns `user_code`.
7. User ends interview → frontend sends `end_interview`.
8. Agent responds with `interview_feedback` stream.
9. Summary page displays markdown feedback.

---

## LiveKit Text Topics Used

| Topic              | Direction     | Payload                           |
| ------------------ | ------------- | --------------------------------- |
| problem            | Frontend → AI | "Title: ..., Description: ..."    |
| difficulty         | Frontend → AI | single word (easy/medium/hard)    |
| request_code       | AI → Frontend | trigger only (ignored body)       |
| user_code          | Frontend → AI | concatenated code editor contents |
| end_interview      | Frontend → AI | {"action":"end_interview"} JSON   |
| interview_feedback | AI → Frontend | full markdown feedback blob       |

---

## Tech Stack

- Frontend: React (WXT environment), Tailwind classes in JSX.
- Realtime Connection: LiveKit (WebRTC audio + data channels).
- Backend: Python (token service + agent logic).

---

## Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- LiveKit Cloud project (or self-hosted server)

---

## Environment Variables

Create a backend `.env` (or export) with:

```
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_HOST=wss://your-livekit-host
```

Frontend expects token server at:

```
http://127.0.0.1:5000/getToken
```

Adjust fetch URL in `session.jsx` if different.

---

## Local Setup & Run

### 1. Clone

```
git clone <repo-url>
cd parrot_wxt
```

### 2. Backend Setup

```
cd backend
python -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

```
python agent.py download_files
```

Start token server (Terminal 1):

```
python token_server.py
```

Start agent (Terminal 2, still in venv):

```
python agent.py dev
```

### 3. Frontend / Extension Dev

From project root:

```
npm install
npm run dev
```

Follow WXT/extension instructions (e.g. load dist build in browser if required).

---

## Testing the Flow

1. Open the coding platform page (ensure required DOM selectors exist).
2. Load the extension UI (popup/panel depending on integration).
3. Select time & difficulty → Start.
4. Wait for "Agent connected".
5. Write code; when agent requests, it will receive your current snapshot.
6. Click End Interview → Wait for feedback to appear.
7. Optionally Start New Interview or change the problem (observer resets stage).

---

## Troubleshooting

| Issue                  | Cause                                        | Fix                                                   |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------- |
| Token fetch fails      | Backend not running / wrong URL              | Start token_server.py, verify port/URL                |
| Agent never connects   | agent.py not running / LiveKit creds invalid | Check logs; verify API key/secret                     |
| Feedback never appears | end_interview not processed                  | Ensure agent handles `end_interview` topic            |
| Code sent is empty     | DOM selectors changed                        | Update `.view-line` scraping selector                 |
| Wrong problem shown    | Title selector mismatch                      | Adjust `.text-title-large` / `.elfjS` logic           |
| Audio blocked          | Autoplay restrictions                        | User interaction may be needed (StartAudio component) |
