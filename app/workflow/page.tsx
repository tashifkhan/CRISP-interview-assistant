"use client";
import { Suspense, useState } from "react";
import WorkflowChart from "@/components/flow/WorkflowChart";

export default function WorkflowFullPage() {
  const [svg, setSvg] = useState("");
  function download(type: "svg" | "png") {
    if (!svg) return;
    if (type === "svg") {
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "crisp-workflow.svg";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Convert to PNG via canvas
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, "image/svg+xml");
      const svgEl = doc.documentElement as unknown as SVGSVGElement;
      const width = parseInt(svgEl.getAttribute("width") || "1600", 10);
      const height = parseInt(svgEl.getAttribute("height") || "1200", 10);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((b) => {
          if (!b) return;
            const pngUrl = URL.createObjectURL(b);
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = "crisp-workflow.png";
            a.click();
            URL.revokeObjectURL(pngUrl);
        }, "image/png");
      };
      img.src = url;
    }
  }
  return (
    <div className="min-h-screen w-full bg-[#0b1220] text-neutral-100 flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <h1 className="text-sm font-semibold tracking-wide">CRISP Workflow (Full View)</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => download("svg")} disabled={!svg} className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-blue-600 enabled:hover:bg-blue-500 disabled:opacity-40 text-white shadow">Download SVG</button>
          <button onClick={() => download("png")} disabled={!svg} className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-emerald-600 enabled:hover:bg-emerald-500 disabled:opacity-40 text-white shadow">Download PNG</button>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1800px] mx-auto">
          <Suspense fallback={<div className="h-[600px] w-full rounded-xl border border-[var(--border-color)] bg-white/5 animate-pulse" />}> 
            <WorkflowChart onSvg={setSvg} maxHeight="" className="min-h-[600px]" />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
