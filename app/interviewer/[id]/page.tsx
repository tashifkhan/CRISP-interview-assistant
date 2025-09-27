import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

async function fetchInterview(id: string) {
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/candidates/${id}`,
		{ cache: "no-store" }
	);
	if (!res.ok) return null;
	const data = await res.json();
	return data.interview;
}

export default async function CandidateDetailPage({
	params,
}: {
	params: { id: string };
}) {
	const interview = await fetchInterview(params.id);
	if (!interview) return notFound();
	return (
		<div className="space-y-10">
			<div className="space-y-4">
				<h1 className="text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-300">
					{interview.profile?.name || "Candidate"}
				</h1>
				<div className="flex flex-wrap gap-3 text-xs text-neutral-400">
					<span>Email: {interview.profile?.email || "n/a"}</span>
					<span>Phone: {interview.profile?.phone || "n/a"}</span>
					<span className="opacity-70">Session: {interview.sessionId}</span>
				</div>
				<div className="flex gap-2 flex-wrap text-[10px]">
					<Badge variant="secondary" className="bg-white/10 border-white/10 text-neutral-200">Final Score {interview.finalScore}</Badge>
					<Badge variant="secondary" className="bg-white/10 border-white/10 text-neutral-200">Questions {interview.questions.length}</Badge>
				</div>
			</div>
			<section className="space-y-4">
				<h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">Summary</h2>
				<div className="glass-surface p-5 text-sm leading-relaxed text-neutral-200">
					{interview.summary}
				</div>
			</section>
			<section className="space-y-4">
				<h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">Transcript</h2>
				<div className="space-y-5">
					{interview.questions.map((q: any) => (
						<div key={q.id} className="glass-surface p-5 space-y-3">
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium text-neutral-100">Q{q.index + 1} <span className="text-neutral-400">({q.difficulty})</span></p>
								<span className="text-[11px] font-mono text-neutral-400">{q.score ?? "-"}/5</span>
							</div>
							<p className="text-sm whitespace-pre-line text-neutral-200">{q.question}</p>
							<div className="space-y-1">
								<p className="text-[10px] uppercase tracking-wide text-neutral-400">Answer</p>
								<p className="text-sm whitespace-pre-line bg-white/5 soft-border rounded p-3 min-h-[40px] text-neutral-100">
									{q.answer || "(no answer)"}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
