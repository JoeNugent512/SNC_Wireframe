import { useState } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight, ArrowLeft, FileText, DollarSign, CalendarDays, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { Label } from "@/components/ui/label";

type Tab = "charter" | "funding" | "schedule";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{children}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function ReadonlyField({ label, value, url }: { label: string; value: string; url?: boolean }) {
  return (
    <div>
      <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1.5 block">{label}</Label>
      {url && value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#1a6ea8] hover:underline font-medium flex items-center gap-1 break-all"
        >
          {value} <ExternalLink size={12} className="flex-shrink-0" />
        </a>
      ) : (
        <div className="text-sm font-medium text-slate-800">{value || <span className="text-slate-400 italic">—</span>}</div>
      )}
    </div>
  );
}

function YesNoBadge({ value }: { value: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      value ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
    }`}>
      {value ? "Yes" : "No"}
    </span>
  );
}

/* ── Fiscal-Year Funding Plan (Settings > Funding tab) ──────────── */


function FyCell({ value, editable, onChange }: { value: number; editable?: boolean; onChange?: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const display = value === 0 ? "—" : fmt(value);
  if (!editable) return <span className="tabular-nums">{display}</span>;
  if (editing) {
    return (
      <input autoFocus type="text" value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => { onChange?.(parseInt(raw) || 0); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange?.(parseInt(raw) || 0); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full text-right text-sm border border-amber-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-300 tabular-nums bg-white"
        style={{ minWidth: 80 }}
      />
    );
  }
  return (
    <button onClick={() => { setRaw(String(value)); setEditing(true); }}
      className="w-full text-right text-sm text-slate-800 tabular-nums hover:underline decoration-dotted underline-offset-2 focus:outline-none">
      {display}
    </button>
  );
}

function FundingTable({ budget, projectNumber }: { budget: number; projectNumber: string }) {
  const b = budget;
  const baseYear = parseInt(projectNumber.slice(0, 2), 10); // e.g. 25
  const years = [baseYear - 2, baseYear - 1, baseYear].map((y) => `FY${String(y).padStart(2, "0")}`);
  // e.g. ["FY23","FY24","FY25"]

  /* PLAN rows: [FY-2, FY-1, FY] — editable */
  const [planLabor,   setPlanLabor]   = useState([Math.round(b * 0.10), Math.round(b * 0.30), Math.round(b * 0.27)]);
  const [planTravel,  setPlanTravel]  = useState([Math.round(b * 0.00), Math.round(b * 0.02), Math.round(b * 0.01)]);
  const [planOther,   setPlanOther]   = useState([Math.round(b * 0.00), Math.round(b * 0.10), Math.round(b * 0.20)]);

  const approvedBudget = budget;

  const planTotals = years.map((_, i) => planLabor[i] + planTravel[i] + planOther[i]);
  const totalPlanned = planTotals.reduce((s, v) => s + v, 0);
  const leftToPlan = approvedBudget - totalPlanned;

  /* STATUS rows: Plan/Com/Obl for each category — read-only */
  const status = {
    labor:  { plan: planLabor, com: planLabor.map((v) => Math.round(v * 0.95)), obl: planLabor.map((v) => Math.round(v * 0.80)) },
    travel: { plan: planTravel, com: planTravel.map((v) => Math.round(v * 1.00)), obl: planTravel.map((v) => Math.round(v * 0.90)) },
    other:  { plan: planOther, com: planOther.map((v, i) => i < years.length - 1 ? Math.round(v * 0.98) : Math.round(v * 0.60)), obl: planOther.map((v, i) => i < years.length - 1 ? Math.round(v * 0.95) : Math.round(v * 0.40)) },
  };
  const totalStatus = {
    plan: years.map((_, i) => status.labor.plan[i] + status.travel.plan[i] + status.other.plan[i]),
    com:  years.map((_, i) => status.labor.com[i]  + status.travel.com[i]  + status.other.com[i]),
    obl:  years.map((_, i) => status.labor.obl[i]  + status.travel.obl[i]  + status.other.obl[i]),
  };
  const atc  = years.map((_, i) => totalStatus.com[i] - totalStatus.obl[i]);
  const auob = years.map((_, i) => totalStatus.plan[i] - totalStatus.com[i]);

  const thBase = "px-4 py-2.5 text-xs font-semibold uppercase tracking-wide";
  const navyBg = { backgroundColor: "#1a3557" };
  const amberBg = "#fffbeb";
  const amberBd = "1px solid #fcd34d";
  const blueCellBg = "#eff6ff";
  const blueBd = "1px solid #bfdbfe";

  const setVal = (arr: number[], setArr: (a: number[]) => void, i: number) => (v: number) => {
    const next = [...arr]; next[i] = v; setArr(next);
  };

  return (
    <div className="space-y-6">

      {/* ── PROJECT FUNDING PLAN ────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        {/* title bar */}
        <div className="px-5 py-3 flex items-center justify-between" style={navyBg}>
          <span className="text-white font-bold tracking-wide text-sm">Project Funding Plan</span>
          <span className="text-xs text-blue-300">Approved Budget: {fmt(approvedBudget)}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th className={`${thBase} text-left text-slate-500 bg-slate-50`} style={{ minWidth: 120 }}>Category</th>
                {years.map((fy) => (
                  <th key={fy} className={`${thBase} text-right`} style={{ backgroundColor: amberBg, color: "#92400e", borderLeft: amberBd, width: 110 }}>
                    {fy}
                  </th>
                ))}
                <th className={`${thBase} text-right text-slate-600 bg-slate-100`} style={{ borderLeft: "1px solid #e2e8f0", width: 110 }}>Total</th>
                <th className={`${thBase} text-right`} style={{ backgroundColor: "#1a6ea8", color: "white", borderLeft: blueBd, width: 110 }}>Total Planned</th>
                <th className={`${thBase} text-right`} style={{ backgroundColor: "#1a6ea8", color: "white", borderLeft: blueBd, width: 110 }}>Left to Plan</th>
              </tr>
            </thead>
            <tbody>
              {/* Labor */}
              <tr style={{ borderBottom: "1px solid #fef9c3" }}>
                <td className="px-4 py-2.5 text-slate-700 font-semibold bg-slate-50">Labor</td>
                {planLabor.map((v, i) => (
                  <td key={i} className="px-3 py-2.5" style={{ backgroundColor: amberBg, borderLeft: amberBd }}>
                    <FyCell value={v} editable onChange={setVal(planLabor, setPlanLabor, i)} />
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right font-semibold text-slate-700 bg-slate-50" style={{ borderLeft: "1px solid #e2e8f0" }}>{fmt(planLabor.reduce((s, v) => s + v, 0))}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-700" style={{ backgroundColor: blueCellBg, borderLeft: blueBd }}>{fmt(totalPlanned)}</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${leftToPlan >= 0 ? "text-emerald-700" : "text-red-600"}`} style={{ backgroundColor: leftToPlan >= 0 ? "#ecfdf5" : "#fef2f2", borderLeft: blueBd }}>{fmt(leftToPlan)}</td>
              </tr>
              {/* Travel */}
              <tr style={{ borderBottom: "1px solid #fef9c3" }}>
                <td className="px-4 py-2.5 text-slate-700 font-semibold bg-slate-50">Travel</td>
                {planTravel.map((v, i) => (
                  <td key={i} className="px-3 py-2.5" style={{ backgroundColor: amberBg, borderLeft: amberBd }}>
                    <FyCell value={v} editable onChange={setVal(planTravel, setPlanTravel, i)} />
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right font-semibold text-slate-700 bg-slate-50" style={{ borderLeft: "1px solid #e2e8f0" }}>{fmt(planTravel.reduce((s, v) => s + v, 0))}</td>
                <td colSpan={2} className="bg-slate-50" style={{ borderLeft: blueBd }} />
              </tr>
              {/* Other */}
              <tr style={{ borderBottom: "1px solid #fef9c3" }}>
                <td className="px-4 py-2.5 text-slate-700 font-semibold bg-slate-50">OutSource / Other</td>
                {planOther.map((v, i) => (
                  <td key={i} className="px-3 py-2.5" style={{ backgroundColor: amberBg, borderLeft: amberBd }}>
                    <FyCell value={v} editable onChange={setVal(planOther, setPlanOther, i)} />
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right font-semibold text-slate-700 bg-slate-50" style={{ borderLeft: "1px solid #e2e8f0" }}>{fmt(planOther.reduce((s, v) => s + v, 0))}</td>
                <td colSpan={2} className="bg-slate-50" style={{ borderLeft: blueBd }} />
              </tr>
              {/* TOTAL row */}
              <tr style={{ borderTop: "2px solid #94a3b8" }}>
                <td className="px-4 py-2.5 text-xs text-slate-500 uppercase font-bold tracking-wide bg-slate-100">Total</td>
                {planTotals.map((v, i) => (
                  <td key={i} className="px-4 py-2.5 text-right font-bold text-slate-800 tabular-nums" style={{ backgroundColor: "#fef3c7", borderLeft: amberBd }}>{fmt(v)}</td>
                ))}
                <td className="px-4 py-2.5 text-right font-bold text-slate-800 tabular-nums bg-slate-100" style={{ borderLeft: "1px solid #e2e8f0" }}>{fmt(totalPlanned)}</td>
                <td colSpan={2} className="bg-slate-100" style={{ borderLeft: blueBd }} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PROJECT FUNDING STATUS ──────────────────────────────── */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="px-5 py-3 flex items-center justify-between" style={navyBg}>
          <span className="text-white font-bold tracking-wide text-sm">Project Funding Status</span>
          <span className="text-xs text-blue-300">Import Macro last run: 14 Nov 2025 · It's now {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th className={`${thBase} text-left text-slate-500 bg-slate-50`} style={{ minWidth: 100 }}>Category</th>
                <th className={`${thBase} text-left text-slate-500 bg-slate-50`} style={{ width: 50, borderLeft: "1px solid #e2e8f0" }}></th>
                {years.map((fy) => (
                  <th key={fy} className={`${thBase} text-right text-white`} style={{ backgroundColor: "#1a6ea8", borderLeft: blueBd, width: 120 }}>{fy}</th>
                ))}
                <th className={`${thBase} text-right text-white`} style={{ backgroundColor: "#1a3557", borderLeft: "1px solid #1e4a7a", width: 110 }}>Totals</th>
              </tr>
            </thead>
            <tbody>
              {(["Labor","Travel","OutSource / Other"] as const).map((cat, ci) => {
                const key = (["labor","travel","other"] as const)[ci];
                const s = status[key];
                return (["Plan","Com","Obl"] as const).map((sub, si) => {
                  const vals = s[sub.toLowerCase() as "plan" | "com" | "obl"];
                  const total = vals.reduce((a, v) => a + v, 0);
                  const isFirst = si === 0;
                  const rowBg = ci % 2 === 0 ? "#ffffff" : "#f8fafc";
                  return (
                    <tr key={`${cat}-${sub}`} style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: rowBg }}>
                      <td className="px-4 py-1.5 text-slate-700 font-semibold" style={{ verticalAlign: "middle" }}>
                        {isFirst ? cat : ""}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-slate-400 font-mono" style={{ borderLeft: "1px solid #e2e8f0" }}>{sub}</td>
                      {vals.map((v, i) => (
                        <td key={i} className="px-4 py-1.5 text-right text-slate-700 tabular-nums" style={{ borderLeft: blueBd }}>{v === 0 ? "—" : fmt(v)}</td>
                      ))}
                      <td className="px-4 py-1.5 text-right font-semibold text-slate-800 tabular-nums" style={{ backgroundColor: blueCellBg, borderLeft: "1px solid #1e4a7a" }}>{total === 0 ? "—" : fmt(total)}</td>
                    </tr>
                  );
                });
              })}

              {/* TOTAL rows */}
              {(["Plan","Com","Obl"] as const).map((sub, si) => {
                const vals = totalStatus[sub.toLowerCase() as "plan" | "com" | "obl"];
                const total = vals.reduce((a, v) => a + v, 0);
                return (
                  <tr key={`total-${sub}`} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                    <td className="px-4 py-1.5 text-xs text-slate-500 uppercase tracking-wide font-bold">{si === 0 ? "Total" : ""}</td>
                    <td className="px-3 py-1.5 text-xs text-slate-400 font-mono" style={{ borderLeft: "1px solid #e2e8f0" }}>{sub}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="px-4 py-1.5 text-right font-bold text-slate-800 tabular-nums" style={{ borderLeft: blueBd }}>{fmt(v)}</td>
                    ))}
                    <td className="px-4 py-1.5 text-right font-bold text-slate-800 tabular-nums" style={{ backgroundColor: blueCellBg, borderLeft: "1px solid #1e4a7a" }}>{fmt(total)}</td>
                  </tr>
                );
              })}

              {/* AtC / AUob */}
              {[
                { label: "AtC", labelFull: "Available to Commit", vals: atc },
                { label: "AUob", labelFull: "Available Unobligated", vals: auob },
              ].map(({ label, labelFull, vals }) => (
                <tr key={label} style={{ borderTop: "1px solid #cbd5e1", backgroundColor: "#f0f9ff" }}>
                  <td className="px-4 py-1.5 text-xs text-blue-700 font-semibold">{labelFull}</td>
                  <td className="px-3 py-1.5 text-xs text-blue-500 font-mono" style={{ borderLeft: "1px solid #e2e8f0" }}>{label}</td>
                  {vals.map((v, i) => (
                    <td key={i} className={`px-4 py-1.5 text-right text-xs font-semibold tabular-nums ${v < 0 ? "text-red-600" : "text-blue-700"}`} style={{ borderLeft: blueBd }}>{fmt(v)}</td>
                  ))}
                  <td className="px-4 py-1.5 text-right text-xs font-semibold tabular-nums text-blue-700" style={{ backgroundColor: blueCellBg, borderLeft: "1px solid #1e4a7a" }}>{fmt(vals.reduce((a, v) => a + v, 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ScheduleTab({ startDate, endDate }: { startDate: string; endDate: string }) {
  const milestones = [
    { name: "Awarded / Started",                pct: 0,   required: true,  planned: startDate,    actual: startDate,    status: "complete"    },
    { name: "Kickoff Meeting",                  pct: 1,   required: false, planned: "2024-02-01", actual: "2024-02-03", status: "complete"    },
    { name: "Outline / Concept Review",         pct: 10,  required: false, planned: "2024-04-01", actual: "2024-04-08", status: "complete"    },
    { name: "Outline Comments Resolved",        pct: 15,  required: false, planned: "2024-05-01", actual: "2024-05-10", status: "complete"    },
    { name: "35% Review",                       pct: 30,  required: false, planned: "2024-07-15", actual: "2024-07-18", status: "complete"    },
    { name: "35% Comments Resolved",            pct: 35,  required: false, planned: "2024-08-15", actual: null,         status: "in-progress" },
    { name: "Interim Review",                   pct: 60,  required: true,  planned: "2024-12-01", actual: null,         status: "upcoming"    },
    { name: "Interim Review Comments Resolved", pct: 65,  required: false, planned: "2025-01-15", actual: null,         status: "upcoming"    },
    { name: "Pre-Final Review",                 pct: 90,  required: true,  planned: "2025-06-01", actual: null,         status: "upcoming"    },
    { name: "Pre-Final Comments Resolved",      pct: 95,  required: false, planned: "2025-07-01", actual: null,         status: "upcoming"    },
    { name: "Final Review & Coordination",      pct: 97,  required: false, planned: "2025-08-15", actual: null,         status: "upcoming"    },
    { name: "Final to DWG",                     pct: 98,  required: true,  planned: "2025-09-30", actual: null,         status: "upcoming"    },
    { name: "DWG Comments Resolved",            pct: 99,  required: false, planned: "2025-10-31", actual: null,         status: "upcoming"    },
    { name: "Complete",                         pct: 100, required: true,  planned: endDate,       actual: null,         status: "upcoming"    },
  ];

  const overallPct = 35;
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const statusDot: Record<string, string> = {
    "complete":    "bg-emerald-500",
    "in-progress": "bg-blue-500 ring-2 ring-blue-200",
    "upcoming":    "bg-slate-200",
  };

  return (
    <div>
      {/* Progress bar */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Progress</span>
          <span className="text-sm font-bold text-slate-700">{overallPct}% Complete</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#1a3557] rounded-full" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {/* Milestones */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Milestone</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">%</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Planned</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Actual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {milestones.map((m, i) => (
              <tr key={i} className={m.status === "in-progress" ? "bg-blue-50/60" : "hover:bg-slate-50/60"}>
                <td className="px-6 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[m.status]}`} />
                    <span className={`font-medium ${
                      m.status === "complete" ? "text-slate-500"
                      : m.status === "in-progress" ? "text-blue-800"
                      : "text-slate-700"
                    }`}>
                      {m.name}
                    </span>
                    {m.required && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-slate-500 font-mono">{m.pct}%</td>
                <td className="px-3 py-2.5 text-center text-xs text-slate-500 font-mono whitespace-nowrap">{fmtDate(m.planned)}</td>
                <td className="px-3 py-2.5 text-center text-xs whitespace-nowrap">
                  {m.actual ? (
                    <span className="text-emerald-700 font-mono">{fmtDate(m.actual)}</span>
                  ) : m.status === "in-progress" ? (
                    <span className="text-blue-500 italic">In progress</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ProjectSettings() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<Tab>("charter");

  const projectId = params.id;
  const project = MOCK_PROJECTS.find((p) => p.id === projectId);

  if (!project) {
    return (
      <Layout>
        <div className="py-24 text-center text-slate-500">Project not found.</div>
      </Layout>
    );
  }

  const breadcrumb = (
    <>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <Link href="/projects" className="text-slate-400 hover:text-slate-700 transition-colors">Project List</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <Link href={`/projects/${project.id}/planning`} className="text-slate-400 hover:text-slate-700 transition-colors font-mono text-xs">{project.number}</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <span className="font-semibold text-slate-800">Charter</span>
    </>
  );

  const tabs: { key: Tab; icon: typeof FileText; label: string }[] = [
    { key: "charter",  icon: FileText,      label: "Charter"  },
    { key: "funding",  icon: DollarSign,    label: "Funding"  },
    { key: "schedule", icon: CalendarDays,  label: "Schedule" },
  ];

  return (
    <Layout breadcrumb={breadcrumb}>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{project.number} — {project.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enterprise Project Management Plan (EPMP)</p>
            </div>
            <Link href={`/projects/${project.id}/planning`}>
              <button className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                <ArrowLeft size={15} /> Back to Plan
              </button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-[#1a3557] text-[#1a3557]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* ── CHARTER TAB ── */}
          {activeTab === "charter" && (
            <div className="p-6 space-y-7">
              <div>
                <SectionLabel>Project Identity</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ReadonlyField label="S&C Number" value={project.number} />
                  <ReadonlyField label="Project Title" value={project.name} />
                </div>
              </div>

              <div>
                <SectionLabel>Team</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ReadonlyField label="DWG / CoP" value={project.dwgCoP} />
                  <ReadonlyField label="HQ Proponent" value={project.hqProponent} />
                  <ReadonlyField label="Executing Org" value={project.executingOrg} />
                  <ReadonlyField label="Project Lead" value={project.projectLead} />
                </div>
              </div>

              <div>
                <SectionLabel>Contract &amp; Funding Type</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1.5 block">
                      Need S&amp;C Contract Support?
                    </Label>
                    <YesNoBadge value={project.needsContractSupport} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1.5 block">
                      Special Funding Type
                    </Label>
                    {project.specialFundingType
                      ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">{project.specialFundingType}</span>
                      : <span className="text-sm text-slate-400 italic">None</span>
                    }
                  </div>
                </div>
              </div>

              <div>
                <SectionLabel>Budget</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Budget at Submission",   value: project.budgetAtSubmission },
                    { label: "Current Project Budget", value: project.budget             },
                    { label: "Actual Obligation",      value: project.actualObligation   },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">{label}</div>
                      <div className="text-base font-bold text-slate-900">{fmt(value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>CMS Information</SectionLabel>
                <p className="text-xs text-slate-400 mb-3">Required for ALL Tri-Service Projects</p>
                <div className="space-y-4">
                  <ReadonlyField label="Primary CMS Link"     value={project.primaryCmsLink}     url />
                  <ReadonlyField label="CMS Guest Link"       value={project.cmsGuestLink}       url />
                  <ReadonlyField label="Additional CMS Links" value={project.additionalCmsLinks} url />
                </div>
              </div>
            </div>
          )}

          {/* ── FUNDING TAB ── */}
          {activeTab === "funding" && (
            <div className="p-6 animate-in fade-in duration-200">
              <FundingTable budget={project.budget} projectNumber={project.number} />
            </div>
          )}

          {/* ── SCHEDULE TAB ── */}
          {activeTab === "schedule" && (
            <div className="animate-in fade-in duration-200">
              <ScheduleTab startDate={project.startDate} endDate={project.endDate} />
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex justify-end">
            <span className="text-xs text-slate-400 italic">Fields are read-only in this demo</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
