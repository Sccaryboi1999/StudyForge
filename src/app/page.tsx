import Link from "next/link";
import { ArrowRight, BookOpen, Check, FileText, LockKeyhole, SlidersHorizontal, Sparkles, Upload, WandSparkles } from "lucide-react";
import { DemoButton } from "@/components/demo-button";

export default function Home() {
  return <>
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <p className="eyebrow">Study smarter, from your own notes</p>
          <h1>Turn any study guide into a <span>personalized practice quiz.</span></h1>
          <p className="lede">Upload your notes, choose your difficulty, and practice with questions generated directly from your material.</p>
          <div className="hero-actions">
            <Link className="button primary" href="/create">Create a practice quiz <ArrowRight size={17} /></Link>
            <DemoButton secondary />
          </div>
          <div className="hero-note"><span><Check size={15} /> No account required</span><span><LockKeyhole size={15} /> Private by default</span><span><Sparkles size={15} /> Source-grounded</span></div>
        </div>
        <div className="demo-card" aria-label="Quiz interface preview">
          <div className="demo-top"><b>Computer Networking</b><span className="badge purple">Question 3 of 10</span></div>
          <div className="demo-body">
            <div className="progress-track"><div className="progress-fill" style={{ width: "30%" }} /></div>
            <p className="eyebrow" style={{ marginTop: 22 }}>OSI model · Medium</p>
            <p className="demo-question">Which device forwards packets between different networks?</p>
            {["Switch", "Router", "Access point", "Repeater"].map((answer, i) => <div className={`demo-option ${i === 1 ? "selected" : ""}`} key={answer}><span className="letter">{String.fromCharCode(65 + i)}</span>{answer}{i === 1 && <Check size={16} style={{ marginLeft: "auto", color: "#6959ec" }} />}</div>)}
          </div>
        </div>
      </div>
    </section>

    <section className="section alt">
      <div className="container">
        <div className="section-heading"><div><p className="eyebrow">Built for real studying</p><h2>Practice that stays accountable to your notes.</h2></div><p className="lede">Every explanation points back to the source, so you can correct mistakes without chasing mystery facts.</p></div>
        <div className="card-grid">
          <article className="card"><span className="feature-icon"><Upload /></span><h3>Bring your own material</h3><p>Paste text or upload TXT, Markdown, PDF, and DOCX files up to 10 MB.</p></article>
          <article className="card"><span className="feature-icon"><SlidersHorizontal /></span><h3>Make it yours</h3><p>Choose topics, difficulty, question types, feedback timing, hints, and quiz mode.</p></article>
          <article className="card"><span className="feature-icon"><WandSparkles /></span><h3>Learn from every answer</h3><p>Review source excerpts, explanations, weak topics, and practice only what you missed.</p></article>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <p className="eyebrow">How it works</p><h2 style={{ marginBottom: 40 }}>From study guide to stronger recall.</h2>
        <div className="step-grid">
          <article><div className="step-number">01 · ADD MATERIAL</div><h3>Upload or paste your guide</h3><p className="muted">We extract the text and flag anything that may need your attention.</p></article>
          <article><div className="step-number">02 · REVIEW & TUNE</div><h3>Fix the text and choose settings</h3><p className="muted">Select topics, difficulty, mode, feedback, and the number of questions.</p></article>
          <article><div className="step-number">03 · PRACTICE</div><h3>Answer, understand, improve</h3><p className="muted">Get precise scoring, explanations, source excerpts, and next-step guidance.</p></article>
        </div>
        <div className="supported" style={{ marginTop: 42 }}><span className="muted small">Supported:</span>{["Pasted text", "TXT", "Markdown", "PDF", "DOCX"].map((item) => <span className="file-pill" key={item}><FileText size={14} /> {item}</span>)}</div>
      </div>
    </section>

    <section className="section alt">
      <div className="container"><div className="privacy-band"><div><p className="eyebrow" style={{ color: "#a99eff" }}>Privacy by design</p><h2>Your study material is not a public prompt.</h2><p>Files are processed for your quiz, treated as untrusted content, and never exposed to other users. Guest work stays in this browser unless you choose an account.</p></div><LockKeyhole size={72} color="#9183ff" aria-hidden="true" /></div></div>
    </section>

    <section className="section" id="faq">
      <div className="narrow"><p className="eyebrow">Frequently asked</p><h2 style={{ marginBottom: 30 }}>Good questions before the quiz starts.</h2>
        <div className="faq">
          <details><summary>Do I need an account?</summary><p>No. The full upload, quiz, scoring, and review flow works as a guest. An account adds cross-device history and long-term analytics when Supabase is configured.</p></details>
          <details><summary>Will questions use facts outside my guide?</summary><p>Strict Source Mode is enabled by default. Every question, correct answer, explanation, and source excerpt must be supported by your material.</p></details>
          <details><summary>What if my guide is short?</summary><p>StudyForge generates fewer distinct questions rather than filling the quiz with weak or repetitive ones, and explains why.</p></details>
          <details><summary>Can I keep studying after I finish?</summary><p>Yes. Retake the quiz, generate a new one, or create a focused quiz from only missed questions and weak topics.</p></details>
        </div>
      </div>
    </section>

    <section className="section alt"><div className="narrow" style={{ textAlign: "center" }}><BookOpen size={42} color="var(--accent)" /><h2 style={{ marginTop: 16 }}>Ready to forge your next study session?</h2><p className="lede" style={{ margin: "14px auto 25px" }}>Your first source-grounded quiz is a few minutes away.</p><Link className="button primary" href="/create">Create a practice quiz <ArrowRight size={17} /></Link></div></section>
  </>;
}
