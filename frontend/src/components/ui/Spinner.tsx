export function Spinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const s = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" }[size];
  return (
    <span
      className={`inline-block rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin ${s} ${className}`}
    />
  );
}
