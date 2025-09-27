import { notFound } from "next/navigation";

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
		<div className="space-y-8">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					{interview.profile?.name || "Candidate"} – Detail
				</h1>
				<p className="text-sm text-neutral-500">
					Email: {interview.profile?.email || "n/a"} · Phone:{" "}
					{interview.profile?.phone || "n/a"}
				</p>
				<p className="text-xs text-neutral-400">
					Session ID: {interview.sessionId}
				</p>
			</div>
			<section className="space-y-3">
				<h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
					Summary
				</h2>
				<p className="text-sm whitespace-pre-line bg-white border rounded-md p-4 shadow-sm">
					{interview.summary}
				</p>
				<p className="text-xs text-neutral-500">
					Final Score: {interview.finalScore}
				</p>
			</section>
			<section className="space-y-3">
				<h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
					Transcript
				</h2>
				<div className="space-y-4">
					{interview.questions.map((q: any) => (
						<div
							key={q.id}
							className="rounded-lg border bg-white p-4 shadow-sm"
						>
							<div className="flex items-center justify-between mb-2">
								<p className="text-sm font-medium">
									Q{q.index + 1} ({q.difficulty})
								</p>
								<span className="text-[10px] font-mono text-neutral-500">
									Score: {q.score ?? "-"} / 5
								</span>
							</div>
							<p className="text-sm mb-2 whitespace-pre-line">{q.question}</p>
							<div className="space-y-1">
								<p className="text-xs uppercase tracking-wide text-neutral-500">
									Answer
								</p>
								<p className="text-sm whitespace-pre-line bg-neutral-50 border rounded p-3 min-h-[40px]">
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
