import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardView } from "@/components/dashboard-view";

export default function DashboardPage() { return <div className="page"><div className="container"><div className="page-header"><div><p className="eyebrow">Your learning dashboard</p><h1>Good to see you.</h1><p className="lede">Keep momentum, spot weak areas, and choose the next useful session.</p></div><Link className="button primary" href="/create"><Plus size={17}/> Create new quiz</Link></div><DashboardView /></div></div>; }
