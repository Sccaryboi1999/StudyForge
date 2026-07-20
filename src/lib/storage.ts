import type { Attempt, Quiz, StudyGuide } from "@/lib/types";

const KEYS = {
  guides: "studyforge:guides",
  attempts: "studyforge:attempts",
  currentQuiz: "studyforge:current-quiz",
  currentAttempt: "studyforge:current-attempt",
  theme: "studyforge:theme",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
}

function write<T>(key: string, value: T) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  guides: () => read<StudyGuide[]>(KEYS.guides, []),
  saveGuide: (guide: StudyGuide) => {
    const guides = store.guides().filter((item) => item.id !== guide.id);
    write(KEYS.guides, [guide, ...guides]);
  },
  deleteGuide: (id: string) => write(KEYS.guides, store.guides().filter((guide) => guide.id !== id)),
  attempts: () => read<Attempt[]>(KEYS.attempts, []),
  saveAttempt: (attempt: Attempt) => {
    const attempts = store.attempts().filter((item) => item.id !== attempt.id);
    write(KEYS.attempts, [attempt, ...attempts].slice(0, 100));
  },
  currentQuiz: () => read<Quiz | null>(KEYS.currentQuiz, null),
  setCurrentQuiz: (quiz: Quiz) => write(KEYS.currentQuiz, quiz),
  currentAttempt: () => read<Attempt | null>(KEYS.currentAttempt, null),
  setCurrentAttempt: (attempt: Attempt | null) => write(KEYS.currentAttempt, attempt),
  theme: () => read<"light" | "dark">(KEYS.theme, "light"),
  setTheme: (theme: "light" | "dark") => write(KEYS.theme, theme),
};

export async function cloudSaveGuide(guide: StudyGuide) {
  try {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { data } = await client.auth.getUser();
    if (!data.user) return;
    await client.from("study_guides").upsert({
      id: guide.id,
      user_id: data.user.id,
      title: guide.title,
      subject: guide.subject || null,
      original_file_name: guide.originalFileName || null,
      file_type: guide.fileType,
      extracted_text: guide.text,
      detected_topics_json: guide.topics,
      word_count: guide.wordCount,
      created_at: guide.createdAt,
      updated_at: guide.updatedAt,
      archived_at: guide.archived ? new Date().toISOString() : null,
    });
  } catch { /* Guest/local persistence remains available. */ }
}

export async function cloudSaveAttempt(attempt: Attempt) {
  try {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { data } = await client.auth.getUser();
    if (!data.user) return;
    await client.from("quiz_attempts").upsert({
      id: attempt.id,
      user_id: data.user.id,
      quiz_id: null,
      status: attempt.status,
      started_at: attempt.startedAt,
      completed_at: attempt.completedAt || null,
      score: attempt.score,
      possible_score: attempt.possibleScore,
      percentage: attempt.percentage,
      time_spent_seconds: attempt.timeSpentSeconds,
      answers_json: attempt.answers,
      performance_summary_json: { title: attempt.quiz.title, studyGuideTitle: attempt.quiz.studyGuideTitle, quiz: attempt.quiz },
    });
  } catch { /* Guest/local persistence remains available. */ }
}

export async function cloudDeleteGuide(id: string) {
  try {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const client = getSupabaseBrowserClient();
    if (!client) return;
    await client.from("study_guides").delete().eq("id", id);
  } catch { /* Local deletion still succeeds. */ }
}

export async function cloudHydrate() {
  try {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) return false;
    const [{ data: guides }, { data: attempts }] = await Promise.all([
      client.from("study_guides").select("*").order("updated_at", { ascending: false }).limit(100),
      client.from("quiz_attempts").select("*").order("completed_at", { ascending: false }).limit(100),
    ]);
    for (const row of guides ?? []) {
      store.saveGuide({
        id: row.id,
        title: row.title,
        subject: row.subject ?? "",
        originalFileName: row.original_file_name ?? undefined,
        fileType: row.file_type,
        text: row.extracted_text,
        wordCount: row.word_count ?? 0,
        characterCount: row.extracted_text?.length ?? 0,
        headingCount: Array.isArray(row.processed_sections_json) ? row.processed_sections_json.length : 0,
        topics: Array.isArray(row.detected_topics_json) ? row.detected_topics_json : [],
        warnings: [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        archived: Boolean(row.archived_at),
      });
    }
    for (const row of attempts ?? []) {
      const quiz = row.performance_summary_json?.quiz as Quiz | undefined;
      if (!quiz) continue;
      store.saveAttempt({
        id: row.id,
        quizId: quiz.id,
        quiz,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at ?? undefined,
        answers: row.answers_json ?? {},
        score: Number(row.score ?? 0),
        possibleScore: Number(row.possible_score ?? 0),
        percentage: Number(row.percentage ?? 0),
        timeSpentSeconds: row.time_spent_seconds ?? 0,
      });
    }
    return true;
  } catch { return false; }
}
