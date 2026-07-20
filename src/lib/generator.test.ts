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

  it("uses explained answers instead of titles, directions, or unanswered test statements", () => {
    const source = [
      "CIS 341 Exam #5 Practice Quiz",
      "CIS 341 Exam #5 Practice Quiz | Page 1",
      "Instructions",
      "Complete the quiz without the study guide first.",
      "1. _____ ICMP makes IP reliable by guaranteeing that every packet arrives.",
      "2. _____ TCP is connectionless and does not use acknowledgments.",
      "CIS 341 Exam #5 Practice Quiz",
      "Explained Answer Key",
      "1. False",
      "ICMP reports errors and operational information, but it does not guarantee delivery.",
      "2. False",
      "TCP is connection-oriented and uses acknowledgments, sequencing, and retransmission.",
    ].join("\n");
    const quiz = generateLocalQuiz("Networking", source, { ...settings, questionTypes: [...settings.questionTypes] });

    expect(quiz.questions).toHaveLength(2);
    expect(quiz.questions.map((question) => question.sourceExcerpt)).toEqual([
      "ICMP reports errors and operational information, but it does not guarantee delivery.",
      "TCP is connection-oriented and uses acknowledgments, sequencing, and retransmission.",
    ]);
    for (const question of quiz.questions) {
      expect(question.question).not.toMatch(/practice quiz|instructions|complete the quiz|guaranteeing that every packet/i);
    }
  });

  it("does not turn module headings or study directions into questions or choices", () => {
    const source = [
      "CIS 341",
      "Exam #5 Completed Study Guide",
      "Modules 13-15: ICMP, Transport Layer, and Application Layer",
      "Module 13 - ICMP and Network Testing | Module 14 - Transport Layer | Module 15 - Application Layer",
      "Use this guide with Packet Tracer and command-line practice",
      "Memorize the core protocol purposes and processes, but also practice explaining what each result proves during troubleshooting",
      "ICMP reports errors and operational information for IP.",
      "TCP provides reliable ordered delivery and uses acknowledgments.",
    ].join("\n");
    const quiz = generateLocalQuiz("E5 STUDYG", source, { ...settings, questionTypes: [...settings.questionTypes] });
    const serialized = JSON.stringify(quiz.questions);

    expect(quiz.questions).toHaveLength(2);
    expect(serialized).not.toMatch(/Modules 13-15|Module 13 -|Completed Study Guide|Use this guide|Memorize/i);
    expect(quiz.questions.map((question) => question.sourceExcerpt)).toEqual([
      "ICMP reports errors and operational information for IP.",
      "TCP provides reliable ordered delivery and uses acknowledgments.",
    ]);
  });
});
