import Link from "next/link";
import { Plus } from "lucide-react";
import { LibraryView } from "@/components/library-view";

export default function LibraryPage() { return <div className="page"><div className="container"><div className="page-header"><div><p className="eyebrow">Study guide library</p><h1>Your source material.</h1><p className="lede">Edit, reuse, download, archive, or turn any saved guide into a new quiz.</p></div><Link className="button primary" href="/create"><Plus size={17}/> Add guide</Link></div><LibraryView /></div></div>; }
