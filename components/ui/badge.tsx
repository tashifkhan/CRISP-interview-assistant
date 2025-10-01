import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90",
				secondary: "border border-white/10 bg-white/5 text-neutral-200",
				outline: "text-neutral-200",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}
