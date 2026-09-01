export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[4px] border border-dashed border-border py-16 text-center">
      <p className="max-w-sm px-4 text-base leading-relaxed text-muted-foreground">{message}</p>
    </div>
  );
}
