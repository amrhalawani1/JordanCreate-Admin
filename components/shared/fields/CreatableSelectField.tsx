"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface CreatableSelectFieldProps {
  id: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * A dropdown of the values already in use, with search and an "Add" row for
 * a new value. Replaces the browser's native datalist for `suggest-text`
 * fields (category, zone, type…), so the list looks like the rest of the
 * panel and never gets clipped.
 */
export function CreatableSelectField({
  id,
  value,
  options,
  onChange,
  placeholder = "Select or type to add…",
  disabled = false,
}: CreatableSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const allOptions = useMemo(() => {
    const seen = new Set(options.map((o) => o.value.toLowerCase()));
    // The current value may be one nobody else uses yet; keep it listed.
    const extra = value && !seen.has(value.toLowerCase()) ? [{ value, label: value }] : [];
    return [...options, ...extra].sort((a, b) => a.label.localeCompare(b.label));
  }, [options, value]);

  const trimmed = query.trim();
  const exactMatch = allOptions.some((o) => o.value.toLowerCase() === trimmed.toLowerCase());
  const canAdd = trimmed.length > 0 && !exactMatch;

  function pick(next: string) {
    onChange(next);
    setQuery("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-[var(--jc-radius-field)] border border-border bg-white/[0.02] px-3 text-left text-sm transition-colors",
          "hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50",
          "disabled:cursor-not-allowed disabled:opacity-60",
          !value && "text-muted-foreground",
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--anchor-width)] p-0">
        <Command shouldFilter>
          <CommandInput
            placeholder="Search or type a new one…"
            value={query}
            onValueChange={setQuery}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAdd) {
                e.preventDefault();
                pick(trimmed);
              }
            }}
          />
          <CommandList className="max-h-64">
            <CommandEmpty>{canAdd ? "No match yet." : "Nothing here yet. Type to add one."}</CommandEmpty>
            <CommandGroup>
              {allOptions.map((opt) => (
                <CommandItem key={opt.value} value={opt.value} onSelect={() => pick(opt.value)}>
                  <Check className={cn("size-4", opt.value === value ? "opacity-100" : "opacity-0")} aria-hidden />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {canAdd ? (
              <CommandGroup heading="New">
                <CommandItem value={`__add__${trimmed}`} onSelect={() => pick(trimmed)} className="text-orange">
                  <Plus className="size-4" aria-hidden />
                  Add “{trimmed}”
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
