"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";

interface CandidateSummary {
	id: string;
	name: string;
	email: string;
	finalScore: number;
	summary: string;
	completedAt?: string;
	questionsCount?: number;
}

export default function InterviewerPage() {
	const [search, setSearch] = useState("");
	const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [sortBy, setSortBy] = useState<"score" | "date" | "name">("date");

	const filtered = useMemo(() => {
		const result = candidates.filter(
			(c) =>
				c.name.toLowerCase().includes(search.toLowerCase()) ||
				c.email.toLowerCase().includes(search.toLowerCase())
		);

		// Sort candidates
		result.sort((a, b) => {
			switch (sortBy) {
				case "score":
					return b.finalScore - a.finalScore;
				case "name":
					return a.name.localeCompare(b.name);
				case "date":
				default:
					return (
						new Date(b.completedAt || 0).getTime() -
						new Date(a.completedAt || 0).getTime()
					);
			}
		});

		return result;
	}, [candidates, search, sortBy]);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/candidates/get-all");
				if (res.ok) {
					const data = await res.json();
					setCandidates(
						(data.candidates || []).map((c: Record<string, unknown>) => ({
							id: (c.sessionId || c._id) as string,
							name: ((c.profile as Record<string, unknown>)?.name ||
								"Unknown") as string,
							email: ((c.profile as Record<string, unknown>)?.email ||
								"n/a") as string,
							finalScore: (c.finalScore ?? 0) as number,
							summary: (c.summary || "") as string,
							completedAt: (c.completedAt || c.createdAt) as number,
							questionsCount: Array.isArray(c.questions)
								? c.questions.length
								: 6,
						}))
					);
				}
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	function scoreColor(score: number) {
		if (score >= 80)
			return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
		if (score >= 60) return "bg-blue-500/15 text-blue-400 border-blue-500/25";
		if (score >= 40)
			return "bg-amber-500/15 text-amber-400 border-amber-500/25";
		return "bg-red-500/15 text-red-400 border-red-500/25";
	}

	function scoreIcon(score: number) {
		if (score >= 80) return "🏆";
		if (score >= 60) return "⭐";
		if (score >= 40) return "📊";
		return "📝";
	}

	const stats = useMemo(() => {
		const total = candidates.length;
		const avgScore =
			total > 0
				? Math.round(
						candidates.reduce((acc, c) => acc + c.finalScore, 0) / total
				  )
				: 0;
		const highPerformers = candidates.filter((c) => c.finalScore >= 70).length;
		return { total, avgScore, highPerformers };
	}, [candidates]);

	return (
		<div className="max-w-7xl mx-auto space-y-12">
			{/* Header Section */}
			<div className="text-center space-y-6">
				<div className="space-y-4">
					<h1 className="text-4xl md:text-5xl font-bold tracking-tight accent-gradient-text">
						Interviewer Dashboard
					</h1>
					<p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto leading-relaxed">
						Review completed interview sessions, analyze candidate performance,
						and make informed hiring decisions
					</p>
				</div>

				{/* Quick Stats */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
					<div className="p-5 rounded-xl bg-gradient-to-br from-white/8 to-white/3 border border-white/10 relative overflow-hidden">
						<span className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_25%,rgba(0,173,181,0.35),transparent_65%)] opacity-40 mix-blend-screen" />
						<div className="text-3xl font-semibold text-[var(--foreground)] tracking-tight">
							{stats.total}
						</div>
						<div className="text-xs uppercase tracking-[0.15em] text-[var(--foreground-muted)] mt-1">
							Total Interviews
						</div>
					</div>
					<div className="p-5 rounded-xl border border-[var(--accent)]/25 bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent)]/5 relative overflow-hidden">
						<span className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_70%_70%,rgba(0,173,181,0.4),transparent_70%)] opacity-30 mix-blend-screen" />
						<div className="text-3xl font-semibold text-[var(--accent)] tracking-tight">
							{stats.avgScore}
						</div>
						<div className="text-xs uppercase tracking-[0.15em] text-[var(--foreground-muted)] mt-1">
							Average Score
						</div>
					</div>
					<div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 border border-emerald-500/25 relative overflow-hidden">
						<span className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.4),transparent_65%)] opacity-30 mix-blend-screen" />
						<div className="text-3xl font-semibold text-emerald-400 tracking-tight">
							{stats.highPerformers}
						</div>
						<div className="text-xs uppercase tracking-[0.15em] text-[var(--foreground-muted)] mt-1">
							High Performers
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Card */}
			<Card className="glass-surface overflow-hidden">
				<CardHeader className="bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-xl ring-1 ring-white/15 bg-gradient-to-br from-[var(--accent)]/70 to-[var(--accent)]/40 flex items-center justify-center text-[var(--accent-foreground)] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
								<svg
									className="w-4 h-4 text-white"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
									viewBox="0 0 24 24"
								>
									<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<CardTitle className="text-lg font-semibold text-[var(--foreground)] tracking-tight">
								Interview Results
							</CardTitle>
							{!loading && (
								<span className="px-3 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 text-xs font-medium">
									{filtered.length}{" "}
									{filtered.length === 1 ? "candidate" : "candidates"}
								</span>
							)}
						</div>

						<div className="flex flex-col sm:flex-row gap-3">
							{/* Sort Dropdown (Radix Select) */}
							<div className="min-w-[160px]">
								<Select
									value={sortBy}
									onValueChange={(v) =>
										setSortBy(v as "date" | "score" | "name")
									}
								>
									<SelectTrigger className="bg-white/5 border-white/10 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/40">
										<SelectValue placeholder="Sort" />
									</SelectTrigger>
									<SelectContent position="popper">
										<SelectItem value="date">Latest First</SelectItem>
										<SelectItem value="score">Highest Score</SelectItem>
										<SelectItem value="name">Name A-Z</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Search Input */}
							<div className="relative min-w-[280px]">
								<svg
									className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
									viewBox="0 0 24 24"
								>
									<circle cx="11" cy="11" r="7" />
									<path d="m21 21-4.35-4.35" />
								</svg>
								<Input
									placeholder="Search candidates..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-10 h-10 bg-white/5 border-white/10 focus:border-[var(--accent)]/60 focus:ring-[var(--accent)]/30 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
								/>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-8">
					{loading && (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className="h-32 rounded-xl bg-white/5 animate-pulse border border-white/10"
								/>
							))}
						</div>
					)}

					{!loading && filtered.length === 0 && (
						<div className="text-center py-16">
							<div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
								<svg
									className="w-8 h-8 text-[var(--foreground-muted)]"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1.5}
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
							</div>
							<h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
								{search ? "No matches found" : "No interviews yet"}
							</h3>
							<p className="text-[var(--foreground-muted)] max-w-sm mx-auto">
								{search
									? "Try adjusting your search terms or filters"
									: "Completed interview records will appear here once candidates finish their sessions"}
							</p>
							{search && (
								<button
									onClick={() => setSearch("")}
									className="mt-4 px-4 py-2 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/20 transition-colors"
								>
									Clear Search
								</button>
							)}
						</div>
					)}

					{!loading && filtered.length > 0 && (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{filtered.map((candidate) => (
								<Link
									key={candidate.id}
									href={`/interviewer/${candidate.id}`}
									className="group block"
								>
									<div className="h-full p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 hover:from-white/12 hover:to-white/6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
										<div className="flex flex-col h-full">
											{/* Header */}
											<div className="flex items-start justify-between gap-4 mb-4">
												<div className="flex-1 min-w-0">
													<h3 className="text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors truncate">
														{candidate.name}
													</h3>
													<p className="text-sm text-[var(--foreground-muted)] truncate">
														{candidate.email}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-lg">
														{scoreIcon(candidate.finalScore)}
													</span>
													<span
														className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreColor(
															candidate.finalScore
														)}`}
													>
														{candidate.finalScore}
													</span>
												</div>
											</div>

											{/* Score Visualization */}
											<div className="mb-4">
												<div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] mb-2">
													<span>Performance Score</span>
													<span>{candidate.finalScore}/100</span>
												</div>
												<div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
													<div
														className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/60 rounded-full transition-all duration-500"
														style={{ width: `${candidate.finalScore}%` }}
													/>
												</div>
											</div>

											{/* Summary */}
											<div className="flex-1 mb-4">
												<p className="text-xs text-[var(--foreground-muted)] leading-relaxed line-clamp-3">
													{candidate.summary || "No summary available"}
												</p>
											</div>

											{/* Footer */}
											<div className="flex items-center justify-between pt-3 border-t border-white/10">
												<div className="flex items-center gap-4 text-xs text-[var(--foreground-muted)]">
													<span className="flex items-center gap-1">
														<svg
															className="w-3 h-3"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
														{candidate.questionsCount || 6} questions
													</span>
													{candidate.completedAt && (
														<span className="flex items-center gap-1">
															<svg
																className="w-3 h-3"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
																/>
															</svg>
															{new Date(
																candidate.completedAt
															).toLocaleDateString()}
														</span>
													)}
												</div>
												<div className="text-xs text-[var(--accent)] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
													View Details
													<svg
														className="w-3 h-3"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M9 5l7 7-7 7"
														/>
													</svg>
												</div>
											</div>
										</div>
									</div>
								</Link>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Footer */}
			<div className="text-center pt-8">
				<div className="card-divider mb-6"></div>
				<p className="text-xs text-[var(--foreground-muted)] tracking-wide">
					CRISP Interview Assistant · Analytics Dashboard
				</p>
			</div>
		</div>
	);
}
