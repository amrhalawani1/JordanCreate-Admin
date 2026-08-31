"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { parseChipList, serializeChipList } from "@/lib/utils";

interface ChipListFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ChipListField({ id, value, onChange, disabled = false }: ChipListFieldProps) {
  const [draft, setDraft] = useState("");
  const chips = parseChipList(value);

  function addChip() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange(serializeChipList([...chips, trimmed]));
    setDraft("");
  }

  function removeChip(index: number) {
    onChange(serializeChipList(chips.filter((_, i) => i !== index)));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip, i) => (
          <Badge key={`${chip}-${i}`} variant="secondary" className={disabled ? "" : "gap-1 pr-1"}>
            {chip}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeChip(i)}
                className="rounded-full p-0.5 hover:bg-background/50"
                aria-label={`Remove ${chip}`}
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        {chips.length === 0 && disabled && (
          <p className="text-sm text-muted-foreground">None</p>
        )}
      </div>
      {!disabled && (
        <Input
          id={id}
          value={draft}
          placeholder="Type a value and press Enter"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addChip();
            }
          }}
          onBlur={addChip}
        />
      )}
    </div>
  );
}
