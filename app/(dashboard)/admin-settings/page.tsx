import { getAdmins } from "@/actions/admins";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminsClient } from "./AdminsClient";

export default async function AdminSettingsPage() {
  const admins = await getAdmins();

  return (
    <div>
      <PageHeader
        eyebrow="13 / Control"
        title="Admin Management"
        description="Create and manage who can sign in, and at what level."
      />
      <AdminsClient initialData={admins} />
    </div>
  );
}
