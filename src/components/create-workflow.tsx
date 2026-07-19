"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, FileText, Info, LockKeyhole, Sparkles, Upload, WandSparkles } from "lucide-react";
import { studyMetadata } from "@/lib/processing";
import { cloudSaveGuide, store } from "@/lib/storage";
import type { QuestionType, QuizSettings, StudyGuide } from "@/lib/types";

type Extracted = ReturnType<typeof studyMetadata> & { fileName: string; fileType: string };
const typeOptions: { value: QuestionType; label: string; help: string }[] = [
  { value: "multiple_choice", label: "Multiple choice", help: "One supported answer" },
  { value: "true_false", label: "True or false", help: "Fast recognition" },
  { value: "fill_blank", label: "Fill in the blank", help: "Recall key wording" },
  { value: "short_answer", label: "Short answer", help: "Explain in your own words" },
  { value: "scenario", label: "Scenario-based", help: "Apply a concept" },
];

const defaultSettings: QuizSettings = {
  questionCount: 10, difficulty: "mixed", mode: "practice", questionTypes: ["multiple_choice", "true_false", "short_answer"], selectedTopics: [], strictSource: true,
  shuffleQuestions: true, shuffleChoices: true, allowHints: true, allowSkipping: true, allowChanges: true, showSources: true, feedback: "immediate", timerMinutes: 0,
};

