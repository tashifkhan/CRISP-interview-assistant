"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface CandidateSummary {
	id: string;
	name: string;
	email: string;
	finalScore: number;
	summary: string;
}

export default function InterviewerPage() {
	const [search, setSearch] = useState("");
	const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
	const [loading, setLoading] = useState(true);

	const filtered = useMemo(
		() =>
			candidates.filter(
				(c) =>
					c.name.toLowerCase().includes(search.toLowerCase()) ||
					c.email.toLowerCase().includes(search.toLowerCase())
			),
		[candidates, search]
	);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/candidates/get-all");
				if (res.ok) {
					const data = await res.json();
					setCandidates(
						(data.candidates || []).map((c: any) => ({
							id: c.sessionId || c._id,
							name: c.profile?.name || "Unknown",
							email: c.profile?.email || "n/a",
							finalScore: c.finalScore ?? 0,
							summary: c.summary || "",
						}))
					);
				}
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(e);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	function scoreColor(score: number) {
		if (score >= 80) return "bg-green-500/20 text-green-300 border-green-500/30";
		if (score >= 50) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
		return "bg-red-500/15 text-red-300 border-red-500/30";
	}

	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<h1 className="text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-300">
					Interviewer Dashboard
				</h1>
				<p className="text-sm text-neutral-400 max-w-2xl">
					Review completed interview sessions. Search and open any candidate for detailed answers & scoring.
				</p>
			</header>
			<Card className="glass-surface">
				<CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2">
					<CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
						<span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
						Candidates
					</CardTitle>
					<div className="relative w-full md:w-auto md:min-w-[260px]">
						<svg
							className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							viewBox="0 0 24 24"
						>
							<circle cx="11" cy="11" r="7" />
							<path d="m21 21-4.35-4.35" />
						</svg>
						<Input
							placeholder="Search by name or email"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9 bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10"
						/>
					</div>
				</CardHeader>
				<CardContent className="pt-4">
					{loading && (
						<div className="grid gap-2">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="h-14 rounded-md bg-white/5 animate-pulse" />
							))}
						</div>
					)}
					{!loading && filtered.length === 0 && (
						<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-600/40 bg-white/5 px-6 py-12 text-center">
							<p className="text-sm font-medium text-neutral-300 mb-1">No candidates yet</p>
							<p className="text-[11px] text-neutral-500 max-w-sm">
								Completed interview records will appear here once users finish sessions.
							</p>
						</div>
					)}
					{!loading && filtered.length > 0 && (
						<ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
							{filtered.map((c) => (
								<li key={c.id}>
									<Link
										href={`/interviewer/${c.id}`}
										className="group block h-full rounded-lg border border-[var(--border-color)] bg-white/5 hover:bg-white/10 transition-colors p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
									>
										<div className="flex flex-col h-full">
											<div className="flex items-start justify-between gap-4 mb-2">
												<div className="space-y-0.5">
													<p className="text-sm font-medium text-neutral-100 group-hover:text-white transition-colors">
														{c.name}
														<span className="ml-1 text-neutral-400 font-normal">({c.email})</span>
													</p>
												</div>
												<span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide ${scoreColor(c.finalScore)}`}>
													{c.finalScore} / 100
												</span>
											</div>
											<p className="text-[11px] text-neutral-400 line-clamp-3 leading-relaxed flex-1">
												{c.summary || '—'}
											</p>
											<div className="mt-3 text-[10px] text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition">View details →</div>
										</div>
									</Link>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
			<Separator />
			<p className="text-[11px] text-neutral-500 tracking-wide">Prototype – styling iteration.</p>
		</div>
	);
}
