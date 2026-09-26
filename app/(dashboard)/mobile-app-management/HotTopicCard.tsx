import { ArrowRight } from "lucide-react";
import type { HotTopic } from "@/types/entities";

/** Mirrors the mobile app's Home "Hot topics" banner so admins see what guests see. */
export function HotTopicCard({ topic }: { topic: HotTopic }) {
  return (
    <div
      className="relative h-[214px] w-[298px] shrink-0 snap-start overflow-hidden rounded-2xl bg-[#1a1816]"
      role="img"
      aria-label={`${topic.headline}. ${topic.action_label}`}
    >
      {topic.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={topic.image_url} alt="" className="absolute inset-0 size-full object-cover" />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(14,13,12,0.95) 4%, rgba(14,13,12,0.8) 34%, rgba(14,13,12,0.15) 66%, rgba(14,13,12,0) 92%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-orange">{topic.eyebrow}</p>
        <p className="mb-1 line-clamp-2 max-w-[80%] font-[family-name:var(--font-display)] text-[22px] leading-tight text-white">
          {topic.headline}
        </p>
        {topic.supporting ? (
          <p className="mb-2 line-clamp-2 max-w-[85%] text-[13px] leading-snug text-white/75">{topic.supporting}</p>
        ) : null}
        <p className="inline-flex items-center gap-1 text-[12px] font-medium text-orange">
          {topic.action_label}
          <ArrowRight className="size-3.5" aria-hidden />
        </p>
      </div>
    </div>
  );
}
