import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					// Base size & layout
					"flex h-10 w-full px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium",
					// Rounded / glass surface style (light & dark adaptive)
					"rounded-lg border border-[var(--border-color)] bg-white/70 dark:bg-white/5 backdrop-blur-sm",
					// Text & placeholder colors
					"text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
					// Focus ring consistent with design tokens
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
					// Disabled
					"disabled:cursor-not-allowed disabled:opacity-50",
					// Subtle inner shadow to lift from background
					"shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]",
					// Transition for hover / focus polish
					"transition-colors focus:bg-white/80 dark:focus:bg-white/10",
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Input.displayName = "Input";

export { Input };
