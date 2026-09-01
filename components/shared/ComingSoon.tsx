export function ComingSoon({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-start rounded-[4px] border border-border bg-card px-4 py-10 md:px-8 md:py-16">
      <p className="jc-label">Soon</p>
      <h2 className="jc-page-title mt-3 text-[1.75rem] md:text-[2rem]">Coming soon</h2>
      {message ? (
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
