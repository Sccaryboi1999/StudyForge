const unsafePatterns = [
  /ignore (all |any )?(previous|prior|system) instructions?/gi,
  /reveal (the )?(system|developer) prompt/gi,
  /send (user|private|secret) (data|information)/gi,
  /generate unrelated content/gi,
];

export function sanitizeStudyText(input: string) {
  let text = input.replace(/\u0000/g, "").replace(/<script[\s\S]*?<\/script>/gi, "");
  const warnings: string[] = [];
  for (const pattern of unsafePatterns) {
    if (pattern.test(text)) {
      warnings.push("Potential prompt-injection language was treated as study content and neutralized.");
      text = text.replace(pattern, "[untrusted instruction removed]");
    }
  }
  return { text: text.trim(), warnings: [...new Set(warnings)] };
}

export function detectHeadings(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.filter((line) =>
    line.length < 90 &&
    !/[.!?]$/.test(line) &&
    (/^#{1,6}\s/.test(line) || /^\d+[.)]\s/.test(line) || /^[A-Z][A-Za-z0-9 &:/-]{2,}$/.test(line)),
  );
}

export function detectTopics(text: string) {
  const headings = detectHeadings(text)
    .map((heading) => heading.replace(/^#{1,6}\s+|^\d+[.)]\s+/, "").trim())
    .filter((heading) => heading.length > 2);
  if (headings.length) return [...new Set(headings)].slice(0, 12);

  const words = text.toLowerCase().match(/[a-z][a-z-]{4,}/g) ?? [];
  const stop = new Set(["about", "after", "again", "because", "before", "between", "could", "different", "every", "first", "from", "have", "into", "other", "should", "their", "these", "through", "using", "which", "while", "with"]);
  const counts = words.reduce<Record<string, number>>((acc, word) => {
    if (!stop.has(word)) acc[word] = (acc[word] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([word]) => word[0].toUpperCase() + word.slice(1));
}

export function studyMetadata(text: string) {
  const clean = sanitizeStudyText(text);
  return {
    text: clean.text,
    warnings: clean.warnings,
    wordCount: clean.text ? clean.text.split(/\s+/).length : 0,
    characterCount: clean.text.length,
    headingCount: detectHeadings(clean.text).length,
    topics: detectTopics(clean.text),
  };
}

export function sectionForExcerpt(text: string, excerpt: string) {
  const index = text.indexOf(excerpt);
  const before = text.slice(0, Math.max(0, index)).split(/\r?\n/).filter(Boolean);
  return before.reverse().find((line) => detectHeadings(line).length > 0) ?? "Study guide";
}
