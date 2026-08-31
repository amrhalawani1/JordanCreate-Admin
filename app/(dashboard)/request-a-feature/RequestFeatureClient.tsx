"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { featureRequestConfig } from "@/lib/entity-configs/feature-requests";
import { createFeatureRequest, deleteFeatureRequest } from "@/actions/feature-requests";
import type { FeatureRequestListItem } from "@/types/entities";
import { FeatureRequestDialog } from "./FeatureRequestDialog";

export function RequestFeatureClient({
  initialData,
  loadError,
  compose,
}: {
  initialData: FeatureRequestListItem[];
  loadError?: string;
  compose: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  function closeCompose() {
    setSubmitError(undefined);
    router.push("/request-a-feature");
  }

  async function handleSubmit(values: { title: string; description: string }) {
    setSubmitting(true);
    setSubmitError(undefined);
    const result = await createFeatureRequest(values);
    setSubmitting(false);
    if (!result.success) {
      setSubmitError(result.error);
      return;
    }
    toast.success("Feature request submitted.");
    router.push("/request-a-feature");
    router.refresh();
  }

  return (
    <div>
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-4 flex justify-end">
        <Link
          href="/request-a-feature?compose=1"
          className="inline-flex h-9 items-center rounded-full bg-orange px-5 text-xs font-medium uppercase tracking-[0.12em] text-[#0a0a0a] hover:bg-orange-hot"
        >
          Request a Feature
        </Link>
      </div>

      <DataTable
        config={featureRequestConfig}
        data={initialData}
        onRowClick={() => undefined}
        onDelete={(row) => deleteFeatureRequest(row.id)}
        onDeleted={() => {
          toast.success("Feature request deleted.");
          router.refresh();
        }}
        emptyMessage="No requests yet. Request a feature to get started."
      />

      <FeatureRequestDialog
        open={compose}
        onOpenChange={(next) => {
          if (!next) closeCompose();
        }}
        submitting={submitting}
        error={submitError}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
