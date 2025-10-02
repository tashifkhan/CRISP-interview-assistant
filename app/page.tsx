"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import WorkflowChart from "@/components/flow/WorkflowChart";

export default function Home() {
	const [svg, setSvg] = useState("");
	function downloadSvg() {
		if (!svg) return;
		const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "crisp-workflow.svg";
		a.click();
		URL.revokeObjectURL(url);
	}
	function openFull() {
		window.open("/workflow", "_blank");
	}
	return (
		<div className="space-y-24 py-14">
			{/* Hero */}
			<section className="relative max-w-6xl mx-auto px-6 text-center space-y-10">
				<div className="absolute inset-0 pointer-events-none">
					<div className="mx-auto h-40 w-40 rounded-full blur-3xl opacity-40 bg-[radial-gradient(circle_at_50%_50%,rgba(0,173,181,0.55),transparent_70%)]" />
				</div>
				<h1 className="text-4xl md:text-6xl font-bold tracking-tight accent-gradient-text relative">
					CRISP · AI Interview Assistant
				</h1>
				<p className="text-[var(--foreground-muted)] max-w-2xl mx-auto text-base md:text-lg leading-relaxed relative">
					Structured, adaptive technical interviews powered by Gemini +
					LangChain. Timed Q&A, resume parsing, auto-scoring & instant summaries
					— resilient by design.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-[10px] md:text-[11px] font-medium relative">
					<span className="px-3 py-1 rounded-full badge-accent">
						Gemini + LangChain
					</span>
					<span className="px-3 py-1 rounded-full bg-white/6 text-[var(--foreground-muted)] border border-white/10">
						Timed
					</span>
					<span className="px-3 py-1 rounded-full bg-white/6 text-[var(--foreground-muted)] border border-white/10">
						Resume Parsing
					</span>
					<span className="px-3 py-1 rounded-full bg-white/6 text-[var(--foreground-muted)] border border-white/10">
						Adaptive Ready
					</span>
					<span className="px-3 py-1 rounded-full bg-white/6 text-[var(--foreground-muted)] border border-white/10">
						Heuristic Fallback
					</span>
				</div>
				<div className="flex flex-wrap gap-4 justify-center pt-2 relative">
					<Link
						href="/interviewee"
						className="px-7 py-3 rounded-xl btn-accent text-sm font-medium shadow hover:shadow-[0_4px_18px_-4px_rgba(0,173,181,0.55)] transition-shadow"
					>
						Start Interview
					</Link>
					<Link
						href="/interviewer"
						className="px-7 py-3 rounded-xl bg-white/7 hover:bg-white/10 text-[var(--foreground)] text-sm font-medium border border-white/12 backdrop-blur-md transition-colors"
					>
						View Dashboard
					</Link>
					<a
						href="https://github.com/tashifkhan/CRISP-interview-assistant"
						target="_blank"
						rel="noopener noreferrer"
						className="px-7 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--foreground-muted)] text-sm font-medium border border-white/10 transition-colors"
					>
						GitHub
					</a>
				</div>
			</section>

			{/* Workflow Preview */}
			<section className="max-w-6xl mx-auto px-6 space-y-10">
				<div className="space-y-3">
					<h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] flex items-center gap-2">
						<span className="inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />{" "}
						Workflow Overview
					</h2>
					<p className="text-sm text-[var(--foreground-muted)] max-w-3xl">
						Below is the end-to-end flow from session recovery & resume parsing
						to AI-driven question generation, evaluation, and interviewer
						analytics.
					</p>
				</div>
				<div className="flex items-center justify-end gap-3 pt-1">
					<button
						onClick={openFull}
						className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-white/8 hover:bg-white/14 border border-white/10 text-[var(--foreground)] transition-colors"
						aria-label="Open full workflow"
					>
						Open Full
					</button>
					<button
						onClick={downloadSvg}
						disabled={!svg}
						className="px-3 py-1.5 rounded-md text-[11px] font-medium btn-accent disabled:opacity-40 disabled:cursor-not-allowed shadow transition"
						aria-label="Download workflow SVG"
					>
						Download SVG
					</button>
				</div>
				<Suspense
					fallback={
						<div className="h-[420px] w-full rounded-xl border border-white/10 bg-white/5 animate-pulse" />
					}
				>
					<WorkflowChart onSvg={setSvg} />
				</Suspense>
			</section>

			{/* Feature Pillars */}
			<section className="max-w-6xl mx-auto px-6 pb-28">
				<div className="grid gap-6 md:grid-cols-3">
					{[
						{
							title: "Hybrid Persistence",
							body: "IndexedDB for in-progress resilience + MongoDB for final records with recovery modal on load.",
						},
						{
							title: "LLM Abstraction",
							body: "Gemini provider + LangChain chains; heuristic fallbacks ensure graceful degradation.",
						},
						{
							title: "Adaptive Ready",
							body: "Graph scaffold prepared for dynamic difficulty & response-driven branching.",
						},
					].map((f) => (
						<div
							key={f.title}
							className="relative p-5 rounded-xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-sm space-y-2 overflow-hidden"
						>
							<span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(0,173,181,0.22),transparent_60%)] opacity-50 mix-blend-screen" />
							<h3 className="text-sm font-semibold text-[var(--foreground)] relative">
								{f.title}
							</h3>
							<p className="text-xs text-[var(--foreground-muted)] leading-relaxed relative">
								{f.body}
							</p>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
