import { adminViewOnlyLevelReady, getAdmins } from "@/actions/admins";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminLevelSetup } from "@/components/shared/AdminLevelSetup";
import { AdminsClient } from "./AdminsClient";

export default async function AdminSettingsPage() {
  const [admins, viewOnlyReady] = await Promise.all([getAdmins(), adminViewOnlyLevelReady()]);

  return (
    <div>
      <PageHeader
        eyebrow="15 / Control"
        title="Admin Management"
        description="Create and manage who can sign in, and at what level."
      />
      {viewOnlyReady ? null : <AdminLevelSetup />}
      <AdminsClient initialData={admins} />
    </div>
  );
}
