"use client";

import { ExternalLink, TriangleAlert } from "lucide-react";
import type { MouseEvent } from "react";
import type { Speaker, SpeakerSocialLink } from "@/types/entities";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PhotoThumb } from "@/components/shared/fields/PhotoThumb";
import { cn } from "@/lib/utils";

export type SpeakerDetail = Speaker & { socials: SpeakerSocialLink[] };

// The row opens the session editor on click; clicks on a speaker (and its card,
// which React bubbles through the portal) must not.
const keepInCell = (event: MouseEvent) => event.stopPropagation();

/**
 * A session's speakers, then its moderator: photo, handle, category, followers
 * and tagline in the cell; everything else in a card on click.
 */
export function SessionSpeakers({
  handles,
  moderator,
  details,
}: {
  handles: string[] | null;
  moderator: string | null;
  details: Map<string, SpeakerDetail>;
}) {
  const people = [
    ...(handles ?? []).map((handle) => ({ handle, role: null as string | null })),
    ...(moderator ? [{ handle: moderator, role: "Moderator" }] : []),
  ];
  if (people.length === 0) return <span className="text-faint">—</span>;
  return (
    <ul className="min-w-0 space-y-1">
      {people.map(({ handle, role }) => (
        <li key={`${role ?? "speaker"}:${handle}`}>
          <SpeakerChip handle={handle} role={role} speaker={details.get(handle)} />
        </li>
      ))}
    </ul>
  );
}

function SpeakerChip({ handle, role, speaker }: { handle: string; role: string | null; speaker?: SpeakerDetail }) {
  if (!speaker) {
    return (
      <div className="flex items-center gap-2.5 py-1">
        <PhotoThumb src={null} alt={handle} />
        <div className="min-w-0">
          <p className="whitespace-nowrap font-medium">{handle}</p>
          <p className="flex items-center gap-1 text-xs text-destructive">
            <TriangleAlert className="size-3" aria-hidden />
            Not in Speakers
          </p>
        </div>
      </div>
    );
  }

  const meta = [speaker.category, speaker.followers_range && `${speaker.followers_range} followers`].filter(Boolean);
  return (
    <Popover>
      <PopoverTrigger
        onClick={keepInCell}
        className="-mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 data-popup-open:bg-white/[0.06]"
        aria-label={`${handle}${role ? `, ${role.toLowerCase()}` : ""}: show speaker details`}
      >
        <PhotoThumb src={speaker.photo_url} alt={handle} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-medium text-foreground">{handle}</span>
            {role ? <Badge variant="outline">{role}</Badge> : null}
            {speaker.archived ? <Badge variant="secondary">Hidden</Badge> : null}
          </p>
          {meta.length ? <p className="whitespace-nowrap text-xs text-muted-foreground">{meta.join(" · ")}</p> : null}
          {speaker.tagline ? <p className="max-w-[18rem] truncate text-xs text-faint">{speaker.tagline}</p> : null}
        </div>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-80 gap-3 p-4" onClick={keepInCell}>
        <SpeakerCard speaker={speaker} role={role} />
      </PopoverContent>
    </Popover>
  );
}

const BIO_STATUS: Record<Speaker["bio_status"], { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "text-emerald-400" },
  unconfirmed: { label: "Unconfirmed", className: "text-amber-400" },
  missing: { label: "Missing", className: "text-destructive" },
};

function SpeakerCard({ speaker, role }: { speaker: SpeakerDetail; role: string | null }) {
  const bio = BIO_STATUS[speaker.bio_status];
  const facts: [string, string | null][] = [
    ["Category", speaker.category],
    ["Followers", speaker.followers_range],
    ["Availability", speaker.availability],
  ];
  return (
    <>
      <div className="flex items-start gap-3">
        <PhotoThumb src={speaker.photo_url} alt={speaker.handle} size="md" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="flex flex-wrap items-center gap-1.5 font-semibold text-foreground">
            {speaker.handle}
            {role ? <Badge variant="outline">{role}</Badge> : null}
          </p>
          {speaker.tagline ? <p className="text-xs leading-snug text-muted-foreground">{speaker.tagline}</p> : null}
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        {facts.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-faint">{label}</dt>
            <dd className={cn("text-foreground", !value && "text-faint")}>{value || "—"}</dd>
          </div>
        ))}
        <dt className="text-faint">Bio</dt>
        <dd className={bio.className}>{bio.label}</dd>
        <dt className="text-faint">App</dt>
        <dd className={speaker.archived ? "text-muted-foreground" : "text-foreground"}>
          {speaker.archived ? "Hidden from app" : "Shown in app"}
        </dd>
      </dl>

      {speaker.known_for ? (
        <div className="space-y-1">
          <p className="text-xs text-faint">Description</p>
          <p className="max-h-32 overflow-y-auto text-xs leading-relaxed text-foreground">{speaker.known_for}</p>
        </div>
      ) : null}

      {speaker.tags?.length ? (
        <div className="flex flex-wrap gap-1">
          {speaker.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      {speaker.socials.length ? (
        <ul className="space-y-1 border-t border-border pt-2.5 text-xs">
          {speaker.socials.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 rounded px-1 py-0.5 hover:bg-white/[0.05]"
              >
                <span className="w-16 shrink-0 text-faint">{link.platform}</span>
                <span className="min-w-0 flex-1 truncate text-foreground group-hover:text-orange">{link.handle}</span>
                <ExternalLink className="size-3 shrink-0 text-faint" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
