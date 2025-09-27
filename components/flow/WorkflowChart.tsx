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
  %% Updated class styles using new brand palette
  classDef frontend fill:#222831,stroke:#00ADB5,stroke-width:2px,color:#EEEEEE;
  classDef backend fill:#393E46,stroke:#00ADB5,stroke-width:2px,color:#EEEEEE;
  classDef database fill:#393E46,stroke:#00ADB5,stroke-width:3px,color:#EEEEEE;
`;

export interface WorkflowChartProps {
	onSvg?: (svg: string) => void;
	className?: string;
	maxHeight?: string;
}

export function WorkflowChart({
	onSvg,
	className = "",
	maxHeight = "max-h-[650px]",
}: WorkflowChartProps) {
	const [html, setHtml] = useState<string>("");
	useEffect(() => {
		mermaid.initialize({
			startOnLoad: false,
			theme: "dark",
			securityLevel: "loose",
			themeVariables: {
				primaryColor: "#222831",
				primaryTextColor: "#EEEEEE", 
				primaryBorderColor: "#00ADB5",
				lineColor: "#00ADB5",
				secondaryColor: "#393E46",
				tertiaryColor: "#222831",
				background: "#222831",
				mainBkg: "#222831",
				secondBkg: "#393E46",
				tertiaryBkg: "#393E46"
			}
		});
		mermaid.render("workflowDiagram", diagram).then((res: any) => {
			setHtml(res.svg);
			onSvg?.(res.svg);
		});
	}, [onSvg]);
	return (
		<div
			className={`relative rounded-xl border border-[var(--border-color)] bg-gradient-to-br from-white/5 to-white/2 p-4 md:p-6 overflow-auto ${maxHeight} ${className}`}
		>
			<div
				dangerouslySetInnerHTML={{ __html: html }}
				className="mermaid text-[12px] [&_svg]:w-full [&_svg]:h-auto"
			/>
		</div>
	);
}
export default WorkflowChart;
