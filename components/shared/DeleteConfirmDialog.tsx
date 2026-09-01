"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
  onDeleted: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  description,
  onConfirm,
  onDeleted,
}: DeleteConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const result = await onConfirm();
    setPending(false);
    if (result.success) {
      onOpenChange(false);
      onDeleted();
    } else {
      setError(result.error ?? "Failed to delete.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this item?</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" className="w-full sm:w-auto" onClick={handleConfirm} disabled={pending}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