export function CreateWorkflow() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);

  useEffect(() => {
    const demo = sessionStorage.getItem("studyforge:demo");
    if (demo) {
      try { const value = JSON.parse(demo); setTitle(value.title); setText(value.text); setSubject("Computer Science"); }
      finally { sessionStorage.removeItem("studyforge:demo"); }
    }
  }, []);

  const liveMeta = useMemo(() => studyMetadata(text), [text]);
  const metadata = extracted ? { ...extracted, ...liveMeta } : { ...liveMeta, fileName: "Pasted study material", fileType: "text" };

  const prepareReview = () => {
    setError("");
    if (text.trim().length < 80) { setError("Add at least 80 characters of study material so there is enough context for a useful quiz."); return; }
    if (!title.trim()) setTitle(extracted?.fileName.replace(/\.[^.]+$/, "") ?? "Untitled study guide");
    setExtracted((current) => current ?? { ...studyMetadata(text), fileName: "Pasted study material", fileType: "text" });
    setStep(2);
  };

  async function handleFile(file?: File) {
    if (!file) return;
    setError(""); setLoading(true);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/extract", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setExtracted(data); setText(data.text); setTitle(file.name.replace(/\.[^.]+$/, "")); setStep(2);
    } catch (err) { setError(err instanceof Error ? err.message : "The file could not be read."); }
    finally { setLoading(false); }
  }

  const toggleType = (value: QuestionType) => setSettings((current) => ({ ...current, questionTypes: current.questionTypes.includes(value) ? current.questionTypes.filter((item) => item !== value) : [...current.questionTypes, value] }));
  const toggleTopic = (topic: string) => setSettings((current) => ({ ...current, selectedTopics: current.selectedTopics.includes(topic) ? current.selectedTopics.filter((item) => item !== topic) : [...current.selectedTopics, topic] }));

  async function generate() {
    if (!settings.questionTypes.length) { setError("Choose at least one question type."); return; }
    setLoading(true); setError(""); setLoadingStage(0);
    const timer = window.setInterval(() => setLoadingStage((current) => Math.min(4, current + 1)), 700);
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ guide: { title, text, topics: metadata.topics }, settings }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Quiz generation failed.");
      const now = new Date().toISOString();
      const guide: StudyGuide = { id: `guide_${Date.now().toString(36)}`, title, subject, originalFileName: extracted?.fileName, fileType: extracted?.fileType ?? "text", text, wordCount: metadata.wordCount, characterCount: metadata.characterCount, headingCount: metadata.headingCount, topics: metadata.topics, warnings: [...metadata.warnings, ...(data.warnings ?? [])], createdAt: now, updatedAt: now };
      store.saveGuide(guide); void cloudSaveGuide(guide); store.setCurrentQuiz(data.quiz); store.setCurrentAttempt(null);
      router.push("/quiz");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not prepare the quiz."); setLoading(false); }
    finally { window.clearInterval(timer); }
  }

  if (loading && step === 3) {
    const stages = ["Organizing topics", "Building source-grounded questions", "Validating every answer", "Checking for duplicates", "Preparing your quiz"];
    return <div className="panel"><div className="panel-body" style={{ textAlign: "center", padding: "70px 24px" }}>
      <span className="feature-icon" style={{ margin: "0 auto 24px", width: 58, height: 58 }}><WandSparkles /></span>
      <h2>Forging your quiz</h2><p className="muted">{stages[loadingStage]}…</p>
      <div className="progress-track" style={{ maxWidth: 420, margin: "24px auto" }}><div className="progress-fill" style={{ width: `${(loadingStage + 1) * 20}%` }} /></div>
      <p className="small muted"><LockKeyhole size={14} style={{ verticalAlign: "middle" }} /> Your study guide is treated as private, untrusted source material.</p>
    </div></div>;
  }

  return <>
    <div className="wizard-steps" aria-label="Quiz creation progress">
      {["Add material", "Review content", "Quiz setup"].map((label, index) => <div className={`wizard-step ${step === index + 1 ? "active" : step > index + 1 ? "done" : ""}`} key={label}><span>{step > index + 1 ? <Check size={14} /> : index + 1}</span>{label}</div>)}
    </div>
    {error && <div className="error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

    {step === 1 && <div className="panel">
      <div className="panel-head"><div><h3>Add your study material</h3><p className="muted small" style={{ margin: "4px 0 0" }}>Use only material you have permission to process.</p></div><span className="badge green"><LockKeyhole size={13} /> Private</span></div>
      <div className="panel-body">
        <div className="tabs" role="tablist"><button className={`tab ${tab === "paste" ? "active" : ""}`} onClick={() => setTab("paste")} role="tab" aria-selected={tab === "paste"}>Paste text</button><button className={`tab ${tab === "upload" ? "active" : ""}`} onClick={() => setTab("upload")} role="tab" aria-selected={tab === "upload"}>Upload file</button></div>
        <div style={{ marginTop: 22 }}>
          {tab === "paste" ? <>
            <div className="field"><label htmlFor="guide-title">Study guide title</label><input className="input" id="guide-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Biology Midterm Review" maxLength={120} /></div>
            <div className="field"><label htmlFor="guide-text">Study material</label><textarea className="textarea" id="guide-text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste headings, definitions, important facts, processes, dates, or existing questions here…" /><span className="small muted">{liveMeta.wordCount.toLocaleString()} words · {liveMeta.characterCount.toLocaleString()} characters</span></div>
          </> : <div className={`upload-zone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void handleFile(event.dataTransfer.files[0]); }}>
            <span className="upload-icon"><Upload /></span><h3>Drop your study guide here</h3><p className="muted">TXT, Markdown, PDF, or DOCX · up to 10 MB</p>
            <input ref={inputRef} className="sr-only" type="file" accept=".txt,.md,.markdown,.pdf,.docx" onChange={(event) => void handleFile(event.target.files?.[0])} />
            <button className="button secondary" onClick={() => inputRef.current?.click()} disabled={loading}>{loading ? <><span className="loader" /> Extracting text…</> : "Browse files"}</button>
          </div>}
        </div>
        <div className="actions"><span /><button className="button primary" onClick={prepareReview}>Review material <ArrowRight size={17} /></button></div>
      </div>
    </div>}

    {step === 2 && <div className="panel">
      <div className="panel-head"><div><h3>Review extracted content</h3><p className="muted small" style={{ margin: "4px 0 0" }}>Correct formatting and remove anything irrelevant before generation.</p></div><span className="badge purple"><FileText size={13} /> {metadata.fileType.toUpperCase()}</span></div>
      <div className="panel-body">
        <div className="two-col"><div className="field"><label htmlFor="review-title">Title</label><input className="input" id="review-title" value={title} onChange={(event) => setTitle(event.target.value)} /></div><div className="field"><label htmlFor="subject">Subject or class <span className="muted">(optional)</span></label><input className="input" id="subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Computer Science" /></div></div>
        <div className="meta-grid"><div className="meta"><strong>{metadata.wordCount.toLocaleString()}</strong><span>Words</span></div><div className="meta"><strong>{metadata.characterCount.toLocaleString()}</strong><span>Characters</span></div><div className="meta"><strong>{metadata.headingCount}</strong><span>Headings</span></div><div className="meta"><strong>{metadata.topics.length}</strong><span>Topics</span></div></div>
        {metadata.warnings.map((warning) => <div className="warning" key={warning} style={{ marginBottom: 10 }}><AlertTriangle size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />{warning}</div>)}
        <div className="field"><label htmlFor="review-text">Editable source text</label><textarea className="textarea" id="review-text" value={text} onChange={(event) => setText(event.target.value)} style={{ minHeight: 380 }} /></div>
        <div><span className="label">Detected topics</span><div className="supported" style={{ marginTop: 9 }}>{metadata.topics.map((topic) => <span className="file-pill" key={topic}>{topic}</span>)}</div></div>
        <div className="actions"><button className="button secondary" onClick={() => setStep(1)}><ArrowLeft size={17} /> Back</button><button className="button primary" onClick={() => { if (text.trim().length < 80) setError("Keep at least 80 characters of source material."); else { setError(""); setStep(3); } }}>Choose quiz settings <ArrowRight size={17} /></button></div>
      </div>
    </div>}

    {step === 3 && <div className="panel">
      <div className="panel-head"><div><h3>Customize your quiz</h3><p className="muted small" style={{ margin: "4px 0 0" }}>Fine-tune the session or keep the balanced defaults.</p></div><span className="badge purple"><Sparkles size={13} /> {settings.questionCount} questions</span></div>
      <div className="panel-body">
        <div className="two-col">
          <div>
            <div className="field"><label htmlFor="question-count">Number of questions</label><select className="select" id="question-count" value={settings.questionCount} onChange={(event) => setSettings({ ...settings, questionCount: Number(event.target.value) })}>{[5,10,15,20,25,50].map((count) => <option value={count} key={count}>{count}</option>)}</select></div>
            <div className="field"><label htmlFor="difficulty">Difficulty</label><select className="select" id="difficulty" value={settings.difficulty} onChange={(event) => setSettings({ ...settings, difficulty: event.target.value as QuizSettings["difficulty"] })}>{["easy","medium","hard","mixed","adaptive"].map((item) => <option value={item} key={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></div>
          </div>
          <div>
            <div className="field"><label htmlFor="quiz-mode">Quiz mode</label><select className="select" id="quiz-mode" value={settings.mode} onChange={(event) => { const mode = event.target.value as QuizSettings["mode"]; setSettings({ ...settings, mode, feedback: mode === "exam" ? "end" : "immediate", allowHints: mode !== "exam" }); }}>{[["practice","Practice · immediate feedback"],["exam","Exam · results at end"],["study","Study · hints & sources"],["adaptive","Adaptive · difficulty adjusts"],["flashcard","Flashcards · concept review"]].map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></div>
            <div className="field"><label htmlFor="timer">Total timer</label><select className="select" id="timer" value={settings.timerMinutes} onChange={(event) => setSettings({ ...settings, timerMinutes: Number(event.target.value) })}>{[[0,"No timer"],[5,"5 minutes"],[10,"10 minutes"],[20,"20 minutes"],[30,"30 minutes"],[60,"60 minutes"]].map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></div>
          </div>
        </div>
        <div className="field"><span className="label">Question types</span><div className="choice-grid">{typeOptions.map((item) => <label className="choice-card" key={item.value}><input type="checkbox" checked={settings.questionTypes.includes(item.value)} onChange={() => toggleType(item.value)} /><span><strong>{item.label}</strong><small>{item.help}</small></span></label>)}</div></div>
        <div className="field" style={{ marginTop: 24 }}><span className="label">Topics <span className="muted">(none selected means all)</span></span><div className="choice-grid">{metadata.topics.map((topic) => <label className="choice-card" key={topic}><input type="checkbox" checked={settings.selectedTopics.includes(topic)} onChange={() => toggleTopic(topic)} /><span><strong>{topic}</strong><small>Include in this quiz</small></span></label>)}</div></div>
        <div className="card" style={{ boxShadow: "none", marginTop: 24 }}>
          <div className="toggle-row"><span><strong>Strict Source Mode</strong><br/><small className="muted">Only use facts supported by this guide.</small></span><input aria-label="Strict Source Mode" className="toggle" type="checkbox" checked={settings.strictSource} onChange={(event) => setSettings({ ...settings, strictSource: event.target.checked })} /></div>
          {!settings.strictSource && <div className="warning" style={{ margin: "10px 0" }}><Info size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Expanded Learning Mode may add general background knowledge beyond your guide.</div>}
          {[ ["shuffleQuestions","Shuffle question order"], ["shuffleChoices","Shuffle answer choices"], ["allowHints","Allow hints"], ["allowSkipping","Allow skipping"], ["allowChanges","Allow answer changes"], ["showSources","Show source references"] ].map(([key,label]) => <div className="toggle-row" key={key}><span>{label}</span><input aria-label={label} className="toggle" type="checkbox" checked={Boolean(settings[key as keyof QuizSettings])} onChange={(event) => setSettings({ ...settings, [key]: event.target.checked })} /></div>)}
        </div>
        <div className="actions"><button className="button secondary" onClick={() => setStep(2)}><ArrowLeft size={17} /> Back</button><button className="button primary" onClick={() => void generate()}><WandSparkles size={17} /> Generate quiz</button></div>
      </div>
    </div>}
  </>;
}
