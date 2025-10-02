"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Github } from "lucide-react";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
	const [open, setOpen] = React.useState(false);
	const [logoError, setLogoError] = React.useState(false);
	const pathname = usePathname();

	const links = [
		{ href: "/interviewee", label: "Interviewee" },
		{ href: "/interviewer", label: "Interviewer" },
		{ href: "/workflow", label: "Workflow" },
	];

	const isActive = (href: string) =>
		href === "/" ? pathname === "/" : pathname?.startsWith(href);

	return (
		<header className="sticky top-0 z-40 backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(34,40,49,0.55)] border-b border-white/10">
			<div className="mx-auto flex h-16 max-w-6xl items-center px-5">
				<Link
					href="/"
					className="group relative flex items-center gap-3 pr-5"
					aria-label="CRISP Interview Assistant Home"
				>
					{/* Logo / Mascot */}
					<span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/15 bg-gradient-to-br from-[rgba(0,173,181,0.15)] via-[rgba(0,173,181,0.05)] to-transparent shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden">
						{!logoError ? (
							<Image
								src="/logo.png"
								alt="CRISP logo mascot"
								width={40}
								height={40}
								priority
								className="h-8 w-8 object-contain select-none"
								onError={() => setLogoError(true)}
							/>
						) : (
							<span className="text-xs font-bold accent-gradient-text">CR</span>
						)}
						{/* Subtle orbiting accent */}
						<span className="pointer-events-none absolute inset-0 animate-pulse rounded-xl bg-[radial-gradient(circle_at_30%_25%,rgba(0,173,181,0.35),transparent_60%)] opacity-40 mix-blend-screen" />
					</span>
					<span className="flex flex-col leading-tight">
						<span className="font-semibold text-base tracking-tight accent-gradient-text">
							CRISP
						</span>
						<span className="text-[10px] uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
							Interview AI
						</span>
					</span>
				</Link>

				<nav className="ml-6 hidden md:flex items-center gap-1 text-sm relative">
					<div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-1 py-1 backdrop-blur supports-[backdrop-filter]:bg-white/5">
						{links.map((l) => {
							const active = isActive(l.href);
							return (
								<Link
									key={l.href}
									href={l.href}
									className={
										"relative rounded-lg px-3 py-2 font-medium transition-colors duration-200 " +
										(active
											? "text-white bg-[rgba(0,173,181,0.15)] shadow-inner shadow-[rgba(0,173,181,0.3)]"
											: "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5")
									}
								>
									{l.label}
									{active && (
										<span className="pointer-events-none absolute inset-x-2 -bottom-[3px] h-px bg-gradient-to-r from-transparent via-[rgba(0,173,181,0.7)] to-transparent" />
									)}
								</Link>
							);
						})}
					</div>
				</nav>

				<div className="ml-auto flex items-center gap-3">
					<a
						href="https://github.com/tashifkhan/CRISP-interview-assistant"
						target="_blank"
						rel="noopener noreferrer"
						className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)] hover:bg-white/10"
					>
						<Github className="h-3.5 w-3.5" />
						<span>GitHub</span>
					</a>
					<button
						aria-label="Toggle menu"
						onClick={() => setOpen(!open)}
						className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
					>
						{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</div>
			</div>

			{open && (
				<div className="md:hidden border-t border-white/10 bg-[rgba(34,40,49,0.85)] backdrop-blur-xl">
					<div className="mx-auto max-w-6xl px-5 py-4 flex flex-col gap-1 text-sm">
						<div className="flex items-center gap-3 pb-3">
							<span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-white/15 bg-gradient-to-br from-[rgba(0,173,181,0.18)] via-[rgba(0,173,181,0.07)] to-transparent overflow-hidden">
								<Image
									src="/logo.png"
									alt="CRISP logo"
									width={36}
									height={36}
									className="h-7 w-7 object-contain"
								/>
							</span>
							<span className="font-semibold tracking-tight accent-gradient-text text-base">
								CRISP
							</span>
						</div>
						{links.map((l) => (
							<Link
								key={l.href}
								onClick={() => setOpen(false)}
								href={l.href}
								className={
									"rounded-lg px-3 py-2 font-medium transition-colors " +
									(isActive(l.href)
										? "bg-[rgba(0,173,181,0.15)] text-white"
										: "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5")
								}
							>
								{l.label}
							</Link>
						))}
						<a
							href="https://github.com/tashifkhan/CRISP-interview-assistant"
							target="_blank"
							rel="noopener noreferrer"
							className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/10"
						>
							<Github className="h-4 w-4" /> GitHub
						</a>
					</div>
				</div>
			)}
		</header>
	);
}
