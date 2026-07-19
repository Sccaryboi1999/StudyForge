import { z } from "zod";

export const questionTypeSchema = z.enum([
  "multiple_choice",
  "true_false",
  "fill_blank",
  "matching",
  "multiple_select",
  "short_answer",
  "ordering",
  "scenario",
]);

export const quizQuestionSchema = z.object({
  id: z.string().min(1),
  type: questionTypeSchema,
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  question: z.string().min(4),
  choices: z.array(z.string().min(1)).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  acceptedAnswers: z.array(z.string()).optional(),
  matchingPairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
  correctOrder: z.array(z.string()).optional(),
  explanation: z.string().min(4),
  hint: z.string().optional(),
  sourceSection: z.string().optional(),
  sourceExcerpt: z.string().min(1),
  sourceStartIndex: z.number().int().nonnegative().optional(),
  sourceEndIndex: z.number().int().positive().optional(),
  points: z.number().positive().default(1),
});

export const quizSchema = z.object({
  id: z.string(),
  title: z.string(),
  studyGuideTitle: z.string(),
  createdAt: z.string(),
  mode: z.enum(["practice", "exam", "study", "adaptive", "flashcard", "review"]),
  difficulty: z.enum(["easy", "medium", "hard", "mixed", "adaptive"]),
  strictSource: z.boolean(),
  settings: z.object({
    questionCount: z.number().int().min(1).max(50),
    questionTypes: z.array(questionTypeSchema).min(1),
    selectedTopics: z.array(z.string()),
    shuffleQuestions: z.boolean(),
    shuffleChoices: z.boolean(),
    allowHints: z.boolean(),
    allowSkipping: z.boolean(),
    allowChanges: z.boolean(),
    showSources: z.boolean(),
    feedback: z.enum(["immediate", "end"]),
    timerMinutes: z.number().int().min(0).max(180),
  }),
  questions: z.array(quizQuestionSchema).min(1),
  generationNote: z.string().optional(),
});

export type QuestionType = z.infer<typeof questionTypeSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type QuizSettings = Quiz["settings"] & {
  difficulty: Quiz["difficulty"];
  mode: Quiz["mode"];
  strictSource: boolean;
};

export type StudyGuide = {
  id: string;
  title: string;
  subject: string;
  originalFileName?: string;
  fileType: string;
  text: string;
  wordCount: number;
  characterCount: number;
  headingCount: number;
  topics: string[];
  warnings: string[];
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
};

export type AnswerStatus = "correct" | "partial" | "incorrect" | "unanswered";

export type AnswerRecord = {
  questionId: string;
  answer: string | string[];
  status: AnswerStatus;
  pointsEarned: number;
  responseTimeSeconds: number;
  confidence?: number;
  flagged?: boolean;
};

export type Attempt = {
  id: string;
  quizId: string;
  quiz: Quiz;
  status: "in_progress" | "completed";
  startedAt: string;
  completedAt?: string;
  answers: Record<string, AnswerRecord>;
  score: number;
  possibleScore: number;
  percentage: number;
  timeSpentSeconds: number;
};

export const generateRequestSchema = z.object({
  guide: z.object({
    title: z.string().min(1).max(120),
    text: z.string().min(80).max(250_000),
    topics: z.array(z.string()).max(50),
  }),
  settings: z.object({
    questionCount: z.number().int().min(1).max(50),
    difficulty: z.enum(["easy", "medium", "hard", "mixed", "adaptive"]),
    mode: z.enum(["practice", "exam", "study", "adaptive", "flashcard", "review"]),
    questionTypes: z.array(questionTypeSchema).min(1),
    selectedTopics: z.array(z.string()),
    strictSource: z.boolean(),
    shuffleQuestions: z.boolean(),
    shuffleChoices: z.boolean(),
    allowHints: z.boolean(),
    allowSkipping: z.boolean(),
    allowChanges: z.boolean(),
    showSources: z.boolean(),
    feedback: z.enum(["immediate", "end"]),
    timerMinutes: z.number().int().min(0).max(180),
  }),
});
