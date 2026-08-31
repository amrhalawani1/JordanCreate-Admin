import type { EntityConfig, FieldConfig } from "@/lib/entity-configs/types";

export interface HtmlExportColumn {
  key: string;
  header: string;
}

export interface HtmlExportTable {
  caption?: string;
  columns: HtmlExportColumn[];
  rows: Record<string, unknown>[];
}

export interface HtmlExportDocument {
  title: string;
  fileStem: string;
  tables: HtmlExportTable[];
}

const SKIP_EXPORT_FIELDS = new Set(["password"]);

export function formatExportValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => formatExportValue(item)).join(", ") : "—";
  }
  if (typeof value === "object") return JSON.stringify(value);
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const date = new Date(str);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }
  }
  return str;
}

export function formatExportTimestamp(date = new Date()): { display: string; fileStamp: string } {
  const display = date.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
  const pad = (n: number) => String(n).padStart(2, "0");
  const fileStamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  return { display, fileStamp };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function columnsForHtmlExport<Row>(config: EntityConfig<Row>): HtmlExportColumn[] {
  const seen = new Set<string>();
  const columns: HtmlExportColumn[] = [];

  for (const field of config.formFields) {
    if (field.type === "password" || SKIP_EXPORT_FIELDS.has(field.name)) continue;
    seen.add(field.name);
    columns.push({ key: field.name, header: field.label });
  }

  for (const column of config.columns) {
    if (seen.has(column.key)) continue;
    seen.add(column.key);
    columns.push({ key: column.key, header: column.header });
  }

  return columns;
}

export function rowsForHtmlExport<Row extends Record<string, unknown>>(
  config: EntityConfig<Row>,
  data: Row[],
): Record<string, unknown>[] {
  const columns = columnsForHtmlExport(config);
  const labelsByKey = new Map(
    config.formFields
      .filter((field) => field.enumLabels)
      .map((field) => [field.name, field.enumLabels] as const),
  );

  return data.map((row) => {
    const out: Record<string, unknown> = {};
    for (const column of columns) {
      const raw = row[column.key];
      const labels = labelsByKey.get(column.key);
      out[column.key] =
        typeof raw === "string" && labels?.[raw] ? labels[raw] : raw;
    }
    return out;
  });
}

export function fieldValueTable<Row>(
  fields: FieldConfig<Row>[],
  values: Row,
  extra: Array<{ label: string; value: unknown }> = [],
): HtmlExportTable {
  const rows = [
    ...fields
      .filter((field) => field.type !== "password" && !SKIP_EXPORT_FIELDS.has(field.name))
      .map((field) => ({
        field: field.label,
        value: (values as Record<string, unknown>)[field.name],
      })),
    ...extra.map((item) => ({ field: item.label, value: item.value })),
  ];

  return {
    columns: [
      { key: "field", header: "Field" },
      { key: "value", header: "Value" },
    ],
    rows,
  };
}

function renderTable(table: HtmlExportTable): string {
  const caption = table.caption
    ? `<h2>${escapeHtml(table.caption)}</h2>`
    : "";

  if (table.rows.length === 0) {
    return `${caption}<p class="empty">No rows in this export.</p>`;
  }

  const head = table.columns
    .map((column) => `<th>${escapeHtml(column.header)}</th>`)
    .join("");
  const body = table.rows
    .map((row) => {
      const cells = table.columns
        .map(
          (column) =>
            `<td>${escapeHtml(formatExportValue(row[column.key]))}</td>`,
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `${caption}<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function buildExportHtml(
  doc: HtmlExportDocument,
  exportedAt = new Date(),
): { html: string; filename: string } {
  const { display, fileStamp } = formatExportTimestamp(exportedAt);
  const filename = `jordan-create-${doc.fileStem}-${fileStamp}.html`;
  const rowCount = doc.tables.reduce((sum, table) => sum + table.rows.length, 0);
  const tablesMarkup = doc.tables.map(renderTable).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Jordan Create — ${escapeHtml(doc.title)}</title>
  <style>
    :root {
      --canvas: #f6f3ee;
      --ink: #141414;
      --muted: #5c5c5c;
      --line: #d8d2c8;
      --orange: #ea8f2d;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--canvas);
      color: var(--ink);
      font-family: "DM Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
      line-height: 1.5;
      padding: 48px 40px 64px;
    }
    header {
      border-bottom: 1px solid var(--line);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .eyebrow {
      margin: 0 0 10px;
      color: var(--orange);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      font-family: "Playfair Display", Georgia, "Times New Roman", serif;
      font-size: 42px;
      font-weight: 500;
      letter-spacing: -0.03em;
      line-height: 1.05;
    }
    .meta {
      margin: 14px 0 0;
      color: var(--muted);
      font-size: 14px;
    }
    h2 {
      margin: 36px 0 12px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--orange);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    th {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      white-space: nowrap;
    }
    tr:nth-child(even) td { background: rgba(20, 20, 20, 0.03); }
    .empty { color: var(--muted); font-size: 14px; }
    @media print {
      body { padding: 0; background: white; }
      header { border-bottom-color: #ccc; }
    }
  </style>
</head>
<body>
  <header>
    <p class="eyebrow">Jordan Create Admin &amp; Registry</p>
    <h1>${escapeHtml(doc.title)}</h1>
    <p class="meta">Exported ${escapeHtml(display)} · ${rowCount} ${rowCount === 1 ? "row" : "rows"}</p>
  </header>
  ${tablesMarkup}
</body>
</html>
`;

  return { html, filename };
}

export function downloadHtmlExport(doc: HtmlExportDocument): void {
  const { html, filename } = buildExportHtml(doc);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
