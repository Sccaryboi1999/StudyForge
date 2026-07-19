import { AnswerRecord, AnswerStatus, Quiz, QuizQuestion } from "@/lib/types";

export function normalizeAnswer(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function gradeAnswer(question: QuizQuestion, answer: string | string[]): { status: AnswerStatus; ratio: number } {
  if (!answer || (Array.isArray(answer) && !answer.length) || (!Array.isArray(answer) && !answer.trim())) return { status: "unanswered", ratio: 0 };
  const expected = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
  const received = Array.isArray(answer) ? answer : [answer];
  if (question.type === "multiple_select" || question.type === "ordering" || question.type === "matching") {
    const correct = expected.map(normalizeAnswer);
    const submitted = received.map(normalizeAnswer);
    const matches = question.type === "ordering" ? correct.filter((v, i) => submitted[i] === v).length : correct.filter((v) => submitted.includes(v)).length;
    const ratio = matches / Math.max(correct.length, submitted.length);
    return { status: ratio === 1 ? "correct" : ratio >= 0.5 ? "partial" : "incorrect", ratio };
  }
  const normalized = normalizeAnswer(received[0]);
  const accepted = [...expected, ...(question.acceptedAnswers ?? [])].map(normalizeAnswer);
  if (accepted.some((candidate) => normalized === candidate)) return { status: "correct", ratio: 1 };
  if (question.type === "short_answer" || question.type === "scenario" || question.type === "fill_blank") {
    const required = new Set(normalizeAnswer(expected[0]).split(" ").filter((word) => word.length > 3));
    const words = new Set(normalized.split(" "));
    const ratio = [...required].filter((word) => words.has(word)).length / Math.max(1, required.size);
    return { status: ratio >= 0.72 ? "correct" : ratio >= 0.4 ? "partial" : "incorrect", ratio };
  }
  return { status: "incorrect", ratio: 0 };
}

export function scoreQuiz(quiz: Quiz, rawAnswers: Record<string, string | string[]>, times: Record<string, number> = {}) {
  const answers: Record<string, AnswerRecord> = {};
  let score = 0;
  for (const question of quiz.questions) {
    const result = gradeAnswer(question, rawAnswers[question.id] ?? "");
    const earned = Math.round(question.points * result.ratio * 100) / 100;
    score += earned;
    answers[question.id] = { questionId: question.id, answer: rawAnswers[question.id] ?? "", status: result.status, pointsEarned: earned, responseTimeSeconds: times[question.id] ?? 0 };
  }
  const possibleScore = quiz.questions.reduce((sum, question) => sum + question.points, 0);
  return { answers, score, possibleScore, percentage: Math.round((score / Math.max(1, possibleScore)) * 100) };
}

export function topicPerformance(quiz: Quiz, answers: Record<string, AnswerRecord>) {
  const topics: Record<string, { correct: number; total: number; earned: number; possible: number }> = {};
  for (const question of quiz.questions) {
    topics[question.topic] ??= { correct: 0, total: 0, earned: 0, possible: 0 };
    topics[question.topic].total += 1;
    topics[question.topic].possible += question.points;
    topics[question.topic].earned += answers[question.id]?.pointsEarned ?? 0;
    if (answers[question.id]?.status === "correct") topics[question.topic].correct += 1;
  }
  return Object.entries(topics).map(([topic, data]) => ({ topic, ...data, accuracy: Math.round((data.earned / Math.max(1, data.possible)) * 100) })).sort((a, b) => b.accuracy - a.accuracy);
}
