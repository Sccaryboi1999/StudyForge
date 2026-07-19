import { Quiz, QuizQuestion, QuizSettings, quizSchema } from "@/lib/types";
import { detectHeadings } from "@/lib/processing";

type Fact = { subject: string; detail: string; sentence: string; topic: string; index: number };

function hashId(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

function splitFacts(text: string): Fact[] {
  const headings = new Set(detectHeadings(text));
  let topic = headings.values().next().value ?? "Core concepts";
  const facts: Fact[] = [];
  for (const line of text.split(/\r?\n/).map((v) => v.trim()).filter(Boolean)) {
    if (headings.has(line)) { topic = line.replace(/^#+\s*/, ""); continue; }
    for (const sentence of line.split(/(?<=[.!?])\s+/)) {
      const clean = sentence.trim();
      if (clean.length < 28 || clean.length > 380) continue;
      const match = clean.match(/^(.{2,75}?)\s+(?:is|are|means|refers to|provides|connects|identifies|organizes|forwards|uses)\s+(.{8,})[.]?$/i);
      const subject = match?.[1]?.trim() ?? clean.split(/[,;:]/)[0].trim();
      const detail = match?.[2]?.replace(/[.]$/, "").trim() ?? clean.replace(/[.]$/, "");
      facts.push({ subject, detail, sentence: clean, topic, index: text.indexOf(clean) });
    }
  }
  return facts;
}

function difficultyAt(setting: QuizSettings["difficulty"], index: number): "easy" | "medium" | "hard" {
  if (setting === "mixed" || setting === "adaptive") return (["easy", "medium", "hard"] as const)[index % 3];
  return setting;
}

function makeQuestion(fact: Fact, all: Fact[], index: number, type: QuizSettings["questionTypes"][number], difficulty: QuizSettings["difficulty"]): QuizQuestion {
  const source = fact.sentence;
  const displaySubject = fact.subject.replace(/^(a|an|the)\s+/i, "");
  const base = {
    id: `q_${hashId(`${fact.sentence}-${index}-${type}`)}`,
    topic: fact.topic,
    difficulty: difficultyAt(difficulty, index),
    explanation: `The study guide states: “${source}”`,
    hint: `Look in the ${fact.topic} section and focus on ${displaySubject}.`,
    sourceSection: fact.topic,
    sourceExcerpt: source,
    sourceStartIndex: Math.max(0, fact.index),
    sourceEndIndex: Math.max(1, fact.index + source.length),
    points: difficultyAt(difficulty, index) === "hard" ? 2 : 1,
  };
  const otherDetails = all.filter((item) => item.detail !== fact.detail).map((item) => item.detail).filter((v) => v.length < 130);
  const choices = [fact.detail, ...otherDetails.slice(index % Math.max(1, otherDetails.length), index % Math.max(1, otherDetails.length) + 3)];
  while (choices.length < 4) choices.push(["It is not described in the guide", "It replaces every other concept", "It has no defined purpose"][choices.length - 1]);
  const rotated = [...choices.slice(index % 4), ...choices.slice(0, index % 4)];

  if (type === "true_false") return { ...base, type, question: `True or false: ${source}`, choices: ["True", "False"], correctAnswer: "True" };
  if (type === "fill_blank") return { ...base, type, question: `${fact.subject} ________.`, correctAnswer: fact.detail, acceptedAnswers: [fact.detail, source] };
  if (type === "short_answer" || type === "scenario") return {
    ...base,
    type,
    question: type === "scenario" ? `A classmate asks you to explain ${displaySubject}. Based only on the guide, what would you say?` : `According to the guide, what is important to know about ${displaySubject}?`,
    correctAnswer: fact.detail,
    acceptedAnswers: [fact.detail, source],
  };
  return { ...base, type: "multiple_choice", question: `Which statement about ${displaySubject} is supported by the study guide?`, choices: rotated, correctAnswer: fact.detail, explanation: `The source directly supports “${fact.detail}.” The other choices describe different concepts or are not supported as statements about ${displaySubject}.` };
}

function seededShuffle<T>(items: T[]) {
  return items.map((item, index) => ({ item, key: hashId(`${index}-${JSON.stringify(item)}`) })).sort((a, b) => a.key.localeCompare(b.key)).map(({ item }) => item);
}

export function generateLocalQuiz(title: string, text: string, settings: QuizSettings): Quiz {
  let facts = splitFacts(text).filter((fact) => !settings.selectedTopics.length || settings.selectedTopics.includes(fact.topic));
  const unique = new Map(facts.map((fact) => [fact.sentence.toLowerCase(), fact]));
  facts = [...unique.values()];
  if (!facts.length) throw new Error("The selected source does not contain enough clear statements to build a quiz.");
  const count = Math.min(settings.questionCount, facts.length);
  let questions = facts.slice(0, count).map((fact, index) => makeQuestion(fact, facts, index, settings.questionTypes[index % settings.questionTypes.length], settings.difficulty));
  if (settings.shuffleChoices) questions = questions.map((q) => q.choices ? { ...q, choices: seededShuffle(q.choices) } : q);
  if (settings.shuffleQuestions) questions = seededShuffle(questions);
  return quizSchema.parse({
    id: `quiz_${Date.now().toString(36)}`,
    title: `${title} Practice Quiz`,
    studyGuideTitle: title,
    createdAt: new Date().toISOString(),
    mode: settings.mode,
    difficulty: settings.difficulty,
    strictSource: settings.strictSource,
    settings: {
      questionCount: settings.questionCount,
      questionTypes: settings.questionTypes,
      selectedTopics: settings.selectedTopics,
      shuffleQuestions: settings.shuffleQuestions,
      shuffleChoices: settings.shuffleChoices,
      allowHints: settings.allowHints,
      allowSkipping: settings.allowSkipping,
      allowChanges: settings.allowChanges,
      showSources: settings.showSources,
      feedback: settings.feedback,
      timerMinutes: settings.timerMinutes,
    },
    questions,
    generationNote: count < settings.questionCount ? `Generated ${count} well-supported questions instead of ${settings.questionCount}; the source did not contain enough distinct facts.` : "All questions were generated from clear statements in the source.",
  });
}
