"use client";
import { useEffect, useState } from "react";
import mermaid from "mermaid";

const diagram = `flowchart TD
  A([Start - Application Loaded]):::frontend
  A --> B[Application Initialization]:::frontend
  B --> C{Unfinished Interview Found?}:::frontend
  C -->|Yes| D[Display Welcome Back Modal]:::frontend
  D --> E{Resume or Start New?}:::frontend
  E -->|Resume| F[Restore Interview State & Navigate]:::frontend
  F --> G[Display Question & Start Timer]:::frontend
  E -->|Start New| H[Clear Local State]:::frontend
  H --> I[Candidate Profile Collection]:::frontend
  C -->|No| I
  I --> J[Upload Resume]:::frontend
  J --> K[Parse Resume & Extract Details]:::frontend
  K --> L{All Required Fields Present?}:::frontend
  L -->|No| M[Chatbot Prompts for Missing Data]:::frontend
  M --> L
  L -->|Yes| N[Store Candidate Profile Locally]:::frontend
  N --> O[Interview Starting...]:::frontend
  O --> P[Request Next Question]:::frontend
  P --> Q[Generate Question using LLM]:::backend
  Q --> R[Display Question & Start Timer]:::frontend
  R --> S[Candidate Enters Answer]:::frontend
  S --> T{Timer Expires or Submit?}:::frontend
  T -->|Yes| U[Send Answer for Evaluation]:::frontend
  U --> V[Evaluate Answer with LLM]:::backend
  V --> W[Store Q/A/Score Locally]:::frontend
  W --> X{All 6 Questions Completed?}:::frontend
  X -->|No| P
  X -->|Yes| Y[Request Final Summary & Score]:::frontend
  Y --> Z[Generate Final Summary & Score]:::backend
  Z --> AA[Store Final Score Locally]:::frontend
  AA --> AB[Push Completed Interview to DB]:::frontend
  AB --> AC[Save Record in MongoDB]:::database
  AC --> AD[Interview Complete Message]:::frontend
  AD --> AE([Interviewer Dashboard]):::frontend
  AE --> AF[Request All Candidates]:::frontend
  AF --> AG[Fetch Candidates from DB]:::backend
  AG --> AH[Display Candidate Grid]:::frontend
  AH --> AI[Search / Sort]:::frontend
  AI --> AJ{Click Candidate?}:::frontend
  AJ -->|Yes| AK[Request Candidate Details]:::frontend
  AK --> AL[Fetch Specific Record]:::backend
  AL --> AM[Show Candidate Detail View]:::frontend
  AJ -->|No| AH
  AM --> AN([END])
  %% Class styles (Mermaid v11 syntax expects colons)
  classDef frontend fill:#0f172a,stroke:#3b82f6,stroke-width:1px,color:#e2e8f0;
  classDef backend fill:#1e293b,stroke:#f59e0b,stroke-width:1px,color:#f5f5f5;
  classDef database fill:#172554,stroke:#fbbf24,stroke-width:1px,color:#f5f5f5;
`;

export function WorkflowChart() {
	const [html, setHtml] = useState<string>("");
	useEffect(() => {
		mermaid.initialize({
			startOnLoad: false,
			theme: "dark",
			securityLevel: "loose",
		});
		mermaid
			.render("workflowDiagram", diagram)
			.then((res: any) => setHtml(res.svg));
	}, []);
	return (
		<div className="relative rounded-xl border border-[var(--border-color)] bg-gradient-to-br from-white/5 to-white/2 p-4 md:p-6 overflow-auto max-h-[650px]">
			<div
				dangerouslySetInnerHTML={{ __html: html }}
				className="mermaid text-[12px] [&_svg]:w-full [&_svg]:h-auto"
			/>
		</div>
	);
}
export default WorkflowChart;
