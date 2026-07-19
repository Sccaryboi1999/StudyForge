"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, Check, CheckCircle2, Clipboard, Download, FileJson, Printer, RefreshCw, Share2, Sparkles, Target, X, XCircle } from "lucide-react";
import { topicPerformance } from "@/lib/scoring";
import { store } from "@/lib/storage";
import type { AnswerStatus, Attempt, Quiz } from "@/lib/types";

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
}

export function ResultsView() {
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [toast, setToast] = useState("");
  useEffect(() => { const current = store.currentAttempt(); if (!current || current.status !== "completed") router.replace("/history"); else setAttempt(current); }, [router]);
  const performance = useMemo(() => attempt ? topicPerformance(attempt.quiz, attempt.answers) : [], [attempt]);
  if (!attempt) return <div className="page"><div className="narrow empty-state"><span className="loader" style={{ display: "inline-block" }} /><p>Preparing your results…</p></div></div>;

  const quiz = attempt.quiz;
  const counts = Object.values(attempt.answers).reduce<Record<AnswerStatus, number>>((acc, answer) => { acc[answer.status] += 1; return acc; }, { correct: 0, partial: 0, incorrect: 0, unanswered: 0 });
  const strongest = performance[0];
  const weakest = performance[performance.length - 1];
  const oldAttempt = store.attempts().find((item) => item.quiz.studyGuideTitle === quiz.studyGuideTitle && item.id !== attempt.id);
  const improvement = oldAttempt ? attempt.percentage - oldAttempt.percentage : null;

  function startQuiz(next: Quiz) { store.setCurrentQuiz({ ...next, id: `quiz_${Date.now().toString(36)}`, createdAt: new Date().toISOString() }); store.setCurrentAttempt(null); router.push("/quiz"); }
  function missedQuiz() {
    const missed = quiz.questions.filter((question) => attempt!.answers[question.id]?.status !== "correct");
    if (!missed.length) { setToast("Perfect score — there are no missed questions to practice."); return; }
    startQuiz({ ...quiz, title: `${quiz.studyGuideTitle} · Mistake Review`, mode: "review", questions: missed, settings: { ...quiz.settings, questionCount: missed.length, feedback: "immediate", allowHints: true } });
  }
  function weakQuiz() {
    if (!weakest) return;
    const questions = quiz.questions.filter((question) => question.topic === weakest.topic);
    startQuiz({ ...quiz, title: `${weakest.topic} · Focus Practice`, mode: "review", questions, settings: { ...quiz.settings, questionCount: questions.length, feedback: "immediate" } });
  }
  const summary = `StudyForge AI Results\n${quiz.title}\nScore: ${attempt.percentage}% (${attempt.score}/${attempt.possibleScore})\nCorrect: ${counts.correct}\nPartially correct: ${counts.partial}\nIncorrect: ${counts.incorrect}\nUnanswered: ${counts.unanswered}\nTime: ${Math.floor(attempt.timeSpentSeconds / 60)}m ${attempt.timeSpentSeconds % 60}s`;
  async function share() {
    if (navigator.share) await navigator.share({ title: `${quiz.title} score`, text: `I scored ${attempt!.percentage}% on ${quiz.studyGuideTitle} with StudyForge AI.` });
    else { await navigator.clipboard.writeText(`I scored ${attempt!.percentage}% on ${quiz.studyGuideTitle} with StudyForge AI.`); setToast("Score summary copied."); }
  }
  const icon: Record<AnswerStatus, React.ReactNode> = { correct: <Check size={17}/>, partial: <Target size={17}/>, incorrect: <X size={17}/>, unanswered: <X size={17}/> };

  return <div className="page"><div className="container">
    <div className="result-hero">
      <div className="score-ring" style={{ "--score": `${attempt.percentage * 3.6}deg` } as React.CSSProperties}><strong>{attempt.percentage}%</strong></div>
      <div><p className="eyebrow" style={{ color: "#a99eff" }}>Quiz complete</p><h1 style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>{attempt.percentage >= 85 ? "Excellent work." : attempt.percentage >= 70 ? "Good progress." : "A useful first pass."}</h1><p style={{ color: "#b7c5d9", marginBottom: 0 }}>{quiz.studyGuideTitle} · {quiz.questions.length} questions</p></div>
      <div><strong style={{ fontSize: "1.3rem" }}>{attempt.score}/{attempt.possibleScore} points</strong><br/><span style={{ color: "#b7c5d9" }}>{Math.floor(attempt.timeSpentSeconds / 60)}m {attempt.timeSpentSeconds % 60}s</span></div>
    </div>

    <div className="stats-grid"><div className="stat-card"><CheckCircle2 color="var(--mint)"/><div className="value">{counts.correct}</div><span className="muted small">Correct</span></div><div className="stat-card"><Target color="var(--warning)"/><div className="value">{counts.partial}</div><span className="muted small">Partially correct</span></div><div className="stat-card"><XCircle color="var(--danger)"/><div className="value">{counts.incorrect}</div><span className="muted small">Incorrect</span></div><div className="stat-card"><BarChart3 color="var(--accent)"/><div className="value">{Math.round(attempt.timeSpentSeconds / Math.max(1, quiz.questions.length))}s</div><span className="muted small">Avg. per question</span></div></div>

    <div className="two-col" style={{ marginBottom: 22 }}>
      <section className="card"><h3>Performance by topic</h3>{performance.map((item) => <div className="bar-row" key={item.topic}><span className="small">{item.topic}</span><div className="progress-track"><div className="progress-fill" style={{ width: `${item.accuracy}%` }} /></div><strong className="small">{item.accuracy}%</strong></div>)}</section>
      <section className="card"><h3>Your next best step</h3><p className="muted">{weakest && weakest.accuracy < 80 ? <>Focus on <strong>{weakest.topic}</strong>. It was your weakest topic at {weakest.accuracy}% accuracy.</> : <>You are showing strong recall across the selected material. Try a harder, shuffled quiz next.</>}</p>{strongest && <p className="success"><Sparkles size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />Strongest topic: <strong>{strongest.topic}</strong> ({strongest.accuracy}%)</p>}{improvement !== null && <p className="small muted">Change from a previous attempt: <strong>{improvement >= 0 ? "+" : ""}{improvement} points</strong></p>}<button className="button primary" onClick={weakQuiz}>Practice weak topic</button></section>
    </div>

    <div className="panel no-print" style={{ marginBottom: 28 }}><div className="panel-body" style={{ display: "flex", flexWrap: "wrap", gap: 9 }}><button className="button primary" onClick={missedQuiz}><Target size={16}/> Practice missed</button><button className="button secondary" onClick={() => startQuiz(quiz)}><RefreshCw size={16}/> Retake quiz</button><button className="button secondary" onClick={() => router.push("/create")}><Sparkles size={16}/> New quiz</button><button className="button ghost" onClick={() => download("studyforge-results.txt", summary, "text/plain")}><Download size={16}/> Download summary</button><button className="button ghost" onClick={() => download("studyforge-questions.json", JSON.stringify(quiz.questions, null, 2), "application/json")}><FileJson size={16}/> Questions JSON</button><button className="button ghost" onClick={() => window.print()}><Printer size={16}/> Print / PDF</button><button className="button ghost" onClick={() => void share()}><Share2 size={16}/> Share score</button></div></div>

    <div className="section-heading"><div><p className="eyebrow">Answer review</p><h2>Understand every question.</h2></div><p className="lede">Open any item to compare your answer with the source-supported answer.</p></div>
    <div className="review-list">{quiz.questions.map((question, questionIndex) => {
      const answer = attempt.answers[question.id];
      return <details className="card review-card" key={question.id} open={answer.status !== "correct"}><summary className="review-summary"><span className={`status-icon ${answer.status}`}>{icon[answer.status]}</span><span><strong>{questionIndex + 1}. {question.question}</strong><br/><small className="muted">{question.topic} · {question.difficulty} · {answer.pointsEarned}/{question.points} points</small></span><span className={`badge ${answer.status === "correct" ? "green" : answer.status === "partial" ? "orange" : ""}`}>{answer.status === "partial" ? "Partially correct" : answer.status[0].toUpperCase() + answer.status.slice(1)}</span></summary><div className="review-body"><div className="answer-compare"><div className="answer-box"><span className="small muted">Your answer</span><p>{Array.isArray(answer.answer) ? answer.answer.join(", ") : answer.answer || "No answer"}</p></div><div className="answer-box"><span className="small muted">Correct answer</span><p>{Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer}</p></div></div><p><strong>Explanation:</strong> {question.explanation}</p><div className="source-box"><strong>Source · {question.sourceSection}</strong><br/>“{question.sourceExcerpt}”</div></div></details>;
    })}</div>
    <div className="actions no-print"><button className="button ghost" onClick={() => router.push("/library")}><ArrowLeft size={16}/> Study guide library</button><button className="button primary" onClick={missedQuiz}><Clipboard size={16}/> Practice missed questions</button></div>
    {toast && <div className="toast" role="status" onAnimationEnd={() => window.setTimeout(() => setToast(""), 2500)}>{toast}</div>}
  </div></div>;
}
