# CRISP Interview Assistant

An AI-powered technical interview assistant built with Next.js (App Router) that provides:

* Interviewee chat interface (resume upload, timed AI Q&A, local persistence)
* Interviewer dashboard (scores, summaries, searchable/sortable list, detailed transcripts)
* Hybrid persistence (IndexedDB for in-progress sessions, MongoDB for completed interviews)
* LangChain / LangGraph powered question generation, scoring, summarization

## High-Level Architecture

| Layer | Responsibilities |
| ----- | ---------------- |
| Frontend (Next.js) | Chat UI, timers, resume parsing, local state & recovery, dashboard views |
| API Routes | LLM orchestration, evaluation, summary generation, MongoDB persistence |
| Local (IndexedDB) | In-progress interview state (questions, answers, timers, profile) |
| MongoDB | Completed interviews (profile + Q&A + per-question + final summary + scores) |

## Interview Flow

1. Resume upload & parsing (PDF required, DOCX optional)
2. Collect Name / Email / Phone if missing
3. Timed 6-question session (Role: Full Stack React/Node): 2 Easy (20s) → 2 Medium (60s) → 2 Hard (120s)
4. Auto-submit on timer expiry
5. AI scoring per question
6. AI final summary & aggregate score
7. Persist completed record to MongoDB
8. Dashboard displays ranked candidates

## Roadmap (Phases)

1. UI Scaffolding (navigation, base pages, design system w/ shadcn)
2. Resume upload & parsing + profile collection logic
3. MongoDB integration & basic persistence routes
4. AI question generation + evaluation + timers integration
5. Local persistence + recovery modal + completion push to DB
6. Dashboard search/sort + detailed transcript view
7. Polish (prompt engineering, accessibility, visual refinement, tests)

## Development

Install dependencies and run dev server:

```
pnpm install # or npm install / bun install
pnpm dev
```

## Status

Phase 1 scaffolding in progress.
