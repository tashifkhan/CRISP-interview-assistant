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
		<div className="space-y-20 py-12">
			<section className="relative max-w-6xl mx-auto px-6 text-center space-y-8">
				<h1 className="text-4xl md:text-6xl font-semibold tracking-tight accent-gradient-text">
					CRISP · AI Interview Assistant
				</h1>
				<p className="text-[var(--foreground-muted)] max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
					Structured, adaptive technical interviews powered by Gemini +
					LangChain. Timed Q&A, resume parsing, auto-scoring and instant
					summaries— resilient by design.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-[10px] md:text-[11px] font-medium">
					<span className="px-3 py-1 rounded-full badge-accent">
						Gemini + LangChain
					</span>
					<span className="px-3 py-1 rounded-full bg-white/5 text-[var(--foreground-muted)] border border-white/10">
						Timed
					</span>
					<span className="px-3 py-1 rounded-full bg-white/5 text-[var(--foreground-muted)] border border-white/10">
						Resume Parsing
					</span>
					<span className="px-3 py-1 rounded-full bg-white/5 text-[var(--foreground-muted)] border border-white/10">
						Adaptive Ready
					</span>
					<span className="px-3 py-1 rounded-full bg-white/5 text-[var(--foreground-muted)] border border-white/10">
						Heuristic Fallback
					</span>
				</div>
				<div className="flex flex-wrap gap-4 justify-center pt-4">
					<Link
						href="/interviewee"
						className="px-6 py-3 rounded-lg btn-accent text-sm font-medium shadow hover:shadow-lg transition-shadow"
					>
						Start Interview
					</Link>
					<Link
						href="/interviewer"
						className="px-6 py-3 rounded-lg bg-white/7 hover:bg-white/10 text-[var(--foreground)] text-sm font-medium border border-white/12 backdrop-blur-md"
					>
						View Dashboard
					</Link>
					<a
						href="https://github.com/tashifkhan/CRISP-interview-assistant"
						target="_blank"
						rel="noopener noreferrer"
						className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--foreground-muted)] text-sm font-medium border border-white/10"
					>
						GitHub
					</a>
				</div>
			</section>

			<section className="max-w-6xl mx-auto px-6 space-y-8">
				<div className="space-y-2">
					<h2 className="text-xl font-semibold tracking-tight text-neutral-100 flex items-center gap-2">
						<span className="inline-flex h-2 w-2 rounded-full bg-blue-500" />{" "}
						Workflow Overview
					</h2>
					<p className="text-sm text-neutral-400 max-w-3xl">
						Below is the end-to-end flow from session recovery and resume
						parsing to AI-driven question generation, evaluation, and
						interviewer analytics.
					</p>
				</div>
				<div className="flex items-center justify-end gap-3 pt-1">
					<button
						onClick={openFull}
						className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-white/10 hover:bg-white/20 border border-white/10 text-white"
						aria-label="Open full workflow"
					>
						Open Full
					</button>
					<button
						onClick={downloadSvg}
						disabled={!svg}
						className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-blue-600 enabled:hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow"
						aria-label="Download workflow SVG"
					>
						Download SVG
					</button>
				</div>
				<Suspense
					fallback={
						<div className="h-[420px] w-full rounded-xl border border-[var(--border-color)] bg-white/5 animate-pulse" />
					}
				>
					<WorkflowChart onSvg={setSvg} />
				</Suspense>
			</section>

			<section className="max-w-6xl mx-auto px-6 pb-24">
				<div className="grid gap-6 md:grid-cols-3">
					<div className="p-5 rounded-xl border border-[var(--border-color)] bg-white/5 backdrop-blur-sm space-y-2">
						<h3 className="text-sm font-semibold text-neutral-100">
							Hybrid Persistence
						</h3>
						<p className="text-xs text-neutral-400 leading-relaxed">
							IndexedDB for in-progress resilience + MongoDB for final records
							with recovery modal on load.
						</p>
					</div>
					<div className="p-5 rounded-xl border border-[var(--border-color)] bg-white/5 backdrop-blur-sm space-y-2">
						<h3 className="text-sm font-semibold text-neutral-100">
							LLM Abstraction
						</h3>
						<p className="text-xs text-neutral-400 leading-relaxed">
							Gemini provider + LangChain chains; heuristic fallbacks ensure
							graceful degradation.
						</p>
					</div>
					<div className="p-5 rounded-xl border border-[var(--border-color)] bg-white/5 backdrop-blur-sm space-y-2">
						<h3 className="text-sm font-semibold text-neutral-100">
							Adaptive Ready
						</h3>
						<p className="text-xs text-neutral-400 leading-relaxed">
							Graph scaffold prepared for dynamic difficulty & response-driven
							branching.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
