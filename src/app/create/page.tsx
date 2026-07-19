import type { Metadata } from "next";
import { CreateWorkflow } from "@/components/create-workflow";

export const metadata: Metadata = { title: "Create a quiz" };

export default function CreatePage() {
  return <div className="page"><div className="narrow"><div className="page-header"><div><p className="eyebrow">New study session</p><h1>Forge a quiz from your notes.</h1><p className="lede">Add material, review the extracted text, then shape the practice session you need.</p></div></div><CreateWorkflow /></div></div>;
}
