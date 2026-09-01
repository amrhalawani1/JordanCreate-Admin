"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function buildAssistantPrompt(title: string, description: string): string {
  return [
    "Help me write a product feature request for the Jordan Create admin and registry.",
    "",
    `Title: ${title.trim() || "(untitled)"}`,
    "",
    `Description: ${description.trim() || "(none yet)"}`,
  ].join("\n");
}

function assistantUrl(base: string, prompt: string): string {
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}q=${encodeURIComponent(prompt)}`;
}

export function FeatureRequestDialog({
  open,
  onOpenChange,
  submitting,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  error?: string;
  onSubmit: (values: { title: string; description: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("feature-title")?.focus();
    });
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, submitting, onOpenChange]);

  if (!open) return null;

  function openAssistant(base: string) {
    window.open(assistantUrl(base, buildAssistantPrompt(title, description)), "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-request-title"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8 md:py-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="jc-label">12 / Feedback</p>
            <h2 id="feature-request-title" className="jc-page-title mt-3 break-words text-[1.75rem] md:text-[2rem]">
              Request a Feature
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Name the gap — missing app or bot data, or a new admin screen — then submit it. A friend assistant can help you write it.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            <XIcon />
          </Button>
        </div>

        <form
          className="mt-6 flex flex-1 flex-col gap-6 md:mt-10"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit({ title, description });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="feature-title">Title</Label>
            <Input
              id="feature-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Guest dietary notes, or export tickets as CSV"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feature-description">Description</Label>
            <Textarea
              id="feature-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Is this data the app or bot is missing, or a feature this admin should have?"
              className="min-h-40"
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="space-y-3 border-t border-white/10 pt-6">
            <p className="jc-label">Get help from a friend assistant</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => openAssistant("https://chatgpt.com/")}>
                Go to ChatGPT
              </Button>
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => openAssistant("https://gemini.google.com/app")}>
                Go to Gemini
              </Button>
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => openAssistant("https://claude.ai/new")}>
                Go to Claude
              </Button>
            </div>
          </div>

          <div className="mt-auto flex flex-col-reverse gap-2 pt-4 sm:flex-row">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
