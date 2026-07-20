import { Quiz, QuizQuestion, QuizSettings, quizSchema } from "@/lib/types";
import { detectHeadings, isQuizWorthyExcerpt, prepareQuizSource } from "@/lib/processing";

type Fact = { subject: string; detail: string; sentence: string; topic: string; index: number };

const questionLead = /^(?:define|explain|list|what|why|how|describe|differentiate|give|state|name|compare|break down)\b/i;
const factualPredicate = /\b(?:is|are|was|were|has|have|means?|refers?|provides?|connects?|identifies?|organizes?|forwards?|uses?|reports?|supports?|prevents?|allows?|advertises?|establishes?|sends?|measures?|combines?|maps?|retrieves?|submits?|creates?|remains?|includes?|describes?|adjusts?|exposes?|stores?|accesses?|relies?|produces?|converts?|controls?|changes?|shows?|requires?|occurs?|works?|transfers?|routes?|blocks?|breaks?|determines?|calculates?|differs?|causes?|affects?|proves?|verifies?|tests?|helps?|can|may|must|will)\b/i;

function hashId(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

function splitFacts(text: string): Fact[] {
  const prepared = prepareQuizSource(text).text;
  const lines = prepared.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  const headings = new Set(detectHeadings(prepared));
  const promptByNumber = new Map<number, string>();

  for (const line of lines) {
    const numbered = line.match(/^(\d+)[.)]\s*(.+)$/);
    if (!numbered) continue;
    const prompt = numbered[2].replace(/^_{2,}\s*/, "").trim();
    if (numbered[2].startsWith("_") || questionLead.test(prompt) || /\?$/.test(prompt)) {
      promptByNumber.set(Number(numbered[1]), prompt);
    }
  }

  let topic = headings.values().next().value ?? "Core concepts";
  let questionContext = "";
  let pendingAnswerValue = false;
  const facts: Fact[] = [];
  for (const line of lines) {
    if (headings.has(line)) {
      topic = line.replace(/^#+\s*/, "");
      continue;
    }

    let factLine = line;
    const combinedAnswer = line.match(/^(\d+)[.)]\s*(?:true|false)\s+(.+)$/i);
    const authoritativeAnswer = Boolean(combinedAnswer) || /^(?:answer|explanation)\s*:/i.test(line) || pendingAnswerValue;
    if (combinedAnswer) {
      questionContext = promptByNumber.get(Number(combinedAnswer[1])) ?? "";
      factLine = combinedAnswer[2].trim();
    }

    const answerLabel = line.match(/^(\d+)[.)]\s*(?:true|false)\s*[.]?$/i);
    if (answerLabel) {
      questionContext = promptByNumber.get(Number(answerLabel[1])) ?? "";
      pendingAnswerValue = true;
      continue;
    }

    const numbered = combinedAnswer ? null : line.match(/^(\d+)[.)]\s*(.+)$/);
    if (numbered) {
      const prompt = numbered[2].replace(/^_{2,}\s*/, "").trim();
      if (numbered[2].startsWith("_") || questionLead.test(prompt) || /\?$/.test(prompt)) {
        questionContext = prompt;
        pendingAnswerValue = false;
        continue;
      }
    }

    const answerText = factLine.replace(/^(?:answer|explanation)\s*:\s*/i, "").trim();
    for (const sentence of answerText.split(/(?<=[.!?])\s+/)) {
      const clean = sentence.trim();
      if (clean.length > 380 || !isQuizWorthyExcerpt(clean)) continue;
      const match = clean.match(/^(.{2,90}?)\s+(is|are|means|refers to|provides|connects|identifies|organizes|forwards|uses|reports|supports|prevents|allows|advertises|establishes|sends|measures|combines|maps|retrieves|submits|creates|remains|includes|describes|adjusts|exposes|stores|accesses|relies on|proves|verifies|tests|may|can|must|helps)\s+(.{8,})[.]?$/i);
      if (!authoritativeAnswer && !factualPredicate.test(clean)) continue;
      let subject = match?.[1]?.trim() ?? clean.split(/[,;:]/)[0].trim();
      const relation = match?.[2]?.toLowerCase();
      const detail = match
        ? `${relation && !["is", "are", "means", "refers to"].includes(relation) ? `${match[2]} ` : ""}${match[3]}`.replace(/[.]$/, "").trim()
        : clean.replace(/[.]$/, "");

      if (/^(?:it|they|this|these|those|the (?:source|packet|client|server))$/i.test(subject) && questionContext) {
        const contextMatch = questionContext.match(/^(.{2,75}?)\s+(?:(?:normally|primarily)\s+)?(?:is|are|does|uses|makes|proves|verifies|identifies|reports|tests)\b/i);
        subject = contextMatch?.[1]?.trim() ?? questionContext.replace(/[?.]$/, "").slice(0, 75);
      }

      const technicalTopic = clean.match(/\b(?:IPv[46]|[A-Z][A-Z0-9/-]{1,9})\b/)?.[0];
      facts.push({
        subject,
        detail,
        sentence: clean,
        topic: technicalTopic ?? topic,
        index: Math.max(0, text.indexOf(clean)),
      });
    }
    if (pendingAnswerValue) pendingAnswerValue = false;
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
    explanation: `The study guide states: "${source}"`,
    hint: `Look in the ${fact.topic} section and focus on ${displaySubject}.`,
    sourceSection: fact.topic,
    sourceExcerpt: source,
    sourceStartIndex: fact.index,
    sourceEndIndex: Math.max(1, fact.index + source.length),
    points: difficultyAt(difficulty, index) === "hard" ? 2 : 1,
  };
  const otherDetails = all.filter((item) => item.detail !== fact.detail).map((item) => item.detail).filter((value) => value.length < 130);
  const start = index % Math.max(1, otherDetails.length);
  const choices = [fact.detail, ...otherDetails.slice(start, start + 3)];
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
  return { ...base, type: "multiple_choice", question: `Which statement about ${displaySubject} is supported by the study guide?`, choices: rotated, correctAnswer: fact.detail, explanation: `The source directly supports "${fact.detail}." The other choices describe different concepts or are not supported as statements about ${displaySubject}.` };
}

function seededShuffle<T>(items: T[]) {
  return items.map((item, index) => ({ item, key: hashId(`${index}-${JSON.stringify(item)}`) })).sort((a, b) => a.key.localeCompare(b.key)).map(({ item }) => item);
}

export function generateLocalQuiz(title: string, text: string, settings: QuizSettings): Quiz {
  let facts = splitFacts(text);
  if (settings.selectedTopics.length) {
    facts = facts.map((fact) => {
      const matchedTopic = settings.selectedTopics.find((selected) =>
        fact.topic.toLowerCase() === selected.toLowerCase() || fact.sentence.toLowerCase().includes(selected.toLowerCase()),
      );
      return matchedTopic ? { ...fact, topic: matchedTopic } : fact;
    }).filter((fact) => settings.selectedTopics.some((selected) => fact.topic.toLowerCase() === selected.toLowerCase()));
  }
  const unique = new Map(facts.map((fact) => [fact.sentence.toLowerCase(), fact]));
  facts = [...unique.values()];
  if (!facts.length) throw new Error("The selected source does not contain enough clear statements to build a quiz.");
  const count = Math.min(settings.questionCount, facts.length);
  let questions = facts.slice(0, count).map((fact, index) => makeQuestion(fact, facts, index, settings.questionTypes[index % settings.questionTypes.length], settings.difficulty));
  if (settings.shuffleChoices) questions = questions.map((question) => question.choices ? { ...question, choices: seededShuffle(question.choices) } : question);
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
