const unsafePatterns = [
  /ignore (all |any )?(previous|prior|system) instructions?/gi,
  /reveal (the )?(system|developer) prompt/gi,
  /send (user|private|secret) (data|information)/gi,
  /generate unrelated content/gi,
];

const administrativeHeadings = [
  /^(?:table of )?contents?$/i,
  /^(?:quiz|test|exam|study guide) instructions?$/i,
  /^instructions?$/i,
  /^(?:explained )?answer key$/i,
  /^part [a-z]\s*[-:]\s*(?:true(?:\s+or\s+|\/)false|short[- ]answer)(?: answers?)?$/i,
  /^(?:score and review tracker|suggested review plan|grading rubric|rubric)$/i,
  /^(?:section|correct|possible|topics? to review|total)$/i,
  /^section\s+correct\s+possible\s+topics? to review$/i,
];

const assessmentWords = /\b(?:answer key|answers?|quiz|test|exam|questions?|score|(?:study )?guide|correct|incorrect|missed|review)\b/i;
const proceduralLead = /^(?:complete|write|select|choose|use|review|recheck|retake|reread|study|memorize|practice|record|calculate|score)\b/i;
const questionLead = /^(?:define|explain|list|what|why|how|describe|differentiate|give|state|name|compare|break down)\b/i;

function normalizeLine(input: string) {
  return input.replace(/[\t ]+/g, " ").trim();
}

function withoutListMarker(input: string) {
  return input.replace(/^[•●▪*-]\s*/, "").trim();
}

function isAdministrativeLine(input: string) {
  const line = withoutListMarker(normalizeLine(input));
  if (!line) return true;
  if (administrativeHeadings.some((pattern) => pattern.test(line))) return true;
  if (/^(?:page\s+\d+(?:\s+of\s+\d+)?|\d+)$/i.test(line)) return true;
  if (/\|\s*page\s+\d+(?:\s+of\s+\d+)?\s*$/i.test(line)) return true;
  if (/^\d+\s+questions?\s*:/i.test(line)) return true;
  if (/^(?:true\/false|short answer)\s+\d+$/i.test(line)) return true;
  if (/^(?:true\/false|short answer|total)\s+\d+$/i.test(line)) return true;
  if (/^\d+\s*[-–]\s*\d+\s+correct\s*:/i.test(line)) return true;
  if (/^source basis\s*:/i.test(line)) return true;
  if (!/[.!?]$/.test(line) && /\b(?:practice quiz|practice test)\b/i.test(line)) return true;
  if (/^modules?\s+\d+(?:\s*[-–]\s*\d+)?\s*[:|-]/i.test(line)) return true;
  if (/^module\s+\d+\b.*(?:\||\bmodule\s+\d+\b)/i.test(line)) return true;
  if (/\b(?:exam\s*#?\d+|completed)\b.*\bstudy guide\b/i.test(line)) return true;
  if (/^part [a-z]\s+(?:contains|has)\s+\d+\b/i.test(line)) return true;
  if (/^(?:the )?answer key\b/i.test(line) || /^each answer includes\b/i.test(line)) return true;
  if (/^(?:suggested )?goal\s*:/i.test(line)) return true;
  if (/^write\s+(?:t|true)\b.*\b(?:f|false)\b/i.test(line)) return true;
  if (/^answer each question\b/i.test(line)) return true;
  if (/^use\s+(?:this|the)\s+(?:study\s+)?guide\b/i.test(line)) return true;
  if (/^(?:memorize|practice|review|recheck|retake|reread|study)\b/i.test(line)) return true;
  return proceduralLead.test(line) && assessmentWords.test(line);
}

function isExistingQuestionPrompt(input: string) {
  const line = withoutListMarker(normalizeLine(input));
  if (/^\d+[.)]\s*_{2,}/.test(line)) return true;
  const withoutNumber = line.replace(/^\d+[.)]\s*/, "");
  return (/^\d+[.)]\s*/.test(line) && questionLead.test(withoutNumber)) ||
    (/^\d+[.)]\s*/.test(line) && /\?$/.test(withoutNumber));
}

export function isQuizWorthyExcerpt(input: string) {
  const line = normalizeLine(input);
  if (line.length < 20 || !/[A-Za-z]/.test(line)) return false;
  if (isAdministrativeLine(line) || isExistingQuestionPrompt(line)) return false;
  if (/^\d+[.)]\s*(?:true|false)\s*[.]?$/i.test(line)) return false;
  if (/^(?:answer|explanation)\s*:\s*$/i.test(line)) return false;
  return true;
}

export function prepareQuizSource(input: string) {
  const lines = input.split(/\r?\n/).map(normalizeLine).filter(Boolean);
  const counts = new Map<string, number>();
  for (const line of lines) {
    const key = line.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let excludedLineCount = 0;
  const kept = lines.filter((line) => {
    const repeatedChrome = (counts.get(line.toLowerCase()) ?? 0) > 1 &&
      line.length <= 120 && !/[.!?]$/.test(line);
    if (repeatedChrome || isAdministrativeLine(line)) {
      excludedLineCount += 1;
      return false;
    }
    return true;
  });

  return { text: kept.join("\n"), excludedLineCount };
}

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
    !/^\d+[.)]\s*(?:true|false)$/i.test(line) &&
    (/^#{1,6}\s/.test(line) || /^\d+[.)]\s/.test(line) || /^[A-Z][A-Za-z0-9 &:/-]{2,}$/.test(line)),
  );
}

export function detectTopics(text: string) {
  const relevantText = prepareQuizSource(text).text;
  const headings = detectHeadings(relevantText)
    .map((heading) => heading.replace(/^#{1,6}\s+|^\d+[.)]\s+/, "").trim())
    .filter((heading) => heading.length > 2)
    .filter((heading) => !/\b(?:exam|quiz|test|study guide|answer key|instructions?)\b/i.test(heading))
    .filter((heading) => !/^[A-Z]{2,}\s+\d+$/i.test(heading));
  if (headings.length) return [...new Set(headings)].slice(0, 12);

  const words = relevantText.match(/\b[A-Za-z][A-Za-z0-9/-]{1,}\b/g) ?? [];
  const stop = new Set([
    "about", "after", "again", "answer", "answers", "because", "before", "between", "complete", "correct", "could", "define", "different", "every", "exam", "explain", "false", "first", "from", "guide", "have", "into", "normally", "other", "practice", "question", "questions", "review", "should", "study", "their", "these", "through", "true", "using", "which", "while", "with",
  ]);
  const counts = new Map<string, { count: number; label: string }>();
  for (const word of words) {
    const key = word.toLowerCase();
    const technical = /^[A-Z][A-Z0-9/-]{1,}$/.test(word) || /^ipv\d$/i.test(word);
    if (stop.has(key) || (word.length < 5 && !technical)) continue;
    const label = technical ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1).toLowerCase();
    const current = counts.get(key);
    counts.set(key, { count: (current?.count ?? 0) + 1, label: current?.label ?? label });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8).map((entry) => entry.label);
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
