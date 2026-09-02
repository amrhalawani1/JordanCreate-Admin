export function PhotoThumb({ src, alt }: { src: string | null | undefined; alt: string }) {
  if (!src) {
    return (
      <span
        className="inline-block size-9 shrink-0 rounded-[4px] bg-white/10"
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="size-9 shrink-0 rounded-[4px] object-cover"
    />
  );
}
