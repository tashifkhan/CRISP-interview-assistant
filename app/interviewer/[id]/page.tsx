import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { headers } from "next/headers";

async function resolveBaseUrl() {
	const explicit =
		process.env.NEXT_PUBLIC_BASE_URL ||
		process.env.NEXT_PUBLIC_SITE_URL ||
		process.env.SITE_URL;
	if (explicit) {
		return explicit.startsWith("http")
			? explicit.replace(/\/$/, "")
			: `https://${explicit.replace(/\/$/, "")}`;
	}
	const vercelUrl = process.env.VERCEL_URL;
	if (vercelUrl) {
		return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
	}
	try {
		const h = await headers();
		const host = h.get("host");
		if (host) {
			const protocol =
				host.startsWith("localhost") || host.startsWith("127.0.0.1")
					? "http"
					: "https";
			return `${protocol}://${host}`;
		}
	} catch {
		// ignore
	}
	return "http://localhost:3000";
}

async function fetchInterview(id: string) {
	const base = await resolveBaseUrl();
	const url = `${base}/api/candidates/${id}`;
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) return null;
	const data = await res.json();
	return data.interview;
}

export default async function CandidateDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const interview = await fetchInterview(id);
	if (!interview) return notFound();
	return (
		<div className="space-y-12 max-w-5xl mx-auto">
			{/* Header */}
			<div className="space-y-5">
				<h1 className="text-4xl font-bold tracking-tight accent-gradient-text">
					{interview.profile?.name || "Candidate"}
				</h1>
				<div className="flex flex-wrap gap-4 text-xs text-[var(--foreground-muted)]">
					<span className="flex items-center gap-1">
						<svg
							className="w-3.5 h-3.5"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							viewBox="0 0 24 24"
						>
							<path d="M5 8l7 4 7-4" />
							<path d="M5 12l7 4 7-4" />
							<path d="M5 16l7 4 7-4" />
						</svg>
						Email: {interview.profile?.email || "n/a"}
					</span>
					<span className="flex items-center gap-1">
						<svg
							className="w-3.5 h-3.5"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							viewBox="0 0 24 24"
						>
							<path d="M3 5a2 2 0 012-2h1.28a1 1 0 01.95.684l1.518 4.554a1 1 0 01-.502 1.21l-1.257.628a11.042 11.042 0 006.105 6.105l.628-1.257a1 1 0 011.21-.502l4.554 1.518a1 1 0 01.684.95V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
						</svg>
						Phone: {interview.profile?.phone || "n/a"}
					</span>
					<span className="opacity-70 font-mono">
						Session: {interview.sessionId}
					</span>
				</div>
				<div className="flex gap-2 flex-wrap text-[10px]">
					<Badge
						variant="secondary"
						className="bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)] font-medium"
					>
						Final Score {interview.finalScore}
					</Badge>
					<Badge
						variant="secondary"
						className="bg-white/10 border-white/10 text-[var(--foreground-muted)]"
					>
						Questions {interview.questions.length}
					</Badge>
				</div>
			</div>

			{/* Summary */}
			<section className="space-y-4">
				<h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--foreground-muted)]">
					Summary
				</h2>
				<div className="p-6 rounded-xl bg-gradient-to-br from-white/8 to-white/3 border border-white/10 text-sm leading-relaxed text-[var(--foreground)]">
					{interview.summary}
				</div>
			</section>

			{/* Transcript */}
			<section className="space-y-4">
				<h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--foreground-muted)]">
					Transcript
				</h2>
				<div className="space-y-6">
					{interview.questions.map((q: Record<string, unknown>) => (
						<div
							key={q.id as string}
							className="p-6 rounded-xl bg-gradient-to-br from-white/8 to-white/3 border border-white/10 space-y-4"
						>
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium text-[var(--foreground)]">
									Q{(q.index as number) + 1}{" "}
									<span className="text-[var(--foreground-muted)]">
										({q.difficulty as string})
									</span>
								</p>
								<span className="text-[11px] font-mono text-[var(--accent)]/80">
									{(q.score as number) ?? "-"}/5
								</span>
							</div>
							<p className="text-sm whitespace-pre-line text-[var(--foreground)]/90">
								{q.question as string}
							</p>
							<div className="space-y-1">
								<p className="text-[10px] uppercase tracking-wide text-[var(--foreground-muted)]">
									Answer
								</p>
								<p className="text-sm whitespace-pre-line bg-white/5 border border-white/10 rounded-lg p-3 min-h-[40px] text-[var(--foreground)]">
									{(q.answer as string) || "(no answer)"}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
