"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { describeTicket } from "@/lib/tickets/format";
import type { TicketQueueRow } from "@/types/entities";

export function RejectDialog({
  ticket,
  onOpenChange,
  onConfirm,
}: {
  ticket: TicketQueueRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    const trimmed = note.trim();
    if (!trimmed) {
      setError("A rejection note is required.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await onConfirm(trimmed);
    setPending(false);
    if (result.success) {
      setNote("");
      onOpenChange(false);
    } else {
      setError(result.error ?? "Could not reject.");
    }
  }

  return (
    <Dialog
      open={!!ticket}
      onOpenChange={(open) => {
        if (!open) {
          setNote("");
          setError(null);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this ticket?</DialogTitle>
          <DialogDescription>
            {ticket ? describeTicket(ticket) : "Reject this ticket?"} The note is kept so someone can
            explain this six weeks from now.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="rejection_note">
            Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="rejection_note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            required
            placeholder="Why this ticket should not be approved"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => void handleConfirm()}
            disabled={pending}
          >
            <X className="size-3.5" />
            {pending ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
