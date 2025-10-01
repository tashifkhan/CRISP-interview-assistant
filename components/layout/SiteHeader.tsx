"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function SiteHeader() {
	const [open, setOpen] = React.useState(false);
	return (
		<header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(34,40,49,0.55)]">
			<div className="mx-auto flex h-16 max-w-6xl items-center px-5">
				<Link
					href="/"
					className="relative font-semibold text-lg tracking-tight"
				>
					<span className="accent-gradient-text">CRISP</span>
				</Link>
				<nav className="ml-8 hidden md:flex items-center gap-6 text-sm text-[var(--foreground-muted)]">
					<Link
						href="/interviewee"
						className="hover:text-[var(--foreground)] transition-colors"
					>
						Interviewee
					</Link>
					<Link
						href="/interviewer"
						className="hover:text-[var(--foreground)] transition-colors"
					>
						Interviewer
					</Link>
					<Link
						href="/workflow"
						className="hover:text-[var(--foreground)] transition-colors"
					>
						Workflow
					</Link>
				</nav>
				<div className="ml-auto flex items-center gap-3">
					<a
						href="https://github.com/tashifkhan/CRISP-interview-assistant"
						target="_blank"
						rel="noopener noreferrer"
						className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
					>
						GitHub
					</a>
					<button
						aria-label="Toggle menu"
						onClick={() => setOpen(!open)}
						className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 hover:bg-white/10"
					>
						{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</div>
			</div>
			{open && (
				<div className="md:hidden border-t border-white/10 bg-[rgba(34,40,49,0.75)] backdrop-blur-xl">
					<div className="mx-auto max-w-6xl px-5 py-3 flex flex-col gap-2 text-sm">
						<Link
							onClick={() => setOpen(false)}
							href="/interviewee"
							className="py-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
						>
							Interviewee
						</Link>
						<Link
							onClick={() => setOpen(false)}
							href="/interviewer"
							className="py-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
						>
							Interviewer
						</Link>
						<Link
							onClick={() => setOpen(false)}
							href="/workflow"
							className="py-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
						>
							Workflow
						</Link>
					</div>
				</div>
			)}
		</header>
	);
}
