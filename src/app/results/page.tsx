import type { Metadata } from "next";
import { ResultsView } from "@/components/results-view";

export const metadata: Metadata = { title: "Quiz results" };
export default function ResultsPage() { return <ResultsView />; }
