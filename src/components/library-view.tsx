"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, BookOpen, Copy, Download, MoreHorizontal, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { cloudDeleteGuide, cloudHydrate, cloudSaveGuide, store } from "@/lib/storage";
import type { StudyGuide } from "@/lib/types";

export function LibraryView() {
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [toast, setToast] = useState("");
  useEffect(() => { let active = true; void cloudHydrate().finally(() => { if (active) setGuides(store.guides()); }); return () => { active = false; }; }, []);
  const edit = (guide: StudyGuide) => { sessionStorage.setItem("studyforge:demo", JSON.stringify({ title: guide.title, text: guide.text })); window.location.href = "/create"; };
  const duplicate = (guide: StudyGuide) => { const copy = { ...guide, id: `guide_${Date.now().toString(36)}`, title: `${guide.title} copy`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; store.saveGuide(copy); void cloudSaveGuide(copy); setGuides(store.guides()); setToast("Study guide duplicated."); };
  const archive = (guide: StudyGuide) => { const updated = { ...guide, archived: !guide.archived, updatedAt: new Date().toISOString() }; store.saveGuide(updated); void cloudSaveGuide(updated); setGuides(store.guides()); };
  const remove = (guide: StudyGuide) => { if (!window.confirm(`Permanently delete “${guide.title}”? This cannot be undone.`)) return; store.deleteGuide(guide.id); void cloudDeleteGuide(guide.id); setGuides(store.guides()); };
  const visible = guides.filter((guide) => Boolean(guide.archived) === showArchived);
  return <>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20 }}><div className="tabs" style={{ width: 260 }}><button className={`tab ${!showArchived ? "active" : ""}`} onClick={() => setShowArchived(false)}>Active</button><button className={`tab ${showArchived ? "active" : ""}`} onClick={() => setShowArchived(true)}>Archived</button></div><span className="small muted">{visible.length} guide{visible.length === 1 ? "" : "s"}</span></div>
    {visible.length ? <div className="library-grid">{visible.map((guide) => <article className="card guide-card" key={guide.id}><div style={{ display: "flex", justifyContent: "space-between" }}><span className="feature-icon" style={{ marginBottom: 20 }}><BookOpen size={21}/></span><MoreHorizontal className="muted" aria-hidden="true"/></div><h3>{guide.title}</h3><p className="small muted" style={{ margin: "7px 0" }}>{guide.subject || "Uncategorized"} · {guide.fileType.toUpperCase()} · {guide.wordCount.toLocaleString()} words</p><div className="topic-list">{guide.topics.slice(0,3).map((topic) => <span className="badge" key={topic}>{topic}</span>)}</div><div className="card-actions"><button className="button primary" onClick={() => edit(guide)}><Sparkles size={15}/> Quiz</button><button className="icon-button" style={{ color: "var(--muted)", borderColor: "var(--line)" }} onClick={() => edit(guide)} aria-label={`Edit ${guide.title}`}><Pencil size={16}/></button><button className="icon-button" style={{ color: "var(--muted)", borderColor: "var(--line)" }} onClick={() => duplicate(guide)} aria-label={`Duplicate ${guide.title}`}><Copy size={16}/></button><button className="icon-button" style={{ color: "var(--muted)", borderColor: "var(--line)" }} onClick={() => { const url = URL.createObjectURL(new Blob([guide.text], { type: "text/plain" })); const a=document.createElement("a"); a.href=url; a.download=`${guide.title}.txt`; a.click(); URL.revokeObjectURL(url); }} aria-label={`Download ${guide.title}`}><Download size={16}/></button></div><div className="card-actions" style={{ marginTop: 9 }}><button className="button ghost" onClick={() => archive(guide)}><Archive size={15}/> {guide.archived ? "Restore" : "Archive"}</button><button className="button ghost" style={{ color: "var(--danger)" }} onClick={() => remove(guide)}><Trash2 size={15}/> Delete</button></div></article>)}</div> : <div className="panel empty-state"><span className="empty-icon"><BookOpen/></span><h2>{showArchived ? "No archived guides" : "Build your study library"}</h2><p className="muted">{showArchived ? "Archived study guides will be kept here." : "Your uploaded and pasted material will be saved here automatically."}</p>{!showArchived && <Link className="button primary" href="/create"><Plus size={17}/> Add study guide</Link>}</div>}
    {toast && <div className="toast" role="status" onAnimationEnd={() => setTimeout(() => setToast(""), 2200)}>{toast}</div>}
  </>;
}
