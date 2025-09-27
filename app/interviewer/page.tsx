"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
	const filtered = candidates.filter(
		(c) =>
			c.name.toLowerCase().includes(search.toLowerCase()) ||
			c.email.toLowerCase().includes(search.toLowerCase())
	);

	useEffect(() => {
		// Placeholder: will fetch from /api/candidates later
		setCandidates([]);
	}, []);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Interviewer Dashboard
				</h1>
				<p className="text-sm text-neutral-600 max-w-prose mt-1">
					Completed interview results appear here. Search & sort plus detail
					view will be added.
				</p>
			</div>
			<Card>
				<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<CardTitle className="text-sm">Candidates</CardTitle>
					<Input
						placeholder="Search by name or email"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="sm:max-w-xs"
					/>
				</CardHeader>
				<CardContent className="space-y-4">
					{filtered.length === 0 && (
						<p className="text-xs text-neutral-500">No candidates yet.</p>
					)}
					<div className="space-y-2">
						{filtered.map((c) => (
							<div
								key={c.id}
								className="rounded-md border p-3 bg-white hover:bg-neutral-50 transition-colors cursor-pointer"
							>
								<div className="flex items-center justify-between gap-4">
									<div className="space-y-0.5">
										<p className="text-sm font-medium">
											{c.name}{" "}
											<span className="text-neutral-400 font-normal">
												({c.email})
											</span>
										</p>
										<p className="text-xs line-clamp-2 text-neutral-500">
											{c.summary}
										</p>
									</div>
									<Badge variant="secondary">Score {c.finalScore}</Badge>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
			<Separator />
			<p className="text-[11px] text-neutral-400">
				Placeholder – API integration coming in persistence phase.
			</p>
		</div>
	);
}
