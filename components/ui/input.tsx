import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-10 w-full px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium",
					"rounded-lg border border-[var(--border-color)] bg-white/5 backdrop-blur-sm",
					"text-neutral-100 placeholder:text-neutral-500",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
					"disabled:cursor-not-allowed disabled:opacity-50",
					"shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]",
					"transition-colors focus:bg-white/10",
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
