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
} from "@/store/interviewSlice";
import { RootState } from "@/store";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
		if (interview.status === 'in-progress' || interview.status === 'collecting-profile') {
			setShowResumeModal(true);
		}
	}, []);

	const fetchQuestion = useCallback(
		async (index: number) => {
			const q = interview.questions[index];
			if (!q || q.question) return;
			try {
				const res = await fetch("/api/interview/generate-question", {
					method: "POST",
					body: JSON.stringify({
						index,
						difficulty: q.difficulty,
						role: interview.role,
					}),
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
		[dispatch, interview.questions, interview.role]
	);

	// Timer effect and auto-advance with persisted remainingMs
	useEffect(() => {
		if (interview.status !== 'in-progress' || !current) return;
		if (!current.startedAt) return;
		const interval = setInterval(() => {
			dispatch(tickTimer());
		}, 1000);
		return () => clearInterval(interval);
	}, [interview.status, current, dispatch]);

	// Watch current question remainingMs to determine auto-advance
	useEffect(() => {
		if (interview.status !== 'in-progress' || !current) return;
		const remaining = current.remainingMs ?? (current.allottedMs - (Date.now() - (current.startedAt || Date.now())));
		setRemainingMs(remaining);
		if (remaining <= 0) {
			if (!current.answer && answerDraft) {
				dispatch(recordAnswer({ index: current.index, answer: answerDraft }));
			}
			dispatch(advanceQuestion());
		}
	}, [interview.status, current?.remainingMs]);

	// Load question text when entering a question
	useEffect(() => {
		if (
			interview.status === "in-progress" &&
			interview.currentQuestionIndex >= 0
		) {
			fetchQuestion(interview.currentQuestionIndex);
			setAnswerDraft("");
		}
	}, [interview.status, interview.currentQuestionIndex, fetchQuestion]);

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
		<div className="space-y-6">
			{showResumeModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-md rounded-lg bg-white shadow-lg border p-6 space-y-4">
						<h2 className="text-lg font-semibold tracking-tight">Welcome Back</h2>
						<p className="text-sm text-neutral-600">
							An unfinished interview session was found. Would you like to resume where you left off?
						</p>
						<div className="flex gap-3 justify-end">
							<Button variant="ghost" size="sm" onClick={() => { setShowResumeModal(false); }}>
								Resume
							</Button>
							<Button variant="outline" size="sm" onClick={() => { localStorage.clear(); location.reload(); }}>
								Start Over
							</Button>
						</div>
					</div>
				</div>
			)}
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Interviewee Workspace
				</h1>
				<p className="text-sm text-neutral-600 max-w-prose mt-1">
					Upload a resume to begin. Missing profile fields will be collected
					before the interview starts.
				</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">1. Resume Upload</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<Input
						type="file"
						accept="application/pdf,.pdf,.docx"
						disabled={uploading}
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) onFile(f);
						}}
					/>
					{parseError && <p className="text-xs text-red-600">{parseError}</p>}
					{interview.profile.resumeExtracted && (
						<p className="text-xs text-green-600">Resume parsed.</p>
					)}
				</CardContent>
			</Card>
			{interview.status === "collecting-profile" && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">2. Profile Confirmation</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-3 sm:grid-cols-3">
							{(["name", "email", "phone"] as const).map((field) => (
								<div key={field} className="space-y-1">
									<label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
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
							<p className="text-xs text-amber-600">
								Missing: {missingFields.join(", ")}
							</p>
						)}
						<Button
							disabled={missingFields.length > 0}
							onClick={() => dispatch(beginInterview())}
						>
							Begin Interview
						</Button>
					</CardContent>
				</Card>
			)}
			{interview.status === "in-progress" && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm flex items-center justify-between gap-4">
							<span>3. Interview</span>
							{current && (
								<span className="text-[10px] font-mono text-neutral-500">
									Time:{" "}
									{remainingMs !== null
										? Math.max(0, Math.ceil(remainingMs / 1000))
										: "-"}
									s
								</span>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{current ? (
							<div className="space-y-2">
								<p className="text-sm font-medium">
									Question {current.index + 1} of {interview.questions.length} (
									{current.difficulty})
								</p>
								<p className="text-sm text-neutral-700 whitespace-pre-line border rounded-md p-3 bg-neutral-50 min-h-[60px]">
									{current.question || "Generating question..."}
								</p>
								<div className="space-y-1">
									<label className="text-xs uppercase tracking-wide text-neutral-500">
										Your Answer
									</label>
									<textarea
										className="w-full rounded-md border border-neutral-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Interview Complete</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm">Final Score: {interview.finalScore ?? '—'}</p>
						<p className="text-sm whitespace-pre-line bg-neutral-50 border rounded p-3 min-h-[60px]">
							{interview.summary || 'Generating summary...'}
						</p>
						<Button size="sm" onClick={() => location.reload()}>Start New Session</Button>
					</CardContent>
				</Card>
			)}
			<Separator />
			<p className="text-[11px] text-neutral-400">
				Prototype – Phase 2 will introduce AI question generation.
			</p>
		</div>
	);
}
