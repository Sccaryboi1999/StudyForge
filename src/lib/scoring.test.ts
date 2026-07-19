import { describe, expect, it } from "vitest";
import { gradeAnswer, scoreQuiz } from "@/lib/scoring";
import { generateLocalQuiz } from "@/lib/generator";
import { DEMO_GUIDE, DEMO_TITLE } from "@/lib/demo";
import type { QuizQuestion } from "@/lib/types";

const short: QuizQuestion = { id:"q", type:"short_answer", topic:"Networks", difficulty:"medium", question:"What does TCP provide?", correctAnswer:"ordered reliable delivery with retransmission", acceptedAnswers:["reliable ordered delivery"], explanation:"The guide states this directly.", sourceExcerpt:"TCP provides ordered, reliable delivery with retransmission.", points:2 };

describe("quiz scoring", () => {
  it("accepts normalized answer variants and awards meaningful partial credit", () => {
    expect(gradeAnswer(short, "Reliable, ordered delivery!").status).toBe("correct");
    expect(gradeAnswer(short, "reliable delivery").status).toBe("partial");
    expect(gradeAnswer(short, "fast addresses").status).toBe("incorrect");
  });

  it("calculates a complete score", () => {
    const quiz = generateLocalQuiz(DEMO_TITLE, DEMO_GUIDE, { questionCount:5,difficulty:"easy",mode:"exam",questionTypes:["true_false"],selectedTopics:[],strictSource:true,shuffleQuestions:false,shuffleChoices:false,allowHints:false,allowSkipping:true,allowChanges:true,showSources:true,feedback:"end",timerMinutes:0 });
    const raw = Object.fromEntries(quiz.questions.map((question) => [question.id, "True"]));
    const result = scoreQuiz(quiz, raw);
    expect(result.percentage).toBe(100);
    expect(result.score).toBe(result.possibleScore);
  });
});
