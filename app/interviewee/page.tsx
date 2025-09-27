"use client";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parsePdf, parseDocx } from "@/lib/resume/parse";
import {
	markResumeExtracted,
	setProfileField,
	startProfileCollection,
	beginInterview,
	setQuestionText,
	recordAnswer,
	recordScore,
	advanceQuestion,
	setFinalSummary,
	tickTimer,
	resetInterview,
} from "@/store/interviewSlice";
import { resetPersistedStore } from "@/store";
import { RootState } from "@/store";
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function IntervieweePage() {
	const dispatch = useDispatch();
	const interview = useSelector((s: any) => s.interview);
	const [uploading, setUploading] = useState(false);
	const [parseError, setParseError] = useState<string | null>(null);
	const [remainingMs, setRemainingMs] = useState<number | null>(null);
	const [answerDraft, setAnswerDraft] = useState("");
	const current =
		interview.currentQuestionIndex >= 0
			? interview.questions[interview.currentQuestionIndex]
			: undefined;

	const [showResumeModal, setShowResumeModal] = useState(false);

	// Detect unfinished session on mount
	useEffect(() => {
		if (
			interview.status === "in-progress" ||
			interview.status === "collecting-profile"
		) {
			setShowResumeModal(true);
		}
	}, []);

  // Stable question fetch (avoid depending on the entire questions array so typing isn't reset)
	const fetchQuestion = useCallback(
		async (index: number, difficulty: string) => {
			try {
				const res = await fetch("/api/interview/generate-question", {
					method: "POST",
					body: JSON.stringify({ index, difficulty, role: interview.role }),
				});
				if (res.ok) {
					const data = await res.json();
					dispatch(setQuestionText({ index, text: data.question }));
				}
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(e);
			}
		},
		[dispatch, interview.role]
	);

	// Track last question index to only reset when moving forward, not on timer ticks
	const lastQuestionIndexRef = useRef<number | null>(null);

	// Timer effect and auto-advance with persisted remainingMs
	useEffect(() => {
		if (interview.status !== "in-progress" || !current) return;
		if (!current.startedAt) return;
		const interval = setInterval(() => {
			dispatch(tickTimer());
		}, 1000);
		return () => clearInterval(interval);
	}, [interview.status, current, dispatch]);

	// Watch current question remainingMs to determine auto-advance
	useEffect(() => {
		if (interview.status !== "in-progress" || !current) return;
		const remaining =
			current.remainingMs ??
			current.allottedMs - (Date.now() - (current.startedAt || Date.now()));
		setRemainingMs(remaining);
		if (remaining <= 0) {
			if (!current.answer && answerDraft) {
				dispatch(recordAnswer({ index: current.index, answer: answerDraft }));
			}
			dispatch(advanceQuestion());
		}
	}, [interview.status, current?.remainingMs]);

	// Load question text & reset draft ONLY when question index changes
	useEffect(() => {
		if (interview.status !== "in-progress") return;
		const idx = interview.currentQuestionIndex;
		if (idx < 0) return;
		if (lastQuestionIndexRef.current !== idx) {
			const q = interview.questions[idx];
			if (q && !q.question) {
				fetchQuestion(idx, q.difficulty);
			}
			// Preserve existing recorded answer if navigating back (future feature), else clear.
			setAnswerDraft(q?.answer || "");
			lastQuestionIndexRef.current = idx;
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [interview.status, interview.currentQuestionIndex]);

	// When interview reaches completed state, request summary if missing
	useEffect(() => {
		if (interview.status === "completed" && !interview.summary) {
			(async () => {
				try {
					const res = await fetch("/api/interview/generate-summary", {
						method: "POST",
						body: JSON.stringify({ questions: interview.questions }),
					});
					if (res.ok) {
						const data = await res.json();
						dispatch(
							setFinalSummary({
								summary: data.summary,
								finalScore: data.finalScore,
							})
						);
						// Push to server
						await fetch("/api/interview/complete-interview", {
							method: "POST",
							body: JSON.stringify({
								version: 1,
								sessionId: interview.sessionId,
								role: interview.role,
								profile: interview.profile,
								questions: interview.questions,
								finalScore: data.finalScore,
								summary: data.summary,
								createdAt: interview.createdAt,
								completedAt: interview.completedAt,
							}),
						});
					}
				} catch (e) {
					// eslint-disable-next-line no-console
					console.error(e);
				}
			})();
		}
	}, [
		interview.status,
		interview.summary,
		interview.questions,
		interview.sessionId,
		interview.role,
		interview.profile,
		interview.createdAt,
		interview.completedAt,
		dispatch,
	]);

	const submitAnswer = async () => {
		if (!current) return;
		if (answerDraft) {
			dispatch(recordAnswer({ index: current.index, answer: answerDraft }));
		}
		// Evaluate
		try {
			const res = await fetch("/api/interview/evaluate-answer", {
				method: "POST",
				body: JSON.stringify({
					question: current.question,
					answer: answerDraft,
				}),
			});
			if (res.ok) {
				const data = await res.json();
				dispatch(recordScore({ index: current.index, score: data.score }));
			}
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error(e);
		}
		dispatch(advanceQuestion());
	};

	const onFile = async (file: File) => {
		setUploading(true);
		setParseError(null);
		try {
			let parsed;
			if (file.name.toLowerCase().endsWith(".pdf"))
				parsed = await parsePdf(file);
			else if (file.name.toLowerCase().endsWith(".docx"))
				parsed = await parseDocx(file);
			else throw new Error("Unsupported file type");
			if (parsed.name)
				dispatch(setProfileField({ key: "name", value: parsed.name }));
			if (parsed.email)
				dispatch(setProfileField({ key: "email", value: parsed.email }));
			if (parsed.phone)
				dispatch(setProfileField({ key: "phone", value: parsed.phone }));
			dispatch(markResumeExtracted());
			dispatch(startProfileCollection());
		} catch (e: any) {
			setParseError(e.message || "Failed to parse resume");
		} finally {
			setUploading(false);
		}
	};

	const missingFields = ["name", "email", "phone"].filter(
		(f) => !(interview.profile as any)[f]
	);

	return (
		<div className="space-y-8">
			{showResumeModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
					<div className="w-full max-w-md glass-surface border border-[var(--border-color)] p-6 space-y-4 animate-fade-in-up">
						<h2 className="text-lg font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300">
							Resume Detected
						</h2>
						<p className="text-sm text-neutral-300 leading-relaxed">
							We found an unfinished interview session. Continue where you left off or start a fresh session.
						</p>
						<div className="flex gap-3 justify-end pt-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
								// Resume: simply close modal
								setShowResumeModal(false);
							}}
								className="bg-blue-500/80 hover:bg-blue-500 text-white"
							>
								Resume
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={async () => {
								// Fully reset interview + persistence
								dispatch(resetInterview());
								await resetPersistedStore();
								setShowResumeModal(false);
							}}
								className="border-neutral-500/30 hover:bg-white/10"
							>
								Start Over
							</Button>
						</div>
					</div>
				</div>
			)}
			<div className="space-y-3">
				<h1 className="text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-300">
					Interview Session
				</h1>
				<p className="text-sm text-neutral-400 max-w-prose">
					Upload your resume to parse key profile details. You can resume an
					unfinished session at any time.
				</p>
				<div className="flex flex-wrap gap-2 text-[10px] font-medium">
					<Badge
						variant="secondary"
						className="bg-white/10 text-neutral-200 border-white/10"
					>
						Adaptive
					</Badge>
					<Badge
						variant="secondary"
						className="bg-white/10 text-neutral-200 border-white/10"
					>
						Timed
					</Badge>
					<Badge
						variant="secondary"
						className="bg-white/10 text-neutral-200 border-white/10"
					>
						Gemini AI
					</Badge>
				</div>
			</div>
			<Card className="glass-surface">
				<CardHeader>
					<CardTitle className="text-sm font-medium text-neutral-200">
						1 · Resume Upload
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						type="file"
						accept="application/pdf,.pdf,.docx"
						disabled={uploading}
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) onFile(f);
						}}
					/>
					{parseError && <p className="text-xs text-red-400">{parseError}</p>}
					{interview.profile.resumeExtracted && (
						<p className="text-xs text-emerald-400">Resume parsed.</p>
					)}
				</CardContent>
			</Card>
			{interview.status === "collecting-profile" && (
				<Card className="glass-surface">
					<CardHeader>
						<CardTitle className="text-sm font-medium text-neutral-200">
							2 · Profile Confirmation
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-3">
							{(["name", "email", "phone"] as const).map((field) => (
								<div key={field} className="space-y-1">
									<label className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
										{field}
									</label>
									<Input
										value={(interview.profile as any)[field] || ""}
										onChange={(e) =>
											dispatch(
												setProfileField({ key: field, value: e.target.value })
											)
										}
										placeholder={field}
									/>
								</div>
							))}
						</div>
						{missingFields.length > 0 && (
							<p className="text-xs text-amber-400">
								Missing: {missingFields.join(", ")}
							</p>
						)}
						<Button
							disabled={missingFields.length > 0}
							onClick={() => dispatch(beginInterview())}
							className="bg-blue-600 hover:bg-blue-500 text-white shadow"
						>
							Begin Interview
						</Button>
					</CardContent>
				</Card>
			)}
			{interview.status === "in-progress" && (
				<Card className="glass-surface">
					<CardHeader>
						<CardTitle className="text-sm flex items-center justify-between gap-4 text-neutral-200">
							<span>3 · Interview</span>
							{current && (
								<div className="flex items-center gap-2">
									<div className="h-1.5 w-28 bg-neutral-700/50 rounded overflow-hidden">
										<div
											className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
											style={{
												width: `$${"{"}(remainingMs && current.allottedMs ? ((remainingMs / current.allottedMs) * 100).toFixed(2) : 0)}%`,
											}}
										/>
									</div>
									<span className="text-[10px] font-mono text-neutral-400">
										{remainingMs !== null
											? Math.max(0, Math.ceil(remainingMs / 1000))
											: "-"}
										s
									</span>
								</div>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{current ? (
							<div className="space-y-2">
								<p className="text-sm font-medium text-neutral-300">
									Question {current.index + 1} of {interview.questions.length} (
									{current.difficulty})
								</p>
								<p className="text-sm text-neutral-200 whitespace-pre-line soft-border rounded-md p-3 bg-white/5 min-h-[60px]">
									{current.question || "Generating question..."}
								</p>
								<div className="space-y-1">
									<label className="text-[11px] uppercase tracking-wide text-neutral-400">
										Your Answer
									</label>
									<textarea
										className="w-full rounded-md soft-border bg-white/5 text-neutral-100 placeholder:text-neutral-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white/10 transition"
										value={answerDraft}
										onChange={(e) => setAnswerDraft(e.target.value)}
										rows={5}
									/>
								</div>
								<div className="flex items-center justify-between">
									<p className="text-[10px] text-neutral-500">
										Auto-submits when timer ends.
									</p>
									<Button
										size="sm"
										onClick={submitAnswer}
										disabled={!answerDraft}
										className="bg-blue-600 hover:bg-blue-500 text-white shadow"
									>
										Submit & Next
									</Button>
								</div>
							</div>
						) : (
							<p className="text-xs text-neutral-500">
								Preparing next question...
							</p>
						)}
					</CardContent>
				</Card>
			)}
			{interview.status === "completed" && (
				<Card className="glass-surface">
					<CardHeader>
						<CardTitle className="text-sm text-neutral-200">
							Interview Complete
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-neutral-300">
							Final Score: {interview.finalScore ?? "—"}
						</p>
						<p className="text-sm whitespace-pre-line bg-white/5 soft-border rounded p-3 min-h-[60px] text-neutral-200">
							{interview.summary || "Generating summary..."}
						</p>
						<Button
							size="sm"
							onClick={() => location.reload()}
							className="bg-blue-600 hover:bg-blue-500 text-white"
						>
							Start New Session
						</Button>
					</CardContent>
				</Card>
			)}
			<Separator />
			<p className="text-[11px] text-neutral-500 tracking-wide">
				Prototype – Gemini AI & LangChain enabled.
			</p>
		</div>
	);
}
