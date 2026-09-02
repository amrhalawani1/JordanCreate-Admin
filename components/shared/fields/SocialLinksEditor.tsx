"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SOCIAL_PLATFORM_VALUES, type SocialLinkDraft, type SocialPlatform } from "@/types/entities";

interface SocialLinksEditorProps {
  value: SocialLinkDraft[];
  onChange: (value: SocialLinkDraft[]) => void;
  disabled?: boolean;
}

const EMPTY_ROW: SocialLinkDraft = {
  platform: "Instagram",
  handle: "",
  url: "",
};

export function SocialLinksEditor({ value, onChange, disabled = false }: SocialLinksEditorProps) {
  function update(index: number, patch: Partial<SocialLinkDraft>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Social links</Label>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Saved with this record. Leave a row blank to skip it.
        </p>
      </div>

      {value.length === 0 && disabled && (
        <p className="text-sm text-muted-foreground">None</p>
      )}

      <div className="flex flex-col gap-3">
        {value.map((row, index) => (
          <div key={`${row.platform}-${index}`} className="rounded-[4px] border border-white/10 p-3">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Select
                value={row.platform}
                disabled={disabled}
                onValueChange={(platform) => update(index, { platform: platform as SocialPlatform })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORM_VALUES.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!disabled && (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move down"
                    disabled={index === value.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove link"
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Input
                value={row.handle}
                disabled={disabled}
                placeholder="Handle"
                onChange={(e) => update(index, { handle: e.target.value })}
              />
              <Input
                type="url"
                value={row.url}
                disabled={disabled}
                placeholder="https://"
                onChange={(e) => update(index, { url: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { ...EMPTY_ROW }])}>
          <Plus />
          Add link
        </Button>
      )}
    </div>
  );
}
