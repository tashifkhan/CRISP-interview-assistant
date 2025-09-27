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
} from "@/store/interviewSlice";
import { RootState } from "@/store";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function IntervieweePage() {
	const dispatch = useDispatch();
	const interview = useSelector((s: RootState) => s.interview);
	const [uploading, setUploading] = useState(false);
	const [parseError, setParseError] = useState<string | null>(null);

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
						<CardTitle className="text-sm">
							3. Interview (Placeholder)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-neutral-500">
							Question flow, timers, chat UI will appear here in next phase.
							Current question index: {interview.currentQuestionIndex}
						</p>
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
