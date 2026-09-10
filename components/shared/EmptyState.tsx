export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-4 py-14 text-center sm:py-16">
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{message}</p>
    </div>
  );
}
