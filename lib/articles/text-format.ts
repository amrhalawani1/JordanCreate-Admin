/**
 * Plain-text editing formats for community articles. The website stores an
 * article body as structured blocks (the same shape as its ArticleBlock
 * schema); editors write it as a small Markdown subset in one textarea.
 * Every function here is pure and round-trips: parse(serialize(x)) === x.
 *
 * Body
 *   Blocks are separated by a blank line.
 *   ## Heading            -> { type: "h2", text }
 *   - item / * item       -> { type: "list", items }   (one item per line)
 *   > quote text          -> { type: "quote", text, cite? }
 *   > — Who said it       -> the quote's cite (last line, starts with a dash)
 *   anything else         -> { type: "p", text }        (lines joined by a space)
 *   A paragraph that must start with "## ", "- ", "* " or "> " is written
 *   with a leading backslash, e.g. "\- not a list".
 *
 * FAQ
 *   Q: question
 *   A: answer
 *   (blank line between pairs; extra lines continue the current Q or A)
 *
 * Key takeaways: one per line ("- " bullets are optional).
 */

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string; cite?: string };

export type ArticleFaq = { question: string; answer: string };

const LIST_LINE = /^[-*]\s+/;
const QUOTE_LINE = /^>\s?/;
const CITE_LINE = /^[—–-]{1,2}\s*(.+)$/;
const RESERVED_START = /^(## |[-*] |> )/;

function splitBlocks(text: string): string[][] {
  const groups: string[][] = [];
  let current: string[] = [];
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (line === "") {
      if (current.length) groups.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

const joinLines = (lines: string[]) => lines.join(" ").replace(/\s+/g, " ").trim();

export function parseArticleBody(text: string): ArticleBlock[] {
  return splitBlocks(text).map((lines): ArticleBlock => {
    const first = lines[0];

    if (first.startsWith("## ") || first === "##") {
      return { type: "h2", text: joinLines([first.replace(/^##\s*/, ""), ...lines.slice(1)]) };
    }

    if (LIST_LINE.test(first)) {
      const items: string[] = [];
      for (const line of lines) {
        if (LIST_LINE.test(line)) items.push(line.replace(LIST_LINE, "").trim());
        else if (items.length) items[items.length - 1] = `${items[items.length - 1]} ${line}`.trim();
      }
      return { type: "list", items: items.filter(Boolean) };
    }

    if (QUOTE_LINE.test(first)) {
      const quoteLines = lines.map((line) => line.replace(QUOTE_LINE, "").trim());
      const last = quoteLines[quoteLines.length - 1];
      const cite = quoteLines.length > 1 ? CITE_LINE.exec(last)?.[1]?.trim() : undefined;
      const textLines = cite ? quoteLines.slice(0, -1) : quoteLines;
      const block: ArticleBlock = { type: "quote", text: joinLines(textLines) };
      if (cite) block.cite = cite;
      return block;
    }

    const textValue = joinLines(lines);
    return { type: "p", text: textValue.startsWith("\\") ? textValue.slice(1) : textValue };
  });
}

export function serializeArticleBody(blocks: readonly ArticleBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "h2":
          return `## ${block.text}`;
        case "list":
          return block.items.map((item) => `- ${item}`).join("\n");
        case "quote":
          return block.cite ? `> ${block.text}\n> — ${block.cite}` : `> ${block.text}`;
        default:
          return RESERVED_START.test(block.text) || block.text.startsWith("\\") ? `\\${block.text}` : block.text;
      }
    })
    .join("\n\n");
}

export function parseArticleFaq(text: string): ArticleFaq[] {
  const out: { question: string; answer: string }[] = [];
  let field: "question" | "answer" | null = null;
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (line === "") continue;
    const q = /^q[:.]\s*(.*)$/i.exec(line);
    const a = /^a[:.]\s*(.*)$/i.exec(line);
    if (q) {
      out.push({ question: q[1].trim(), answer: "" });
      field = "question";
    } else if (a && out.length) {
      out[out.length - 1].answer = `${out[out.length - 1].answer} ${a[1]}`.trim();
      field = "answer";
    } else if (field && out.length) {
      out[out.length - 1][field] = `${out[out.length - 1][field]} ${line}`.trim();
    } else {
      // Text before the first "Q:" is treated as a question so nothing is lost.
      out.push({ question: line, answer: "" });
      field = "question";
    }
  }
  return out;
}

export function serializeArticleFaq(faq: readonly ArticleFaq[]): string {
  return faq.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n");
}

export function parseLines(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*•]\s+)?/, "").trim())
    .filter(Boolean);
}

export function serializeLines(lines: readonly string[]): string {
  return lines.join("\n");
}
