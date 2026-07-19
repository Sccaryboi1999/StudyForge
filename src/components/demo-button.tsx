"use client";

import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { DEMO_GUIDE, DEMO_TITLE } from "@/lib/demo";

export function DemoButton({ secondary = false }: { secondary?: boolean }) {
  const router = useRouter();
  return <button className={`button ${secondary ? "secondary" : "primary"}`} onClick={() => {
    sessionStorage.setItem("studyforge:demo", JSON.stringify({ title: DEMO_TITLE, text: DEMO_GUIDE }));
    router.push("/create?demo=1");
  }}><Play size={17} fill="currentColor" /> Try the demo</button>;
}
