import { getFaqEntries } from "@/actions/faq-entries";
import { PageHeader } from "@/components/layout/PageHeader";
import { FaqEntriesClient } from "./FaqEntriesClient";

export default async function FaqPage() {
  const entries = await getFaqEntries();

  return (
    <div>
      <PageHeader
        title="FAQ"
        description="Frequently asked questions the app and bot answer, in display order."
      />
      <FaqEntriesClient initialData={entries} />
    </div>
  );
}
