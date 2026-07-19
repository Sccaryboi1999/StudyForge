"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, BrainCircuit, Clock3, Sparkles, Target, TrendingUp } from "lucide-react";
import { cloudHydrate, store } from "@/lib/storage";
import type { Attempt } from "@/lib/types";

export function ProgressView() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  useEffect(() => { let active = true; void cloudHydrate().finally(() => { if (active) setAttempts(store.attempts().filter((item) => item.status === "completed").reverse()); }); return () => { active = false; }; }, []);
  const topicData = useMemo(() => {
    const values: Record<string, { earned: number; possible: number; missed: number }> = {};
    attempts.forEach((attempt) => attempt.quiz.questions.forEach((question) => { values[question.topic] ??= { earned:0, possible:0, missed:0 }; values[question.topic].earned += attempt.answers[question.id]?.pointsEarned ?? 0; values[question.topic].possible += question.points; if (attempt.answers[question.id]?.status !== "correct") values[question.topic].missed++; }));
    return Object.entries(values).map(([topic, value]) => ({ topic, accuracy: Math.round(value.earned/Math.max(1,value.possible)*100), missed: value.missed })).sort((a,b) => b.accuracy-a.accuracy);
  }, [attempts]);
  const typeData = useMemo(() => {
    const values: Record<string, { earned: number; possible: number }> = {};
    attempts.forEach((attempt) => attempt.quiz.questions.forEach((question) => { values[question.type] ??= { earned:0, possible:0 }; values[question.type].earned += attempt.answers[question.id]?.pointsEarned ?? 0; values[question.type].possible += question.points; }));
    return Object.entries(values).map(([type,value]) => ({ type: type.replaceAll("_"," "), accuracy: Math.round(value.earned/Math.max(1,value.possible)*100) })).sort((a,b)=>b.accuracy-a.accuracy);
  }, [attempts]);
  if (!attempts.length) return <div className="panel empty-state"><span className="empty-icon"><BarChart3/></span><h2>Your analytics need a little data</h2><p className="muted">Complete one or two quizzes and StudyForge will show honest trends instead of drawing conclusions from nothing.</p><Link className="button primary" href="/create">Start a quiz</Link></div>;
  const average = Math.round(attempts.reduce((sum,a)=>sum+a.percentage,0)/attempts.length);
  const avgTime = Math.round(attempts.reduce((sum,a)=>sum+a.timeSpentSeconds,0)/attempts.reduce((sum,a)=>sum+a.quiz.questions.length,0));
  const improvement = attempts.length > 1 ? attempts.at(-1)!.percentage-attempts[0].percentage : 0;
  return <>
    <div className="stats-grid"><div className="stat-card"><Target color="var(--accent)"/><div className="value">{average}%</div><span className="muted small">Overall accuracy</span></div><div className="stat-card"><TrendingUp color="var(--mint)"/><div className="value">{improvement >= 0 ? "+" : ""}{improvement}</div><span className="muted small">Point change</span></div><div className="stat-card"><Clock3 color="#e69b20"/><div className="value">{avgTime}s</div><span className="muted small">Average response</span></div><div className="stat-card"><BrainCircuit color="#9a67e8"/><div className="value">{topicData.filter((item)=>item.accuracy>=85).length}</div><span className="muted small">Mastered topics</span></div></div>
    <div className="two-col">
      <section className="card"><h3>Score history</h3><p className="small muted">Oldest to newest</p><div className="chart" aria-label="Quiz score history">{attempts.slice(-12).map((attempt,index) => <div className="chart-col" style={{ "--height": `${Math.max(8,attempt.percentage)}%` } as React.CSSProperties} title={`${attempt.percentage}% on ${new Date(attempt.completedAt!).toLocaleDateString()}`} key={attempt.id}><span>{attempt.percentage}</span><span className="sr-only">Attempt {index+1}: {attempt.percentage}%</span></div>)}</div></section>
      <section className="card"><h3>Accuracy by topic</h3>{topicData.slice(0,7).map((item) => <div className="bar-row" key={item.topic}><span className="small">{item.topic}</span><div className="progress-track"><div className="progress-fill" style={{ width: `${item.accuracy}%` }}/></div><strong className="small">{item.accuracy}%</strong></div>)}</section>
    </div>
    <div className="two-col" style={{ marginTop:18 }}>
      <section className="card"><h3>Accuracy by question type</h3>{typeData.map((item) => <div className="bar-row" key={item.type}><span className="small" style={{ textTransform:"capitalize" }}>{item.type}</span><div className="progress-track"><div className="progress-fill" style={{ width:`${item.accuracy}%` }}/></div><strong className="small">{item.accuracy}%</strong></div>)}</section>
      <section className="card"><p className="eyebrow">Most-missed concepts</p>{topicData.slice().sort((a,b)=>b.missed-a.missed).slice(0,4).map((item)=><div className="toggle-row" key={item.topic}><span><strong>{item.topic}</strong><br/><small className="muted">{item.accuracy >= 85 ? "Mastered" : item.accuracy >= 70 ? "Improving" : "Needs review"}</small></span><span className={`badge ${item.accuracy>=85?"green":item.accuracy>=70?"orange":""}`}>{item.missed} missed</span></div>)}<div className="success" style={{ marginTop:16 }}><Sparkles size={16} style={{verticalAlign:"middle",marginRight:6}}/>Review the lowest-accuracy topic next, then retest after a short break.</div></section>
    </div>
  </>;
}
