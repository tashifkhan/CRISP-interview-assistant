"use client";
import { useEffect, useState } from "react";
import mermaid from "mermaid";

const diagram = `flowchart TD
  A[Interviewee UI] -- Resume PDF/DOCX --> B[/Resume Parse API/]
  B -->|Gemini parse| C[Parsed Profile/Skills]
  A -- Start Interview --> D[/Generate-All-Questions API/]
  D -->|6 tailored Qs| E[Timed Q&A]
  E -- submit answer --> F[/Evaluate-Answer API/]
  E -- complete --> G[/Generate-Summary API/]
  G --> H[Final score + summary]
  H --> I[/Complete-Interview API/]
  I --> J[(MongoDB)]
  K[Interviewer Dashboard] -->|search/view| L[/Candidates API/]
  L --> J
  K -->|view details| M[/Candidate by ID API/]
  M --> J
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
				primaryColor: "#00ADB5",
				primaryTextColor: "#EEEEEE",
				primaryBorderColor: "#00ADB5",
				lineColor: "#00ADB5",
				secondaryColor: "#393E46",
				tertiaryColor: "#222831",
				background: "#0b1220",
				mainBkg: "#222831",
				secondBkg: "#393E46",
				tertiaryBkg: "#393E46",
				edgeLabelBackground: "#222831",
				clusterBkg: "#1a2332",
				clusterBorder: "#00ADB5",
			},
		});
		mermaid.render("workflowDiagram", diagram).then((res: { svg: string }) => {
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
