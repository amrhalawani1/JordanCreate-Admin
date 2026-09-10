"use client";

import { useEffect, useState } from "react";
import { Ban } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { describeTicket } from "@/lib/tickets/format";
import type { TicketQueueRow } from "@/types/entities";

export function RevokeConfirmDialog({
  ticket,
  onOpenChange,
  onConfirm,
}: {
  ticket: TicketQueueRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayed, setDisplayed] = useState(ticket);

  useEffect(() => {
    if (ticket) setDisplayed(ticket);
  }, [ticket]);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const result = await onConfirm();
    setPending(false);
    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error ?? "Could not revoke access.");
    }
  }

  const shown = ticket ?? displayed;

  return (
    <Dialog
      open={!!ticket}
      onOpenChange={(open) => {
        if (!open) setError(null);
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke access?</DialogTitle>
          <DialogDescription>
            {shown ? describeTicket(shown) : "This person"} will not be able to open the app. The
            ticket stays on file.
          </DialogDescription>
        </DialogHeader>
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
            <Ban className="size-3.5" />
            {pending ? "Revoking…" : "Revoke access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
