"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Bookmark, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Flag, Lightbulb, Save, XCircle } from "lucide-react";
import { gradeAnswer, scoreQuiz } from "@/lib/scoring";
import { cloudSaveAttempt, store } from "@/lib/storage";
import type { AnswerStatus, Attempt, Quiz } from "@/lib/types";

export function QuizPlayer() {
  const router = useRouter();
  const questionStarted = useRef(Date.now());
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});
  const [times, setTimes] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const currentQuiz = store.currentQuiz();
    const currentAttempt = store.currentAttempt();
    if (!currentQuiz) { router.replace("/create"); return; }
    setQuiz(currentQuiz);
    if (currentAttempt?.quizId === currentQuiz.id && currentAttempt.status === "in_progress") {
      setAnswers(Object.fromEntries(Object.values(currentAttempt.answers).map((answer) => [answer.questionId, answer.answer])));
      setFlagged(Object.fromEntries(Object.values(currentAttempt.answers).map((answer) => [answer.questionId, Boolean(answer.flagged)])));
    }
    const elapsed = currentAttempt?.startedAt ? Math.floor((Date.now() - new Date(currentAttempt.startedAt).getTime()) / 1000) : 0;
    setSecondsLeft(currentQuiz.settings.timerMinutes ? Math.max(0, currentQuiz.settings.timerMinutes * 60 - elapsed) : null);
    setLoaded(true);
  }, [router]);

  useEffect(() => {
    if (secondsLeft === null || !loaded) return;
    if (secondsLeft <= 0) { finish(true); return; }
    const timer = window.setTimeout(() => setSecondsLeft((value) => value === null ? null : value - 1), 1000);
    return () => window.clearTimeout(timer);
    // finish is intentionally omitted to avoid resetting the interval.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, loaded]);

  useEffect(() => {
    if (!quiz || !loaded) return;
    const autosave = window.setTimeout(() => {
      const now = new Date().toISOString();
      const records = Object.fromEntries(quiz.questions.map((question) => {
        const graded = gradeAnswer(question, answers[question.id] ?? "");
        return [question.id, { questionId: question.id, answer: answers[question.id] ?? "", status: graded.status, pointsEarned: 0, responseTimeSeconds: times[question.id] ?? 0, flagged: flagged[question.id] }];
      }));
      const attempt: Attempt = { id: `attempt_${quiz.id}`, quizId: quiz.id, quiz, status: "in_progress", startedAt: store.currentAttempt()?.startedAt ?? now, answers: records, score: 0, possibleScore: quiz.questions.reduce((sum, q) => sum + q.points, 0), percentage: 0, timeSpentSeconds: Object.values(times).reduce((a,b) => a+b,0) };
      store.setCurrentAttempt(attempt);
    }, 350);
    return () => window.clearTimeout(autosave);
  }, [answers, flagged, times, quiz, loaded]);

  const question = quiz?.questions[index];
  const status = useMemo(() => question ? gradeAnswer(question, answers[question.id] ?? "").status : "unanswered", [question, answers]);
  if (!quiz || !question) return <div className="page"><div className="narrow empty-state"><span className="loader" style={{ display: "inline-block" }} /><p>Restoring your quiz…</p></div></div>;

  function recordTime() {
    if (!question) return;
    const elapsed = Math.max(1, Math.round((Date.now() - questionStarted.current) / 1000));
    setTimes((current) => ({ ...current, [question.id]: (current[question.id] ?? 0) + elapsed }));
    questionStarted.current = Date.now();
  }

  function go(next: number) { recordTime(); setIndex(Math.max(0, Math.min(quiz!.questions.length - 1, next))); }
  function selectAnswer(value: string) {
    if (submitted[question!.id] && !quiz!.settings.allowChanges) return;
    setAnswers((current) => ({ ...current, [question!.id]: value }));
    if (quiz!.mode !== "exam" && quiz!.settings.feedback === "immediate" && submitted[question!.id]) setSubmitted((current) => ({ ...current, [question!.id]: false }));
  }
  function submitCurrent() {
    if (!answers[question!.id]) return;
    recordTime(); setSubmitted((current) => ({ ...current, [question!.id]: true }));
  }
  function finish(fromTimer = false) {
    if (!quiz) return;
    recordTime();
    const unanswered = quiz.questions.filter((q) => !answers[q.id]).length;
    if (!fromTimer && quiz.mode === "exam" && unanswered && !window.confirm(`You still have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Submit anyway?`)) return;
    const result = scoreQuiz(quiz, answers, times);
    const startedAt = store.currentAttempt()?.startedAt ?? new Date(Date.now() - Object.values(times).reduce((a,b) => a+b,0) * 1000).toISOString();
    const completed: Attempt = { id: `attempt_${Date.now().toString(36)}`, quizId: quiz.id, quiz, status: "completed", startedAt, completedAt: new Date().toISOString(), ...result, timeSpentSeconds: Object.values(times).reduce((a,b) => a+b,0), answers: Object.fromEntries(Object.entries(result.answers).map(([id, answer]) => [id, { ...answer, flagged: flagged[id] }])) };
    store.saveAttempt(completed); void cloudSaveAttempt(completed); store.setCurrentAttempt(completed); router.push("/results");
  }

  const showFeedback = submitted[question.id] && quiz.mode !== "exam" && quiz.settings.feedback === "immediate";
  const resultLabel: Record<AnswerStatus, string> = { correct: "Correct", partial: "Partially correct", incorrect: "Not quite", unanswered: "Unanswered" };
  const answeredCount = Object.values(answers).filter((answer) => Array.isArray(answer) ? answer.length : answer.trim()).length;
  const time = secondsLeft === null ? null : `${Math.floor(secondsLeft / 60).toString().padStart(2,"0")}:${(secondsLeft % 60).toString().padStart(2,"0")}`;

  return <div className="page">
    <div className="container">
      <div className="page-header no-print"><div><p className="eyebrow">{quiz.studyGuideTitle}</p><h1 style={{ fontSize: "clamp(1.7rem,4vw,2.7rem)" }}>{quiz.title}</h1></div><div style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="badge green"><Save size={13} /> Autosaved</span>{time && <span className="badge orange"><Clock3 size={13} /> {time}</span>}</div></div>
      <div className="progress-track" aria-label={`${answeredCount} of ${quiz.questions.length} questions answered`} style={{ marginBottom: 22 }}><div className="progress-fill" style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }} /></div>
      <div className="quiz-layout">
        <section className="panel quiz-card" aria-labelledby="question-title">
          <div className="quiz-kicker"><span className="badge purple">Question {index + 1} of {quiz.questions.length}</span><span className="badge">{question.topic}</span><span className="badge">{question.difficulty}</span><button className="button ghost" style={{ minHeight: 30, padding: "4px 8px", marginLeft: "auto" }} onClick={() => setFlagged((current) => ({ ...current, [question.id]: !current[question.id] }))}>{flagged[question.id] ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}{flagged[question.id] ? " Flagged" : " Flag"}</button></div>
          <h2 className="question-text" id="question-title">{question.question}</h2>
          {question.choices ? <div className="answer-list" role="radiogroup" aria-label="Answer choices">{question.choices.map((choice, choiceIndex) => {
            const selected = answers[question.id] === choice;
            const isCorrect = showFeedback && choice === question.correctAnswer;
            const isWrong = showFeedback && selected && !isCorrect;
            return <button role="radio" aria-checked={selected} className={`answer-card ${selected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "incorrect" : ""}`} key={choice} onClick={() => selectAnswer(choice)} disabled={showFeedback && !quiz.settings.allowChanges}><span className="letter">{String.fromCharCode(65 + choiceIndex)}</span><span>{choice}</span>{isCorrect && <CheckCircle2 size={19} style={{ marginLeft: "auto" }} />}{isWrong && <XCircle size={19} style={{ marginLeft: "auto" }} />}</button>;
          })}</div> : <div className="field"><label htmlFor="written-answer">Your answer</label><textarea id="written-answer" className="textarea" style={{ minHeight: 130 }} value={(answers[question.id] as string) ?? ""} onChange={(event) => selectAnswer(event.target.value)} placeholder="Answer using concepts from the study guide…" disabled={showFeedback && !quiz.settings.allowChanges} /></div>}

          {hints[question.id] && <div className="warning" style={{ marginTop: 16 }}><Lightbulb size={17} style={{ verticalAlign: "middle", marginRight: 7 }} /><strong>Hint:</strong> {question.hint ?? `Review the ${question.topic} section.`}</div>}
          {showFeedback && <div className="feedback-box" role="status"><h3>{status === "correct" ? <CheckCircle2 size={20} style={{ verticalAlign: "middle", marginRight: 6, color: "var(--mint)" }} /> : <AlertCircle size={20} style={{ verticalAlign: "middle", marginRight: 6, color: "var(--warning)" }} />}{resultLabel[status]}</h3><p>{question.explanation}</p>{quiz.settings.showSources && <div className="source-box"><strong>Source · {question.sourceSection}</strong><br/>“{question.sourceExcerpt}”</div>}</div>}

          <div className="actions no-print">
            <div style={{ display: "flex", gap: 8 }}>{quiz.settings.allowHints && <button className="button secondary" onClick={() => setHints((current) => ({ ...current, [question.id]: !current[question.id] }))}><Lightbulb size={16} /> Hint</button>}{quiz.settings.allowSkipping && !answers[question.id] && index < quiz.questions.length - 1 && <button className="button ghost" onClick={() => go(index + 1)}>Skip</button>}</div>
            <div style={{ display: "flex", gap: 8 }}>{quiz.mode !== "exam" && quiz.settings.feedback === "immediate" && !submitted[question.id] && <button className="button primary" onClick={submitCurrent} disabled={!answers[question.id]}>Check answer</button>}{index < quiz.questions.length - 1 ? <button className="button secondary" onClick={() => go(index + 1)}>Next <ChevronRight size={17} /></button> : <button className="button primary" onClick={() => finish(false)}>Finish quiz</button>}</div>
          </div>
        </section>

        <aside className="panel quiz-sidebar no-print" aria-label="Quiz navigation">
          <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Question navigator</strong><span className="small muted">{answeredCount}/{quiz.questions.length}</span></div>
          <div className="navigator">{quiz.questions.map((item, itemIndex) => <button aria-label={`Go to question ${itemIndex + 1}${answers[item.id] ? ", answered" : ""}${flagged[item.id] ? ", flagged" : ""}`} className={`nav-dot ${itemIndex === index ? "current" : ""} ${answers[item.id] ? "answered" : ""} ${flagged[item.id] ? "flagged" : ""}`} onClick={() => go(itemIndex)} key={item.id}>{itemIndex + 1}</button>)}</div>
          <div style={{ marginTop: 22, display: "grid", gap: 9 }}><button className="button secondary full" onClick={() => go(index - 1)} disabled={index === 0}><ChevronLeft size={17} /> Previous</button><button className="button primary full" onClick={() => finish(false)}><Flag size={16} /> Finish quiz</button></div>
          {quiz.generationNote && <p className="small muted" style={{ marginTop: 18 }}>{quiz.generationNote}</p>}
        </aside>
      </div>
    </div>
  </div>;
}
