"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ApproveConfirmDialog({
  open,
  count,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  count: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = count === 1 ? "Approve 1 ticket?" : `Approve ${count} tickets?`;

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const result = await onConfirm();
    setPending(false);
    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error ?? "Could not approve.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            This writes the gate credential and lets the guest into the app. It cannot be undone from
            this queue. To take access away later, revoke it.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => void handleConfirm()} disabled={pending}>
            <Check className="size-3.5" />
            {pending ? "Approving…" : count === 1 ? "Approve ticket" : `Approve ${count} tickets`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
