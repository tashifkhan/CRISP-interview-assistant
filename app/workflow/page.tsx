"use client";
import { Suspense, useState } from "react";
import WorkflowChart from "@/components/flow/WorkflowChart";

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
		<div className="space-y-8 py-12">
			<section className="max-w-6xl mx-auto px-6 space-y-6">
				<div className="space-y-2">
					<h1 className="text-3xl md:text-4xl font-semibold tracking-tight accent-gradient-text">
						Workflow Overview
					</h1>
					<p className="text-[var(--foreground-muted)] max-w-3xl text-base leading-relaxed">
						End-to-end flow from resume parsing to AI-driven question
						generation, evaluation, and interviewer analytics. The diagram below
						shows the architecture and data flow of the CRISP interview system.
					</p>
				</div>
				<div className="flex items-center justify-end gap-3 pt-1">
					<button
						onClick={() => download("svg")}
						disabled={!svg}
						className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-blue-600 enabled:hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow"
						aria-label="Download workflow SVG"
					>
						Download SVG
					</button>
					<button
						onClick={() => download("png")}
						disabled={!svg}
						className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-emerald-600 enabled:hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow"
						aria-label="Download workflow PNG"
					>
						Download PNG
					</button>
				</div>
			</section>

			<section className="max-w-6xl mx-auto px-6">
				<Suspense
					fallback={
						<div className="h-[600px] w-full rounded-xl border border-[var(--border-color)] bg-white/5 animate-pulse" />
					}
				>
					<WorkflowChart onSvg={setSvg} maxHeight="max-h-[800px]" />
				</Suspense>
			</section>

			<section className="max-w-6xl mx-auto px-6 space-y-4">
				<h2 className="text-xl font-semibold tracking-tight text-neutral-100 flex items-center gap-2">
					<span className="inline-flex h-2 w-2 rounded-full bg-blue-500" />{" "}
					Architecture Overview
				</h2>
				<div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-white/5 border-b border-white/10">
							<tr>
								<th className="text-left px-4 py-3 font-medium text-[var(--foreground)]">
									Layer
								</th>
								<th className="text-left px-4 py-3 font-medium text-[var(--foreground)]">
									Responsibilities
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-white/10">
							<tr>
								<td className="px-4 py-3 font-medium text-[var(--foreground)]">
									Frontend (Next.js)
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)]">
									Upload UI, timers, local state & recovery, interviewer
									dashboard
								</td>
							</tr>
							<tr>
								<td className="px-4 py-3 font-medium text-[var(--foreground)]">
									API Routes
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)]">
									LLM orchestration, evaluation, summary generation, MongoDB
									persistence
								</td>
							</tr>
							<tr>
								<td className="px-4 py-3 font-medium text-[var(--foreground)]">
									Local (IndexedDB)
								</td>
								<td className="px-4 py-3 text-[var(--foreground-muted)]">
									In-progress interview state (questions, answers, timers,
									profile)
								</td>
							</tr>
							<tr>
								<td className="px-4 py-3 font-medium text-[var(--foreground)]">
									MongoDB
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
		</div>
	);
}
