import type { Metadata } from "next";
import { QuizPlayer } from "@/components/quiz-player";

export const metadata: Metadata = { title: "Practice quiz" };
export default function QuizPage() { return <QuizPlayer />; }
