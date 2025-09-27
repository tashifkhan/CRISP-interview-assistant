import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("rounded-lg border bg-white shadow-sm", className)}
			{...props}
		/>
	);
}
export function CardHeader({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("p-4 border-b", className)} {...props} />;
}
export function CardTitle({
	className,
	...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h3
			className={cn(
				"font-semibold leading-none tracking-tight text-sm",
				className
			)}
			{...props}
		/>
	);
}
export function CardContent({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("p-4 pt-2", className)} {...props} />;
}
export function CardFooter({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("p-4 border-t mt-auto", className)} {...props} />;
}
