import { getFaqEntries } from "@/actions/faq-entries";
import { FaqEntriesClient } from "./FaqEntriesClient";

export default async function FaqPage() {
  const entries = await getFaqEntries();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">FAQ</h1>
        <p className="text-sm text-muted-foreground">
          Frequently asked questions the bot answers, in display order.
        </p>
      </div>
      <FaqEntriesClient initialData={entries} />
    </div>
  );
}
