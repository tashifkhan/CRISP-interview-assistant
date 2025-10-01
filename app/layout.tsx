import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { StoreProvider } from "@/components/providers/store-provider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "CRISP Interview Assistant",
	description:
		"AI-powered technical interview assistant with resume parsing, personalized Q&A, and dashboard.",
	openGraph: {
		title: "CRISP Interview Assistant",
		description:
			"AI-powered technical interview assistant with resume parsing, personalized Q&A, and dashboard.",
		type: "website",
		locale: "en_US",
		images: [
			{
				url: "/window.svg",
				width: 1200,
				height: 630,
				alt: "CRISP Interview Assistant",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "CRISP Interview Assistant",
		description:
			"AI-powered technical interview assistant with resume parsing, personalized Q&A, and dashboard.",
		images: ["/window.svg"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
			>
				<div className="relative flex min-h-screen flex-col">
					{/* Ambient gradients */}
					<div className="pointer-events-none absolute inset-0">
						<div className="absolute inset-0 opacity-[0.35] mix-blend-screen bg-[radial-gradient(circle_at_18%_22%,rgba(0,173,181,0.18),transparent_60%)]" />
						<div className="absolute inset-0 opacity-[0.25] mix-blend-screen bg-[radial-gradient(circle_at_82%_78%,rgba(0,173,181,0.14),transparent_65%)]" />
					</div>
					<header className="sticky top-0 z-40 backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(34,40,49,0.55)] border-b border-white/10">
						<div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5">
							<Link
								href="/"
								className="relative font-semibold text-lg tracking-tight"
							>
								<span className="accent-gradient-text">CRISP</span>
							</Link>
							<nav className="flex items-center gap-6 text-sm text-[var(--foreground-muted)]">
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
							<div className="ml-auto flex items-center gap-4">
								<a
									href="https://github.com/tashifkhan/CRISP-interview-assistant"
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
								>
									GitHub
								</a>
							</div>
						</div>
					</header>
					<StoreProvider>
						<main className="flex-1 mx-auto w-full max-w-6xl px-5 py-10 space-y-10 animate-fade-in-up">
							{children}
						</main>
					</StoreProvider>
					<footer className="mt-auto py-8 text-center text-[11px] text-[var(--foreground-muted)] border-t border-white/10 backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(34,40,49,0.55)]">
						<span className="tracking-wide">
							CRISP Interview Assistant ·{" "}
							<span className="text-[rgba(255,255,255,0.45)]">Prototype</span>
						</span>
					</footer>
				</div>
			</body>
		</html>
	);
}
