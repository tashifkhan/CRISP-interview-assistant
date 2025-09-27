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
				<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.25),transparent_70%)]" />
				<h1 className="text-4xl md:text-6xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-300">
					CRISP · AI Interview Assistant
				</h1>
				<p className="text-neutral-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
					Structured, adaptive technical interviews powered by Gemini +
					LangChain. Timed Q&A, resume parsing, auto-scoring and instant
					summaries— all in a resilient hybrid persistence flow.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium">
					<span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
						Gemini + LangChain
					</span>
					<span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
						Timed Questions
					</span>
					<span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
						Resume Parsing
					</span>
					<span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
						Adaptive Ready
					</span>
					<span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
						Heuristic Fallback
					</span>
				</div>
				<div className="flex flex-wrap gap-4 justify-center pt-4">
					<Link
						href="/interviewee"
						className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow"
					>
						Start Interview
					</Link>
					<Link
						href="/interviewer"
						className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/10"
					>
						View Dashboard
					</Link>
					<a
						href="https://github.com/tashifkhan/CRISP-interview-assistant"
						target="_blank"
						rel="noopener noreferrer"
						className="px-6 py-3 rounded-lg bg-neutral-800/60 hover:bg-neutral-700/70 text-neutral-200 text-sm font-medium border border-neutral-700"
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
