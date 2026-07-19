import { describe, expect, it } from "vitest";
import { DEMO_GUIDE, DEMO_TITLE } from "@/lib/demo";
import { generateLocalQuiz } from "@/lib/generator";
import { quizSchema } from "@/lib/types";

const settings = {
  questionCount: 10,
  difficulty: "mixed" as const,
  mode: "practice" as const,
  questionTypes: ["multiple_choice", "true_false", "short_answer"] as const,
  selectedTopics: [], strictSource: true, shuffleQuestions: false, shuffleChoices: false,
  allowHints: true, allowSkipping: true, allowChanges: true, showSources: true,
  feedback: "immediate" as const, timerMinutes: 0,
};

describe("local quiz generation", () => {
  it("generates a validated ten-question grounded demo quiz", () => {
    const quiz = generateLocalQuiz(DEMO_TITLE, DEMO_GUIDE, { ...settings, questionTypes: [...settings.questionTypes] });
    expect(() => quizSchema.parse(quiz)).not.toThrow();
    expect(quiz.questions).toHaveLength(10);
    for (const question of quiz.questions) expect(DEMO_GUIDE).toContain(question.sourceExcerpt);
  });

  it("returns fewer questions instead of duplicating weak material", () => {
    const quiz = generateLocalQuiz("Tiny", "Key Terms\n\nA router connects separate networks and forwards packets between them.", { ...settings, questionTypes: ["multiple_choice"] });
    expect(quiz.questions).toHaveLength(1);
    expect(quiz.generationNote).toContain("instead of 10");
  });
});
