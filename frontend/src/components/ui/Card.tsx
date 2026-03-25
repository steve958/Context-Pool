import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ hoverable, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 ${
        hoverable ? "cursor-pointer transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-overlay)]" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
