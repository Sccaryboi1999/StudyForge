import type { Metadata } from "next";
import "./globals.css";
import { Footer, Header } from "@/components/app-shell";

export const metadata: Metadata = {
  title: { default: "StudyForge AI", template: "%s · StudyForge AI" },
  description: "Turn any study guide into a personalized, source-grounded practice quiz.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>
    <a className="skip-link" href="#main">Skip to content</a>
    <Header />
    <main id="main">{children}</main>
    <Footer />
  </body></html>;
}
