import { NextRequest, NextResponse } from "next/server";
import { studyMetadata } from "@/lib/processing";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024;
const allowed = new Set(["txt", "md", "markdown", "pdf", "docx"]);

function structuredPdfText(items: unknown[]) {
  const lines: string[] = [];
  let current = "";
  for (const item of items) {
    if (!item || typeof item !== "object" || !("str" in item)) continue;
    const textItem = item as { str?: string; hasEOL?: boolean };
    const value = textItem.str?.replace(/\s+/g, " ").trim() ?? "";
    if (value) current += `${current ? " " : ""}${value}`;
    if (textItem.hasEOL && current) {
      lines.push(current);
      current = "";
    }
  }
  if (current) lines.push(current);

  const reflowed: string[] = [];
  for (const line of lines) {
    const previous = reflowed.at(-1);
    if (previous && !/[.!?:;]$/.test(previous) && /^[a-z(]/.test(line)) {
      reflowed[reflowed.length - 1] = `${previous} ${line}`;
    } else {
      reflowed.push(line);
    }
  }
  return reflowed.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to extract." }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "That file is larger than the 10 MB upload limit." }, { status: 413 });
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowed.has(extension)) return NextResponse.json({ error: "Unsupported file. Upload TXT, Markdown, PDF, or DOCX." }, { status: 415 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    let text = "";
    const warnings: string[] = [];

    if (["txt", "md", "markdown"].includes(extension)) {
      text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } else if (extension === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      text = result.value;
      warnings.push(...result.messages.map((message) => message.message));
    } else {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const document = await pdfjs.getDocument({ data: bytes, useSystemFonts: true }).promise;
        const pages: string[] = [];
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
          const page = await document.getPage(pageNumber);
          const content = await page.getTextContent();
          pages.push(structuredPdfText(content.items));
        }
        text = pages.join("\n\n");
        if (text.trim().length < 80) warnings.push("Very little text was detected. This PDF may contain scanned images and require OCR.");
      } catch {
        return NextResponse.json({ error: "This PDF could not be read. It may be corrupted, scanned, or password-protected." }, { status: 422 });
      }
    }

    const metadata = studyMetadata(text);
    if (metadata.wordCount < 12) return NextResponse.json({ error: "The file did not contain enough readable study material." }, { status: 422 });
    return NextResponse.json({
      fileName: file.name,
      fileType: extension === "markdown" ? "md" : extension,
      ...metadata,
      warnings: [...warnings, ...metadata.warnings].filter(Boolean).slice(0, 8),
    });
  } catch {
    return NextResponse.json({ error: "Text extraction failed. Please retry or paste the material instead." }, { status: 500 });
  }
}
