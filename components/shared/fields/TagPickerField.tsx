"use client";

import { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { parseChipList, serializeChipList } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface TagPickerFieldProps {
  id: string;
  /** Serialised chip list ("a; b; c"), same storage format as ChipListField. */
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Chips plus a dropdown of the tags already in use, with search and an
 * "Add" row for a new tag. Same storage format as ChipListField, so configs
 * can switch between them by supplying `referenceOptions`.
 */
export function TagPickerField({
  id,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Add a tag…",
}: TagPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const chips = parseChipList(value);
  const chosen = new Set(chips.map((c) => c.toLowerCase()));

  const allOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: Option[] = [];
    for (const o of [...options, ...chips.map((c) => ({ value: c, label: c }))]) {
      const k = o.value.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(o);
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  }, [options, chips]);

  const trimmed = query.trim();
  const exists = allOptions.some((o) => o.value.toLowerCase() === trimmed.toLowerCase());
  const canAdd = trimmed.length > 0 && !exists;

  function toggle(tag: string) {
    const next = chosen.has(tag.toLowerCase())
      ? chips.filter((c) => c.toLowerCase() !== tag.toLowerCase())
      : [...chips, tag];
    onChange(serializeChipList(next));
  }
  function add(tag: string) {
    if (!chosen.has(tag.toLowerCase())) onChange(serializeChipList([...chips, tag]));
    setQuery("");
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
                onClick={() => toggle(chip)}
                className="inline-flex size-6 items-center justify-center rounded-full hover:bg-background/50"
                aria-label={`Remove ${chip}`}
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        {chips.length === 0 && disabled && <p className="text-sm text-muted-foreground">None</p>}
      </div>

      {!disabled && (
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
          <PopoverTrigger
            id={id}
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex h-10 w-full items-center justify-between gap-2 rounded-[var(--jc-radius-field)] border border-border bg-white/[0.02] px-3 text-left text-sm text-muted-foreground transition-colors",
              "hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50",
            )}
          >
            <span className="truncate">{placeholder}</span>
            <Plus className="size-4 shrink-0 opacity-60" aria-hidden />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[var(--anchor-width)] p-0">
            <Command shouldFilter>
              <CommandInput
                placeholder="Search or type a new tag…"
                value={query}
                onValueChange={setQuery}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canAdd) {
                    e.preventDefault();
                    add(trimmed);
                  }
                }}
              />
              <CommandList className="max-h-64">
                <CommandEmpty>{canAdd ? "No match yet." : "No tags yet. Type to add one."}</CommandEmpty>
                <CommandGroup>
                  {allOptions.map((opt) => {
                    const on = chosen.has(opt.value.toLowerCase());
                    return (
                      <CommandItem key={opt.value} value={opt.value} onSelect={() => toggle(opt.value)}>
                        <Check className={cn("size-4", on ? "opacity-100" : "opacity-0")} aria-hidden />
                        {opt.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {canAdd ? (
                  <CommandGroup heading="New">
                    <CommandItem value={`__add__${trimmed}`} onSelect={() => add(trimmed)} className="text-orange">
                      <Plus className="size-4" aria-hidden />
                      Add “{trimmed}”
                    </CommandItem>
                  </CommandGroup>
                ) : null}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
