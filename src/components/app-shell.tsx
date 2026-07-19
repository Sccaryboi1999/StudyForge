"use client";

import Link from "next/link";
import { BookOpenCheck, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { store } from "@/lib/storage";

export function Logo() {
  return <Link className="brand" href="/" aria-label="StudyForge AI home"><span className="brand-mark"><BookOpenCheck size={20} aria-hidden="true" /></span><span>StudyForge <b>AI</b></span></Link>;
}

export function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const saved = store.theme();
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next); store.setTheme(next); document.documentElement.dataset.theme = next;
  };
  const links = [["Dashboard", "/dashboard"], ["Library", "/library"], ["History", "/history"], ["Progress", "/progress"]];
  return <header className="topbar">
    <div className="container nav-wrap">
      <Logo />
      <nav className="nav-links" aria-label="Main navigation">
        {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        <button onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />}</button>
        <Link href="/auth">Sign in</Link>
        <Link className="nav-cta" href="/create">Create a quiz</Link>
      </nav>
      <div className="mobile-nav">
        <button className="icon-button" onClick={toggleTheme} aria-label="Toggle color theme">{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
        <button className="icon-button" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
      </div>
    </div>
    {open && <nav className="mobile-panel" aria-label="Mobile navigation">
      {links.map(([label, href]) => <Link href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>)}
      <Link href="/create" onClick={() => setOpen(false)}>Create a quiz</Link>
      <Link href="/auth" onClick={() => setOpen(false)}>Sign in</Link>
    </nav>}
  </header>;
}

export function Footer() {
  return <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div><Logo /><p className="small">Grounded practice from the material you already trust.</p></div>
        <div><h3>Study</h3><Link href="/create">Create quiz</Link><Link href="/library">Study guides</Link><Link href="/history">Quiz history</Link></div>
        <div><h3>About</h3><Link href="/privacy">Privacy & security</Link><Link href="/#faq">FAQ</Link><Link href="/auth">Account</Link></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} StudyForge AI</span><span>Your notes stay private by default.</span></div>
    </div>
  </footer>;
}
