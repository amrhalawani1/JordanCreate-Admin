"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectFieldProps {
  id: string;
  value: string[];
  options: Option[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelectField({
  id,
  value,
  options,
  onChange,
  placeholder = "Select…",
  disabled = false,
}: MultiSelectFieldProps) {
  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <Badge key={v} variant="secondary" className={disabled ? "" : "gap-1 pr-1"}>
                {opt?.label ?? v}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => toggle(v)}
                    className="rounded-full p-0.5 hover:bg-background/50"
                    aria-label={`Remove ${opt?.label ?? v}`}
                  >
                    <X className="size-3" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}
      {!disabled && (
      <Popover>
        <PopoverTrigger
          id={id}
          className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-muted-foreground outline-none select-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span>{value.length ? `${value.length} selected` : placeholder}</span>
          <ChevronDown className="size-4 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="max-h-64 w-72 overflow-y-auto p-1">
          {options.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No options available.</p>
          )}
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <Checkbox
                checked={value.includes(opt.value)}
                onCheckedChange={() => toggle(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </PopoverContent>
      </Popover>
      )}
      {disabled && value.length === 0 && (
        <p className="text-sm text-muted-foreground">None</p>
      )}
    </div>
  );
}
