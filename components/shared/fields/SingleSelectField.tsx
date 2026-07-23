"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

const NONE_VALUE = "__none__";

interface SingleSelectFieldProps {
  id: string;
  value: string | null;
  options: Option[];
  onChange: (value: string | null) => void;
  placeholder?: string;
}

export function SingleSelectField({ id, value, options, onChange, placeholder = "Select…" }: SingleSelectFieldProps) {
  return (
    <Select
      value={value ?? NONE_VALUE}
      onValueChange={(v: string | null) => onChange(!v || v === NONE_VALUE ? null : v)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>— None —</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
