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
		<div className="max-w-4xl mx-auto space-y-12">
			{showResumeModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-[rgba(34,40,49,0.85)]">
					<div className="w-full max-w-lg glass-surface p-8 space-y-6 animate-fade-in-up shadow-2xl">
						<div className="text-center space-y-3">
							<div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 flex items-center justify-center">
								<svg className="w-6 h-6 text-[var(--accent-foreground)]" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
							</div>
							<h2 className="text-xl font-semibold accent-gradient-text">
								Session Detected
							</h2>
							<p className="text-[var(--foreground-muted)] leading-relaxed">
								We found an unfinished interview session. Would you like to continue where you left off or start fresh?
							</p>
						</div>
						<div className="flex gap-3">
							<Button
								variant="ghost"
								onClick={() => setShowResumeModal(false)}
								className="flex-1 btn-accent"
							>
								Continue Session
							</Button>
							<Button
								variant="outline"
								onClick={async () => {
									dispatch(resetInterview());
									await resetPersistedStore();
									setShowResumeModal(false);
								}}
								className="flex-1 border-white/20 hover:bg-white/10 text-[var(--foreground)]"
							>
								Start Fresh
							</Button>
						</div>
					</div>
				</div>
			)}
			
			{/* Header Section */}
			<div className="text-center space-y-6">
				<div className="space-y-4">
					<h1 className="text-4xl md:text-5xl font-bold tracking-tight accent-gradient-text">
						AI Interview Assistant
					</h1>
					<p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto leading-relaxed">
						Upload your resume and let our AI conduct a comprehensive technical interview with real-time evaluation
					</p>
				</div>
				<div className="flex flex-wrap items-center justify-center gap-3">
					<span className="badge-accent px-4 py-2 rounded-full text-xs font-medium">✨ AI-Powered</span>
					<span className="bg-white/8 text-[var(--foreground-muted)] border border-white/12 px-4 py-2 rounded-full text-xs font-medium">⏱️ Timed Questions</span>
					<span className="bg-white/8 text-[var(--foreground-muted)] border border-white/12 px-4 py-2 rounded-full text-xs font-medium">📄 Resume Parsing</span>
					<span className="bg-white/8 text-[var(--foreground-muted)] border border-white/12 px-4 py-2 rounded-full text-xs font-medium">🎯 Adaptive Difficulty</span>
				</div>
			</div>

			{/* Step 1: Resume Upload */}
			<Card className="glass-surface overflow-hidden">
				<CardHeader className="bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 flex items-center justify-center text-[var(--accent-foreground)] font-bold text-sm">
							1
						</div>
						<CardTitle className="text-lg font-semibold text-[var(--foreground)]">
							Upload Resume
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="p-8 space-y-6">
					<div className="text-center space-y-4">
						<div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
							<svg className="w-8 h-8 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
							</svg>
						</div>
						<div className="space-y-2">
							<p className="text-[var(--foreground)] font-medium">Drop your resume here or click to browse</p>
							<p className="text-sm text-[var(--foreground-muted)]">Supports PDF and DOCX files up to 10MB</p>
						</div>
					</div>
					
					<Input
						type="file"
						accept="application/pdf,.pdf,.docx"
						disabled={uploading}
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) onFile(f);
						}}
						className="h-14 text-base cursor-pointer file:cursor-pointer file:border-0 file:bg-[var(--accent)] file:text-[var(--accent-foreground)] file:px-6 file:py-2 file:rounded-lg file:font-medium file:mr-4 hover:file:bg-[var(--accent)]/90"
					/>
					
					{uploading && (
						<div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20">
							<div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
							<p className="text-sm text-[var(--accent)] font-medium">Parsing resume...</p>
						</div>
					)}
					
					{parseError && (
						<div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
							<svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
							<p className="text-sm text-red-400">{parseError}</p>
						</div>
					)}
					
					{interview.profile.resumeExtracted && (
						<div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
							<svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
							</svg>
							<p className="text-sm text-emerald-400 font-medium">Resume successfully parsed!</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Step 2: Profile Confirmation */}
			{interview.status === "collecting-profile" && (
				<Card className="glass-surface overflow-hidden">
					<CardHeader className="bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 flex items-center justify-center text-[var(--accent-foreground)] font-bold text-sm">
								2
							</div>
							<CardTitle className="text-lg font-semibold text-[var(--foreground)]">
								Confirm Your Details
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="p-8 space-y-6">
						<p className="text-[var(--foreground-muted)] leading-relaxed">
							Please verify and complete your profile information extracted from your resume.
						</p>
						
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{(["name", "email", "phone"] as const).map((field) => (
								<div key={field} className="space-y-2">
									<label className="text-sm font-medium text-[var(--foreground)] capitalize">
										{field === "phone" ? "Phone Number" : field}
									</label>
									<Input
										value={(interview.profile as any)[field] || ""}
										onChange={(e) =>
											dispatch(
												setProfileField({ key: field, value: e.target.value })
											)
										}
										placeholder={`Enter your ${field}`}
										className="h-12 text-base bg-white/5 border-white/10 focus:border-[var(--accent)]/50 focus:ring-[var(--accent)]/20"
									/>
								</div>
							))}
						</div>
						
						{missingFields.length > 0 && (
							<div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
								<svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
								</svg>
								<p className="text-sm text-amber-400">
									Please complete: {missingFields.join(", ")}
								</p>
							</div>
						)}
						
						<Button
							disabled={missingFields.length > 0}
							onClick={() => dispatch(beginInterview())}
							className="w-full h-12 btn-accent text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{missingFields.length > 0 ? "Complete All Fields" : "Begin Interview →"}
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Step 3: Interview */}
			{interview.status === "in-progress" && (
				<Card className="glass-surface overflow-hidden">
					<CardHeader className="bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 flex items-center justify-center text-[var(--accent-foreground)] font-bold text-sm">
									3
								</div>
								<CardTitle className="text-lg font-semibold text-[var(--foreground)]">
									Technical Interview
								</CardTitle>
							</div>
							{current && (
								<div className="flex items-center gap-3">
									<div className="text-right">
										<p className="text-sm font-medium text-[var(--foreground)]">
											{Math.max(0, Math.ceil((remainingMs || 0) / 1000))}s
										</p>
										<p className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">
											Remaining
										</p>
									</div>
									<div className="w-16 h-16 relative">
										<svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
											<circle
												cx="50"
												cy="50"
												r="45"
												stroke="rgba(255,255,255,0.1)"
												strokeWidth="8"
												fill="none"
											/>
											<circle
												cx="50"
												cy="50"
												r="45"
												stroke="var(--accent)"
												strokeWidth="8"
												fill="none"
												strokeLinecap="round"
												strokeDasharray={`${2 * Math.PI * 45}`}
												strokeDashoffset={`${2 * Math.PI * 45 * (1 - (remainingMs && current.allottedMs ? remainingMs / current.allottedMs : 0))}`}
												className="transition-all duration-1000 ease-linear"
											/>
										</svg>
									</div>
								</div>
							)}
						</div>
					</CardHeader>
					<CardContent className="p-8 space-y-6">
						{current ? (
							<div className="space-y-6">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<span className="badge-accent px-3 py-1 rounded-full text-xs font-medium">
											Question {current.index + 1} of {interview.questions.length}
										</span>
										<span className="bg-white/8 text-[var(--foreground-muted)] border border-white/12 px-3 py-1 rounded-full text-xs font-medium capitalize">
											{current.difficulty}
										</span>
									</div>
								</div>
								
								<div className="p-6 rounded-xl bg-gradient-to-br from-white/8 to-white/3 border border-white/10">
									<p className="text-[var(--foreground)] text-base leading-relaxed whitespace-pre-line">
										{current.question || (
											<div className="flex items-center gap-3">
												<div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
												<span className="text-[var(--foreground-muted)]">Generating your question...</span>
											</div>
										)}
									</p>
								</div>
								
								<div className="space-y-3">
									<label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
										</svg>
										Your Answer
									</label>
									<textarea
										className="w-full h-40 rounded-xl border border-white/10 bg-white/5 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] p-4 text-base focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60 focus:border-[var(--accent)]/50 focus:bg-white/8 transition-all resize-none"
										value={answerDraft}
										onChange={(e) => setAnswerDraft(e.target.value)}
										placeholder="Type your answer here... Be detailed and explain your reasoning."
									/>
								</div>
								
								<div className="flex items-center justify-between pt-4 border-t border-white/10">
									<div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										Auto-submits when timer expires
									</div>
									<Button
										onClick={submitAnswer}
										disabled={!answerDraft.trim()}
										className="btn-accent px-6 h-10 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Submit Answer →
									</Button>
								</div>
							</div>
						) : (
							<div className="text-center py-12">
								<div className="w-12 h-12 mx-auto mb-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
								<p className="text-[var(--foreground-muted)]">Preparing your next question...</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Step 4: Interview Complete */}
			{interview.status === "completed" && (
				<Card className="glass-surface overflow-hidden">
					<CardHeader className="bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
								<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
							</div>
							<div>
								<CardTitle className="text-lg font-semibold text-[var(--foreground)]">
									Interview Complete!
								</CardTitle>
								<p className="text-sm text-[var(--foreground-muted)]">
									Great job completing all questions
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-8 space-y-6">
						<div className="text-center space-y-4">
							<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
								<span className="text-2xl font-bold text-emerald-400">
									{interview.finalScore ?? "—"}
								</span>
								<span className="text-emerald-400 font-medium">/ 100</span>
							</div>
							<p className="text-sm text-[var(--foreground-muted)]">
								Your overall performance score
							</p>
						</div>
						
						<div className="p-6 rounded-xl bg-gradient-to-br from-white/8 to-white/3 border border-white/10">
							<h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								Interview Summary
							</h3>
							<p className="text-[var(--foreground)] text-sm leading-relaxed whitespace-pre-line">
								{interview.summary || (
									<div className="flex items-center gap-3">
										<div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
										<span className="text-[var(--foreground-muted)]">Generating your performance summary...</span>
									</div>
								)}
							</p>
						</div>
						
						<Button
							onClick={async () => {
								dispatch(resetInterview());
								await resetPersistedStore();
							}}
							className="w-full h-12 btn-accent text-base font-medium"
						>
							Start New Interview Session
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Footer */}
			<div className="text-center pt-12">
				<div className="card-divider mb-6"></div>
				<p className="text-xs text-[var(--foreground-muted)] tracking-wide">
					CRISP Interview Assistant · Powered by Gemini AI & LangChain
				</p>
			</div>
		</div>
	);
}