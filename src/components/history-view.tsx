"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, CalendarDays, Eye, Search, Target } from "lucide-react";
import { cloudHydrate, store } from "@/lib/storage";
import type { Attempt } from "@/lib/types";

export function HistoryView() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");
  const [sort, setSort] = useState<"newest" | "score">("newest");
  useEffect(() => { let active = true; void cloudHydrate().finally(() => { if (active) setAttempts(store.attempts().filter((item) => item.status === "completed")); }); return () => { active = false; }; }, []);
  const filtered = useMemo(() => attempts.filter((attempt) => (mode === "all" || attempt.quiz.mode === mode) && `${attempt.quiz.title} ${attempt.quiz.studyGuideTitle}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === "score" ? b.percentage-a.percentage : new Date(b.completedAt!).getTime()-new Date(a.completedAt!).getTime()), [attempts, query, mode, sort]);
  const open = (attempt: Attempt) => { store.setCurrentAttempt(attempt); store.setCurrentQuiz(attempt.quiz); window.location.href = "/results"; };
  if (!attempts.length) return <div className="panel empty-state"><span className="empty-icon"><CalendarDays/></span><h2>No quiz history yet</h2><p className="muted">Complete a quiz and its score, answers, and source review will appear here.</p><Link className="button primary" href="/create">Create a quiz</Link></div>;
  return <div className="panel"><div className="panel-head" style={{ flexWrap: "wrap" }}><div style={{ position: "relative", flex: "1 1 260px" }}><Search size={17} style={{ position: "absolute", left: 12, top: 13, color: "var(--muted)" }}/><input className="input" style={{ paddingLeft: 38 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search quizzes or study guides" aria-label="Search quiz history"/></div><select className="select" style={{ width: 160 }} value={mode} onChange={(event) => setMode(event.target.value)} aria-label="Filter by mode"><option value="all">All modes</option>{["practice","exam","study","adaptive","review"].map((item) => <option value={item} key={item}>{item[0].toUpperCase()+item.slice(1)}</option>)}</select><button className="button secondary" onClick={() => setSort(sort === "newest" ? "score" : "newest")}><ArrowUpDown size={16}/> {sort === "newest" ? "Newest" : "Highest score"}</button></div><div className="table-wrap"><table><thead><tr><th>Quiz</th><th>Date</th><th>Difficulty</th><th>Mode</th><th>Questions</th><th>Time</th><th>Score</th><th><span className="sr-only">Review</span></th></tr></thead><tbody>{filtered.map((attempt) => <tr key={attempt.id}><td><strong>{attempt.quiz.title}</strong><br/><span className="small muted">{attempt.quiz.studyGuideTitle}</span></td><td>{new Date(attempt.completedAt!).toLocaleDateString()}</td><td><span className="badge">{attempt.quiz.difficulty}</span></td><td>{attempt.quiz.mode}</td><td>{attempt.quiz.questions.length}</td><td>{Math.floor(attempt.timeSpentSeconds/60)}m {attempt.timeSpentSeconds%60}s</td><td><span className={`badge ${attempt.percentage >= 80 ? "green" : attempt.percentage >= 60 ? "orange" : ""}`}>{attempt.percentage}%</span></td><td><button className="icon-button" style={{ color: "var(--accent)", borderColor: "var(--line)" }} onClick={() => open(attempt)} aria-label={`Review ${attempt.quiz.title}`}><Eye size={17}/></button></td></tr>)}</tbody></table></div>{!filtered.length && <div className="empty-state"><Target className="muted"/><p>No attempts match those filters.</p></div>}</div>;
}
