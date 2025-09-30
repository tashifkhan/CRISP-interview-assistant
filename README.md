# CRISP Interview Assistant

An AI-powered technical interview assistant built with Next.js (App Router) that provides:

- **Interviewee Interface**: Smart resume upload with AI-powered parsing, timed Q&A sessions, local state persistence
- **Enhanced Question Generation**: All questions generated upfront before timer starts for seamless experience
- **Gemini AI Integration**: Advanced resume parsing, question generation, and answer evaluation using Google's Gemini API
- **Interviewer Dashboard**: Comprehensive scores, summaries, searchable candidate list, detailed transcripts
- **Hybrid Persistence**: IndexedDB for in-progress sessions, MongoDB for completed interviews
- **Comprehensive Resume Processing**: Extracts skills, experience, education, and professional summaries with retry logic

## High-Level Architecture

| Layer              | Responsibilities                                                             |
| ------------------ | ---------------------------------------------------------------------------- |
| Frontend (Next.js) | Chat UI, timers, resume parsing, local state & recovery, dashboard views     |
| API Routes         | LLM orchestration, evaluation, summary generation, MongoDB persistence       |
| Local (IndexedDB)  | In-progress interview state (questions, answers, timers, profile)            |
| MongoDB            | Completed interviews (profile + Q&A + per-question + final summary + scores) |

## Interview Flow

1. **Resume Upload & AI Parsing**: PDF/DOCX upload with Gemini-powered extraction of skills, experience, and professional details
2. **Profile Collection**: Auto-fill name/email/phone from resume, select interview focus area
3. **Question Generation Phase**: All 6 questions generated upfront using AI based on resume and role
4. **Timed Interview Session**: 6 personalized questions (2 Easy/20s → 2 Medium/60s → 2 Hard/120s)
5. **Real-time Evaluation**: AI scoring per question with detailed feedback
6. **Comprehensive Summary**: AI-generated performance summary and aggregate score
7. **Data Persistence**: Completed interviews saved to MongoDB for dashboard access
8. **Interviewer Dashboard**: Searchable candidate rankings with detailed transcripts

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

Implemented:

- Resume upload & parsing (PDF/DOCX) with naive entity extraction
- Local persisted interview state with timers & auto-advance (2 Easy → 2 Medium → 2 Hard)
- AI provider abstraction using Google Gemini (falls back to deterministic mock if no key)
- Heuristic + LLM (Gemini) answer evaluation (score 0–5) & final summary
- Completion persistence to MongoDB (schema validated via Zod)
- Interviewer dashboard (list, search, sort, detail transcript page `/interviewer/[id]`)
- Unfinished session detection modal & recovery

Upcoming polish / enhancements:

- Improved prompt engineering and rubric scoring
- Retry & offline resilience UI
- Test suite (parsing, reducers, API schemas)
- Accessibility pass & visual refinements

## Enabling AI (Google Gemini)

Add to `.env.local`:

```
GEMINI_API_KEY=your_key_here
# Optional: override default fast model (gemini-1.5-flash)
CRISP_GEMINI_MODEL=gemini-1.5-pro
# Optional: switch engine (direct | chain). 'chain' uses LangChain; direct uses raw SDK.
AI_ENGINE=chain
```

Behavior:

- If a Gemini key is present: real question generation, scoring, summarization.
- If absent: deterministic mock question bank + heuristic scoring & summary.

All AI logic is centralized in `lib/ai/provider.ts` for future multi-provider expansion.

### LangChain / LangGraph

- Chains implemented in `lib/ai/chain.ts` (question, evaluation, summary).
- Experimental graph scaffold in `lib/ai/graph.ts` (currently invoked manually; ready for future adaptive flows).
- Toggle with `AI_ENGINE=chain` to route through LangChain; omit or set to `direct` for lightweight provider calls.

## Candidate Detail Page

Navigate from dashboard list (each candidate links to `/interviewer/{id}`) to view:

- Profile & session metadata
- Full question list with per-question score
- Final summary & overall score
