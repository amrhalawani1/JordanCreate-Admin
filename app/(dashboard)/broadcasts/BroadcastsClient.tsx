"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sendBroadcast } from "@/actions/broadcasts";
import { useAdminAccess } from "@/components/layout/AdminAccessProvider";
import { EmptyState } from "@/components/shared/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { BROADCAST_DESTINATIONS, destinationLabel } from "@/lib/broadcasts/deep-links";
import { MAX_BROADCAST_LENGTH, NOTIFICATION_TITLE } from "@/lib/broadcasts/send";
import type { BroadcastListItem } from "@/types/entities";

type Audience = "all" | "test";
const NO_LINK = "none";

function formatWhen(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Amman",
  }).format(new Date(value));
}

const STATUS_LABEL: Record<BroadcastListItem["status"], string> = {
  draft: "Draft",
  sending: "Sending",
  sent: "Sent",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function BroadcastsClient({
  initialData,
  deviceCount,
  loadError,
}: {
  initialData: BroadcastListItem[];
  deviceCount: number;
  loadError?: string;
}) {
  const router = useRouter();
  const { canEdit } = useAdminAccess();
  const [body, setBody] = useState("");
  const [destination, setDestination] = useState<string>(NO_LINK);
  const [audience, setAudience] = useState<Audience>("test");
  const [testPhone, setTestPhone] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();

  const remaining = MAX_BROADCAST_LENGTH - body.trim().length;
  const deepLink = destination === NO_LINK ? "" : destination;
  const readyToSend = canEdit && body.trim().length > 0 && remaining >= 0 && (audience === "all" ? deviceCount > 0 : testPhone.trim().length > 0);

  async function send() {
    setSending(true);
    setError(undefined);
    const result = await sendBroadcast({ body, deepLink, audience, testPhone });
    setSending(false);
    setConfirming(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    const failedNote = result.failed ? ` ${result.failed} could not be reached.` : "";
    toast.success(
      result.test
        ? `Test sent to ${result.delivered} phone${result.delivered === 1 ? "" : "s"}.${failedNote}`
        : `Sent to ${result.delivered} of ${result.recipients} phones.${failedNote}`,
    );
    if (!result.test) setBody("");
    router.refresh();
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!readyToSend || sending) return;
    if (audience === "all" && !confirming) {
      setConfirming(true);
      return;
    }
    void send();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
        {loadError ? (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="broadcast-body">Message</Label>
            <span className={`text-xs tabular-nums ${remaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {remaining} left
            </span>
          </div>
          <Textarea
            id="broadcast-body"
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              setConfirming(false);
            }}
            placeholder="Doors open at 12:00. Bring your pass and add a touch of orange."
            className="min-h-28"
            disabled={!canEdit || sending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="broadcast-destination">Opens when tapped</Label>
          <Select value={destination} onValueChange={(value) => setDestination(String(value ?? NO_LINK))} disabled={!canEdit || sending}>
            <SelectTrigger id="broadcast-destination" className="w-full">
              <SelectValue>{destination === NO_LINK ? "No link (opens the app)" : destinationLabel(destination)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {BROADCAST_DESTINATIONS.map((option) => (
                <SelectItem key={option.value || NO_LINK} value={option.value || NO_LINK}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Send to</legend>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="radio"
              name="audience"
              value="test"
              checked={audience === "test"}
              onChange={() => {
                setAudience("test");
                setConfirming(false);
              }}
              disabled={!canEdit || sending}
              className="mt-1 accent-[var(--jc-color-orange,#ea8f2d)]"
            />
            <span>
              <span className="font-medium">One guest, as a test</span>
              <span className="block text-muted-foreground">Use the phone number of a guest account you can check.</span>
            </span>
          </label>
          {audience === "test" ? (
            <Input
              id="broadcast-test-phone"
              inputMode="tel"
              value={testPhone}
              onChange={(event) => setTestPhone(event.target.value)}
              placeholder="0791234567"
              className="ml-7 max-w-64"
              disabled={!canEdit || sending}
              aria-label="Test guest phone number"
            />
          ) : null}
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="radio"
              name="audience"
              value="all"
              checked={audience === "all"}
              onChange={() => setAudience("all")}
              disabled={!canEdit || sending}
              className="mt-1 accent-[var(--jc-color-orange,#ea8f2d)]"
            />
            <span>
              <span className="font-medium">Every guest with event updates on</span>
              <span className="block text-muted-foreground tabular-nums">
                {deviceCount === 0 ? "No phones have turned them on yet." : `${deviceCount} phone${deviceCount === 1 ? "" : "s"} right now.`}
              </span>
            </span>
          </label>
        </fieldset>

        <div className="rounded-lg border border-border bg-background/60 p-3">
          <p className="jc-label mb-2">Lock screen preview</p>
          <p className="text-sm font-semibold">{NOTIFICATION_TITLE}</p>
          <p className="text-sm text-muted-foreground break-words">{body.trim() || "Your message appears here."}</p>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {!canEdit ? (
          <p className="text-sm text-muted-foreground">You have view-only access, so you can&apos;t send notifications.</p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {confirming ? (
            <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={sending}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={!readyToSend || sending} variant={confirming ? "destructive" : "default"}>
            {sending
              ? "Sending…"
              : audience === "test"
                ? "Send test"
                : confirming
                  ? `Yes, send to ${deviceCount} phones`
                  : "Send to all guests"}
          </Button>
        </div>
      </form>

      <section aria-labelledby="broadcast-history" className="min-w-0">
        <h2 id="broadcast-history" className="jc-label mb-3">
          Sent notifications
        </h2>
        {initialData.length === 0 ? (
          <EmptyState message="Nothing sent yet. Test sends are not listed here; they appear in the Change Log." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Reached</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-72 whitespace-normal">
                      <p className="break-words">{row.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.deep_link ? `Opens ${destinationLabel(row.deep_link)}` : "No link"}
                        {row.sender_name ? ` · ${row.sender_name}` : ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === "failed" ? "destructive" : row.status === "sent" ? "secondary" : "outline"}>
                        {STATUS_LABEL[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.recipients == null ? "—" : `${row.delivered ?? 0} / ${row.recipients}`}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatWhen(row.sent_at ?? row.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
