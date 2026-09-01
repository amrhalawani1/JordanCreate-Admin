"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadHtmlExport, type HtmlExportTable } from "@/lib/export-html";
import { cn } from "@/lib/utils";

export function ExportButton({
  title,
  fileStem,
  tables,
  className,
}: {
  title: string;
  fileStem: string;
  tables: HtmlExportTable[];
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full sm:w-auto", className)}
      onClick={() => downloadHtmlExport({ title, fileStem, tables })}
    >
      <Download />
      Export
    </Button>
  );
}
