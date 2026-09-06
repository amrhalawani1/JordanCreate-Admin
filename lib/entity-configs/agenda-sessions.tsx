"use client";

import type { EntityConfig, FilterConfig } from "./types";
import type { AgendaSession } from "@/types/entities";
import { AGENDA_STATUS_VALUES } from "@/types/entities";
import { archiveFilter } from "@/lib/archive";
import { ArchiveStatusBadge } from "@/components/shared/ArchiveStatusBadge";

interface Option {
  value: string;
  label: string;
}

export function buildAgendaSessionConfig(
  speakerOptions: Option[],
  tagOptions: Option[],
  sessionTypes: string[],
): EntityConfig<AgendaSession> {
  const filters: FilterConfig<AgendaSession>[] = [
    { key: "session_type", label: "Type", options: sessionTypes },
    { key: "status", label: "Status", options: AGENDA_STATUS_VALUES },
    archiveFilter<AgendaSession>(),
  ];

  return {
    table: "agenda_sessions",
    pkColumn: "session_id",
    entityLabel: "Session",
    searchKeys: ["title", "session_id"],
    filters,
    columns: [
      { key: "session_id", header: "ID" },
      { key: "start_time", header: "Start" },
      { key: "title", header: "Title" },
      { key: "session_type", header: "Type" },
      { key: "status", header: "Status" },
      {
        key: "archived",
        header: "App",
        render: (row) => <ArchiveStatusBadge archived={row.archived} />,
      },
    ],
    formFields: [
      { name: "session_id", label: "Session ID", type: "text", required: true, placeholder: "e.g. S01" },
      { name: "start_time", label: "Start Time", type: "time", required: true },
      { name: "end_time", label: "End Time", type: "time", required: true },
      {
        name: "session_type",
        label: "Session Type",
        type: "suggest-text",
        required: true,
        referenceOptions: sessionTypes.map((v) => ({ value: v, label: v })),
        placeholder: "e.g. Panel",
      },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "speaker_handles",
        label: "Speakers",
        type: "multiselect-ref",
        referenceOptions: speakerOptions,
      },
      {
        name: "moderator_handle",
        label: "Moderator",
        type: "select-ref",
        referenceOptions: speakerOptions,
      },
      { name: "duration_minutes", label: "Duration (minutes)", type: "number", required: true },
      {
        name: "interest_tag_ids",
        label: "Interest Tags",
        type: "multiselect-ref",
        referenceOptions: tagOptions,
      },
      { name: "location_within_venue", label: "Location Within Venue", type: "text" },
      { name: "status", label: "Status", type: "enum", required: true, enumValues: AGENDA_STATUS_VALUES },
      { name: "flag_notes", label: "Flag Notes", type: "textarea", helpText: "Open questions or caveats." },
    ],
    hasUpdatedAt: true,
    reorderable: true,
    archivable: true,
    describeRow: (row) => `Delete session "${row.title}" (${row.session_id})? This cannot be undone.`,
  };
}
