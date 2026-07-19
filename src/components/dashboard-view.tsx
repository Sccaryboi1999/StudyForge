"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, BookOpen, CalendarDays, Flame, Play, Plus, Target, Trophy } from "lucide-react";
import { cloudHydrate, store } from "@/lib/storage";
import type { Attempt, StudyGuide } from "@/lib/types";

export function DashboardView() {
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => { let active = true; void cloudHydrate().finally(() => { if (active) { setGuides(store.guides()); setAttempts(store.attempts()); setReady(true); } }); return () => { active = false; }; }, []);
  const completed = attempts.filter((item) => item.status === "completed");
  const average = completed.length ? Math.round(completed.reduce((sum, item) => sum + item.percentage, 0) / completed.length) : 0;
  const best = completed.length ? Math.max(...completed.map((item) => item.percentage)) : 0;
  const totalQuestions = completed.reduce((sum, item) => sum + item.quiz.questions.length, 0);
  const streak = useMemo(() => {
    const days = new Set(completed.map((item) => new Date(item.completedAt ?? item.startedAt).toDateString()));
    let count = 0; const date = new Date();
    while (days.has(date.toDateString())) { count++; date.setDate(date.getDate() - 1); }
    return count;
  }, [completed]);
  const weak = useMemo(() => {
    const scores: Record<string, { earned: number; possible: number }> = {};
    completed.forEach((attempt) => attempt.quiz.questions.forEach((question) => { scores[question.topic] ??= { earned: 0, possible: 0 }; scores[question.topic].earned += attempt.answers[question.id]?.pointsEarned ?? 0; scores[question.topic].possible += question.points; }));
    return Object.entries(scores).map(([topic, data]) => ({ topic, accuracy: Math.round(data.earned / Math.max(1, data.possible) * 100) })).sort((a,b) => a.accuracy-b.accuracy).slice(0,3);
  }, [completed]);
  if (!ready) return <div className="empty-state"><span className="loader" style={{ display: "inline-block" }} /></div>;

  return <>
    {!completed.length && <div className="card" style={{ marginBottom: 22, background: "var(--navy)", color: "white" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center", flexWrap: "wrap" }}><div><p className="eyebrow" style={{ color: "#a99eff" }}>Welcome to your study space</p><h2 style={{ fontSize: "1.7rem" }}>Your progress story starts with one quiz.</h2><p style={{ color: "#b7c5d9" }}>Guest progress is saved in this browser automatically.</p></div><Link className="button primary" href="/create"><Plus size={17}/> Create your first quiz</Link></div></div>}
    <div className="stats-grid"><div className="stat-card"><Target color="var(--accent)"/><div className="value">{average}%</div><span className="muted small">Average score</span></div><div className="stat-card"><Trophy color="#e4a31a"/><div className="value">{best}%</div><span className="muted small">Best score</span></div><div className="stat-card"><Flame color="#f06b42"/><div className="value">{streak}</div><span className="muted small">Day streak</span></div><div className="stat-card"><BarChart3 color="var(--mint)"/><div className="value">{totalQuestions}</div><span className="muted small">Questions answered</span></div></div>
    <div className="two-col">
      <section className="panel"><div className="panel-head"><h3>Recent study guides</h3><Link className="small muted" href="/library">View all <ArrowRight size={13} style={{ verticalAlign: "middle" }}/></Link></div><div className="panel-body">{guides.length ? guides.slice(0,4).map((guide) => <div className="toggle-row" key={guide.id}><span><strong>{guide.title}</strong><br/><small className="muted">{guide.wordCount.toLocaleString()} words · {guide.topics.length} topics</small></span><BookOpen size={18} color="var(--accent)"/></div>) : <div className="empty-state" style={{ padding: 30 }}><BookOpen className="muted"/><p className="muted">No saved guides yet.</p></div>}</div></section>
      <section className="panel"><div className="panel-head"><h3>Recent quiz attempts</h3><Link className="small muted" href="/history">View all <ArrowRight size={13} style={{ verticalAlign: "middle" }}/></Link></div><div className="panel-body">{completed.length ? completed.slice(0,4).map((attempt) => <div className="toggle-row" key={attempt.id}><span><strong>{attempt.quiz.studyGuideTitle}</strong><br/><small className="muted">{new Date(attempt.completedAt!).toLocaleDateString()} · {attempt.quiz.mode}</small></span><span className={`badge ${attempt.percentage >= 80 ? "green" : attempt.percentage >= 60 ? "orange" : ""}`}>{attempt.percentage}%</span></div>) : <div className="empty-state" style={{ padding: 30 }}><CalendarDays className="muted"/><p className="muted">Completed quizzes will appear here.</p></div>}</div></section>
    </div>
    <div className="two-col" style={{ marginTop: 18 }}>
      <section className="card"><h3>Topics to strengthen</h3>{weak.length ? weak.map((item) => <div className="bar-row" key={item.topic}><span className="small">{item.topic}</span><div className="progress-track"><div className="progress-fill" style={{ width: `${item.accuracy}%` }}/></div><strong className="small">{item.accuracy}%</strong></div>) : <p className="muted">Complete a quiz to reveal weak topics without misleading guesses.</p>}</section>
      <section className="card"><p className="eyebrow">Recommended next quiz</p><h3>{weak[0] ? `A focused review of ${weak[0].topic}` : "A ten-question mixed review"}</h3><p className="muted">{weak[0] ? "Spend a few minutes on the concept with the most room to grow." : "Start with balanced difficulty and immediate explanations."}</p><Link className="button primary" href={weak[0] ? "/history" : "/create"}><Play size={16}/> {weak[0] ? "Open quiz history" : "Start a quiz"}</Link></section>
    </div>
  </>;
}
