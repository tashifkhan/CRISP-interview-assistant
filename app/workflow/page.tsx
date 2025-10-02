"use client";
import { Suspense, useState } from "react";
import WorkflowChart from "@/components/flow/WorkflowChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WorkflowFullPage() {
	const [svg, setSvg] = useState("");
	function download(type: "svg" | "png") {
		if (!svg) return;
		if (type === "svg") {
			const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "crisp-workflow.svg";
			a.click();
			URL.revokeObjectURL(url);
		} else {
			// Convert to PNG via canvas
			const parser = new DOMParser();
			const doc = parser.parseFromString(svg, "image/svg+xml");
			const svgEl = doc.documentElement as unknown as SVGSVGElement;
			const width = parseInt(svgEl.getAttribute("width") || "1600", 10);
			const height = parseInt(svgEl.getAttribute("height") || "1200", 10);
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			const img = new Image();
			const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
			const url = URL.createObjectURL(svgBlob);
			img.onload = () => {
				ctx?.drawImage(img, 0, 0);
				URL.revokeObjectURL(url);
				canvas.toBlob((b) => {
					if (!b) return;
					const pngUrl = URL.createObjectURL(b);
					const a = document.createElement("a");
					a.href = pngUrl;
					a.download = "crisp-workflow.png";
					a.click();
					URL.revokeObjectURL(pngUrl);
				}, "image/png");
			};
			img.src = url;
		}
	}
	return (
		<div className="space-y-16 py-14">
			<section className="max-w-6xl mx-auto px-6 space-y-8">
				<div className="space-y-4 relative">
					<span className="pointer-events-none absolute -top-8 right-10 h-40 w-40 rounded-full blur-3xl bg-[radial-gradient(circle_at_60%_40%,rgba(0,173,181,0.4),transparent_65%)] opacity-50" />
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight accent-gradient-text">
						System Architecture & Data Flow
					</h1>
					<p className="text-[var(--foreground-muted)] max-w-3xl text-base leading-relaxed">
						Comprehensive technical overview of the CRISP interview system —
						from resume parsing through AI-driven evaluation to persistent
						storage. Built on Next.js 15 with React 19, powered by Google Gemini
						and MongoDB.
					</p>
					<div className="flex flex-wrap gap-2 pt-2">
						{[
							"Next.js 15 App Router",
							"React 19",
							"Google Gemini",
							"Redux Toolkit + IndexedDB",
							"MongoDB",
							"TypeScript + Zod",
						].map((l) => (
							<Badge
								key={l}
								variant="outline"
								className="text-[10px] tracking-wide"
							>
								{l}
							</Badge>
						))}
					</div>
				</div>
				<div className="flex items-center justify-end gap-3 pt-1">
					<button
						onClick={() => download("svg")}
						disabled={!svg}
						className="px-3 py-1.5 rounded-md text-[11px] font-medium btn-accent disabled:opacity-40 disabled:cursor-not-allowed shadow"
						aria-label="Download workflow SVG"
					>
						Download SVG
					</button>
					<button
						onClick={() => download("png")}
						disabled={!svg}
						className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-emerald-600/80 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow transition-colors"
						aria-label="Download workflow PNG"
					>
						Download PNG
					</button>
				</div>
			</section>

			<section className="max-w-6xl mx-auto px-6">
				<Suspense
					fallback={
						<div className="h-[600px] w-full rounded-xl border border-white/10 bg-white/5 animate-pulse" />
					}
				>
					<WorkflowChart onSvg={setSvg} maxHeight="max-h-[800px]" />
				</Suspense>
			</section>

			<section className="max-w-6xl mx-auto px-6 space-y-5">
				<h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] flex items-center gap-2">
					<span className="inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />{" "}
					Architecture Layers
				</h2>
				<div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/8 to-white/4 overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-white/5 border-b border-white/10">
							<tr>
								<th className="text-left px-4 py-3 font-medium text-[var(--foreground)]">
									Layer
								</th>
								<th className="text-left px-4 py-3 font-medium text-[var(--foreground)]">
									Technologies
								</th>
								<th className="text-left px-4 py-3 font-medium text-[var(--foreground)]">
									Responsibilities
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-white/10">
							<tr>
								<td className="px-4 py-3 font-medium text-[var(--foreground)]">
									Frontend
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)] font-mono text-xs">
									Next.js 15, React 19, Tailwind CSS 4
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)]">
									Upload UI, timers, local state & recovery, interviewer
									dashboard
								</td>
							</tr>
							<tr>
								<td className="px-4 py-3 font-medium text-[var(--foreground)]">
									State Management
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)] font-mono text-xs">
									Redux Toolkit, redux-persist, localforage
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)]">
									Global state, session persistence, auto-save/recovery
								</td>
							</tr>
							<tr>
								<td className="px-4 py-3 font-medium text-[var(--foreground)]">
									API Routes
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)] font-mono text-xs">
									Next.js API Routes, Zod validation
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)]">
									LLM orchestration, evaluation, summary generation, MongoDB
									persistence
								</td>
							</tr>
							<tr>
								<td className="px-4 py-3 font-medium text-[var(--foreground)]">
									AI Integration
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)] font-mono text-xs">
									@google/generative-ai, LangChain
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)]">
									Resume parsing, question generation, answer evaluation,
									summaries
								</td>
							</tr>
							<tr>
								<td className="px-4 py-3 font-medium text-[var(--foreground)]">
									Local Storage
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)] font-mono text-xs">
									IndexedDB via redux-persist
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)]">
									In-progress interview state (questions, answers, timers,
									profile)
								</td>
							</tr>
							<tr>
								<td className="px-4 py-3 font-medium text-[var(--foreground)]">
									Database
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)] font-mono text-xs">
									MongoDB (official Node driver)
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)]">
									Completed interviews (profile + Q&A + per-question + final
									summary + scores)
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<section className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-6">
				<Card className="bg-white/5 border-white/10">
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
							API Endpoints
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						<div>
							<h4 className="font-semibold text-[var(--foreground)] mb-2">
								Resume Processing
							</h4>
							<div className="space-y-1.5 pl-3 border-l-2 border-white/10">
								<div>
									<code className="text-xs text-blue-400">
										POST /api/resume/parse
									</code>
									<p className="text-xs text-[var(--foreground-muted)] mt-0.5">
										Parse PDF/DOC/DOCX with Gemini + mammoth
									</p>
								</div>
							</div>
						</div>
						<div>
							<h4 className="font-semibold text-[var(--foreground)] mb-2">
								Interview Management
							</h4>
							<div className="space-y-1.5 pl-3 border-l-2 border-white/10">
								<div>
									<code className="text-xs text-blue-400">
										POST /api/interview/generate-all-questions
									</code>
									<p className="text-xs text-[var(--foreground-muted)] mt-0.5">
										Generate 6 tailored questions (2 easy, 2 medium, 2 hard)
									</p>
								</div>
								<div>
									<code className="text-xs text-blue-400">
										POST /api/interview/evaluate-answer
									</code>
									<p className="text-xs text-[var(--foreground-muted)] mt-0.5">
										Score answer 0-5 with AI feedback
									</p>
								</div>
								<div>
									<code className="text-xs text-blue-400">
										POST /api/interview/generate-summary
									</code>
									<p className="text-xs text-[var(--foreground-muted)] mt-0.5">
										Final score (0-100) + performance summary
									</p>
								</div>
								<div>
									<code className="text-xs text-blue-400">
										POST /api/interview/complete-interview
									</code>
									<p className="text-xs text-[var(--foreground-muted)] mt-0.5">
										Persist completed interview to MongoDB
									</p>
								</div>
							</div>
						</div>
						<div>
							<h4 className="font-semibold text-[var(--foreground)] mb-2">
								Dashboard
							</h4>
							<div className="space-y-1.5 pl-3 border-l-2 border-white/10">
								<div>
									<code className="text-xs text-blue-400">
										GET /api/candidates/get-all
									</code>
									<p className="text-xs text-[var(--foreground-muted)] mt-0.5">
										Search & sort candidates
									</p>
								</div>
								<div>
									<code className="text-xs text-blue-400">
										GET /api/candidates/[id]
									</code>
									<p className="text-xs text-[var(--foreground-muted)] mt-0.5">
										Fetch full transcript & scores
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white/5 border-white/10">
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<span className="inline-flex h-2 w-2 rounded-full bg-purple-500" />
							Data Models & Schema
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						<div>
							<h4 className="font-semibold text-[var(--foreground)] mb-2">
								Interview State (Redux)
							</h4>
							<div className="space-y-1.5 pl-3 border-l-2 border-white/10">
								<div className="text-xs text-[var(--foreground-muted)] font-mono">
									<div>status: string</div>
									<div>profile: Profile</div>
									<div>questions: Question[]</div>
									<div>currentQuestionIndex: number</div>
									<div>finalScore?: number</div>
									<div>summary?: string</div>
								</div>
							</div>
						</div>
						<div>
							<h4 className="font-semibold text-[var(--foreground)] mb-2">
								Question Schema
							</h4>
							<div className="space-y-1.5 pl-3 border-l-2 border-white/10">
								<div className="text-xs text-[var(--foreground-muted)] font-mono">
									<div>id: string</div>
									<div>index: number</div>
									<div>
										difficulty:
										&apos;easy&apos;|&apos;medium&apos;|&apos;hard&apos;
									</div>
									<div>question: string</div>
									<div>answer?: string</div>
									<div>score?: number (0-5)</div>
									<div>allottedMs: number</div>
									<div>remainingMs?: number</div>
									<div>startedAt?: number</div>
									<div>submittedAt?: number</div>
								</div>
							</div>
						</div>
						<div>
							<h4 className="font-semibold text-[var(--foreground)] mb-2">
								MongoDB Document
							</h4>
							<div className="space-y-1.5 pl-3 border-l-2 border-white/10">
								<div className="text-xs text-[var(--foreground-muted)] font-mono">
									<div>sessionId: string</div>
									<div>role: string</div>
									<div>profile: Profile</div>
									<div>questions: Question[]</div>
									<div>finalScore: number (0-100)</div>
									<div>summary: string</div>
									<div>createdAt: number</div>
									<div>completedAt: number</div>
									<div>version: 1</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</section>

			<section className="max-w-6xl mx-auto px-6 space-y-5">
				<h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] flex items-center gap-2">
					<span className="inline-flex h-2 w-2 rounded-full bg-orange-500" />{" "}
					Technical Features
				</h2>
				<div className="grid md:grid-cols-3 gap-4">
					<Card className="bg-gradient-to-br from-white/8 to-white/3 border-white/10">
						<CardHeader>
							<CardTitle className="text-base">State Persistence</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-[var(--foreground-muted)] space-y-2">
							<p>
								Redux Toolkit with redux-persist using IndexedDB via localforage
								for reliable client-side persistence.
							</p>
							<p className="text-xs">
								Automatic session recovery on page reload, crash, or browser
								close.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-base">AI Resilience</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-[var(--foreground-muted)] space-y-2">
							<p>
								Fallback mechanisms with mock question banks and heuristic
								scoring when Gemini API is unavailable.
							</p>
							<p className="text-xs">
								Exponential backoff retry strategy for transient API failures.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-base">Type Safety</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-[var(--foreground-muted)] space-y-2">
							<p>
								Full TypeScript coverage with Zod schemas for runtime validation
								of API payloads and MongoDB documents.
							</p>
							<p className="text-xs">
								Strict type checking prevents runtime errors and improves DX.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-base">Timed Evaluation</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-[var(--foreground-muted)] space-y-2">
							<p>
								Per-question timers with Redux-managed countdown. Timer state
								persists across page reloads.
							</p>
							<p className="text-xs">
								Easy: 5min, Medium: 7min, Hard: 10min. Auto-submit on expiry.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-base">Resume Parsing</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-[var(--foreground-muted)] space-y-2">
							<p>
								Multi-format support (PDF, DOC, DOCX) using mammoth for text
								extraction and Gemini for intelligent parsing.
							</p>
							<p className="text-xs">
								Extracts name, email, phone, skills, experience, and education.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-base">Adaptive Questions</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-[var(--foreground-muted)] space-y-2">
							<p>
								Questions tailored to candidate&apos;s role, topic, and resume
								profile using Gemini context awareness.
							</p>
							<p className="text-xs">
								Pre-generated batch of 6 questions ensures smooth timed
								experience.
							</p>
						</CardContent>
					</Card>
				</div>
			</section>

			<section className="max-w-6xl mx-auto px-6 space-y-5">
				<h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] flex items-center gap-2">
					<span className="inline-flex h-2 w-2 rounded-full bg-red-500" />{" "}
					Performance & Scalability
				</h2>
				<div className="grid md:grid-cols-2 gap-4">
					<Card className="bg-gradient-to-br from-white/8 to-white/3 border-white/10">
						<CardHeader>
							<CardTitle className="text-base">Client-Side First</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-[var(--foreground-muted)] space-y-2">
							<ul className="list-disc list-inside space-y-1">
								<li>All interview state managed in IndexedDB</li>
								<li>Minimal server calls (parse, generate, evaluate, save)</li>
								<li>No session cookies or server-side state</li>
								<li>Works offline after questions are generated</li>
							</ul>
						</CardContent>
					</Card>

					<Card className="bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-base">Database Efficiency</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-[var(--foreground-muted)] space-y-2">
							<ul className="list-disc list-inside space-y-1">
								<li>Single document per completed interview</li>
								<li>Indexed on sessionId, createdAt, and finalScore</li>
								<li>Efficient text search on name and email</li>
								<li>Minimal writes (only on interview completion)</li>
							</ul>
						</CardContent>
					</Card>
				</div>
			</section>

			<section className="max-w-6xl mx-auto px-6 space-y-5 pb-6">
				<h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] flex items-center gap-2">
					<span className="inline-flex h-2 w-2 rounded-full bg-yellow-500" />{" "}
					Environment Configuration
				</h2>
				<Card className="bg-gradient-to-br from-white/8 to-white/3 border-white/10">
					<CardContent className="pt-6">
						<div className="space-y-3 text-sm">
							<div className="grid md:grid-cols-2 gap-4">
								<div>
									<h4 className="font-semibold text-[var(--foreground)] mb-2">
										Required Variables
									</h4>
									<div className="space-y-2 pl-3 border-l-2 border-emerald-500/50">
										<div>
											<code className="text-xs text-emerald-400 font-mono">
												GEMINI_API_KEY
											</code>
											<p className="text-xs text-[var(--foreground-muted)] mt-0.5">
												Google Gemini API key for AI features
											</p>
										</div>
										<div>
											<code className="text-xs text-emerald-400 font-mono">
												MONGODB_URI
											</code>
											<p className="text-xs text-[var(--foreground-muted)] mt-0.5">
												MongoDB connection string (Atlas or local)
											</p>
										</div>
										<div>
											<code className="text-xs text-emerald-400 font-mono">
												MONGODB_DB
											</code>
											<p className="text-xs text-[var(--foreground-muted)] mt-0.5">
												Database name (default: crisp)
											</p>
										</div>
									</div>
								</div>
								<div>
									<h4 className="font-semibold text-[var(--foreground)] mb-2">
										Optional Variables
									</h4>
									<div className="space-y-2 pl-3 border-l-2 border-blue-500/50">
										<div>
											<code className="text-xs text-blue-400 font-mono">
												CRISP_GEMINI_MODEL
											</code>
											<p className="text-xs text-[var(--foreground-muted)] mt-0.5">
												Override model (default: gemini-2.5-flash)
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
