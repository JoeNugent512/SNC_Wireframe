import { useState, useRef } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight, ArrowLeft, FileText, DollarSign, CalendarDays, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { fundingCurrency, type ProjectFunding, type ProjectScheduleSeed } from "@/lib/projectFunding";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { useUser } from "@/lib/userContext";
import { Label } from "@/components/ui/label";
import { CURRENT_FY, CURRENT_FY_NUMBER } from "@/lib/fiscalYear";

type Tab = "charter" | "funding" | "schedule";

const fmt = fundingCurrency;

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

function ContractSupportBadge({ value }: { value: "" | "Yes" | "No" | "N/A" }) {
  if (!value) return <span className="text-sm text-slate-400 italic">—</span>;
  const styles: Record<string, string> = {
    Yes:  "bg-emerald-100 text-emerald-800 border border-emerald-200",
    No:   "bg-slate-100 text-slate-600 border border-slate-200",
    "N/A":"bg-amber-50 text-amber-700 border border-amber-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[value] ?? ""}`}>
      {value}
    </span>
  );
}

/* ── Fiscal-Year Funding Plan (Settings > Funding tab) ──────────── */


function FyCell({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const display = value === 0 ? "—" : fmt(value);
  if (editing) {
    return (
      <input autoFocus type="text" value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/[^0-9.]/g, ""))}
        onBlur={() => { onChange?.(parseFloat(raw) || 0); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange?.(parseFloat(raw) || 0); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full text-right text-sm border border-amber-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-300 tabular-nums bg-white"
        style={{ minWidth: 80 }}
      />
    );
  }
  return (
    <button disabled={!onChange} onClick={() => { setRaw(String(value)); setEditing(true); }}
      className="w-full text-right text-sm text-slate-800 tabular-nums hover:underline decoration-dotted underline-offset-2 focus:outline-none">
      {display}
    </button>
  );
}

function FundingTable({ budget, editable = true, funding }: { budget: number; editable?: boolean; funding?: ProjectFunding }) {
  const { toast } = useToast();
  const b = budget;
  const yearNumbers = funding?.years.map(fy => Number(fy.slice(2))) ?? Array.from({ length: 3 }, (_, i) => CURRENT_FY_NUMBER + i);
  const years = yearNumbers.map((year) => `FY${String(year).padStart(2, "0")}`);

  /* PLAN rows: current FY through the next two FYs — interactive, gated at Save */
  const initLabor  = funding ? years.map(fy => funding.annual[fy]?.Labor.plan ?? 0) : [Math.round(b * 0.10), Math.round(b * 0.30), Math.round(b * 0.27)];
  const initTravel = funding ? years.map(fy => funding.annual[fy]?.Travel.plan ?? 0) : [Math.round(b * 0.00), Math.round(b * 0.02), Math.round(b * 0.01)];
  const initOther  = funding ? years.map(fy => funding.annual[fy]?.["Outsourcing & Other"].plan ?? 0) : [Math.round(b * 0.00), Math.round(b * 0.10), Math.round(b * 0.20)];
  const initialRef = useRef({ labor: initLabor, travel: initTravel, other: initOther });
  const [planLabor,   setPlanLabor]   = useState(initLabor);
  const [planTravel,  setPlanTravel]  = useState(initTravel);
  const [planOther,   setPlanOther]   = useState(initOther);

  const approvedBudget = budget;

  const planTotals = years.map((_, i) => planLabor[i] + planTravel[i] + planOther[i]);
  const totalPlanned = planTotals.reduce((s, v) => s + v, 0);
  const leftToPlan = approvedBudget - totalPlanned;

  /* STATUS rows are read-only; future years retain plan amounts but show no accrued Com/Obl. */
  const observedAmount = (value: number, index: number, rate: number) =>
    yearNumbers[index] > CURRENT_FY_NUMBER ? 0 : Math.round(value * rate);
  const status = {
    labor:  { plan: planLabor, com: planLabor.map((v, i) => observedAmount(v, i, 0.95)), obl: planLabor.map((v, i) => observedAmount(v, i, 0.80)) },
    travel: { plan: planTravel, com: planTravel.map((v, i) => observedAmount(v, i, 1.00)), obl: planTravel.map((v, i) => observedAmount(v, i, 0.90)) },
    other:  { plan: planOther, com: planOther.map((v, i) => observedAmount(v, i, i < years.length - 1 ? 0.98 : 0.60)), obl: planOther.map((v, i) => observedAmount(v, i, i < years.length - 1 ? 0.95 : 0.40)) },
  };
  if (funding) {
    for (const [key, category] of [["labor", "Labor"], ["travel", "Travel"], ["other", "Outsourcing & Other"]] as const) {
      status[key].com = years.map(fy => funding.annual[fy]?.[category].committed ?? 0);
      status[key].obl = years.map(fy => funding.annual[fy]?.[category].obligated ?? 0);
    }
  }
  const totalStatus = {
    plan: years.map((_, i) => status.labor.plan[i] + status.travel.plan[i] + status.other.plan[i]),
    com:  years.map((_, i) => status.labor.com[i]  + status.travel.com[i]  + status.other.com[i]),
    obl:  years.map((_, i) => status.labor.obl[i]  + status.travel.obl[i]  + status.other.obl[i]),
  };
  const atc  = years.map((_, i) => funding ? totalStatus.plan[i] - totalStatus.com[i] - totalStatus.obl[i] : totalStatus.com[i] - totalStatus.obl[i]);
  const auob = years.map((_, i) => funding ? totalStatus.plan[i] - totalStatus.com[i] - totalStatus.obl[i] : totalStatus.plan[i] - totalStatus.com[i]);

  const thBase = "px-4 py-2.5 text-xs font-semibold uppercase tracking-wide";
  const navyBg = { backgroundColor: "#1a3557" };
  const amberBg = "#fffbeb";
  const amberBd = "1px solid #fcd34d";
  const blueCellBg = "#eff6ff";
  const blueBd = "1px solid #bfdbfe";

  const setVal = (arr: number[], setArr: (a: number[]) => void, i: number) => funding && yearNumbers[i] < CURRENT_FY_NUMBER ? undefined : (v: number) => {
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
                  <th key={fy} className={`${thBase} text-right`} style={{ backgroundColor: fy === CURRENT_FY ? "#fef3c7" : amberBg, color: "#92400e", borderLeft: amberBd, width: 110 }}>
                    {fy}
                    {fy === CURRENT_FY && <span className="block text-[10px] font-medium normal-case">Current FY</span>}
                  </th>
                ))}
                <th className={`${thBase} text-right text-slate-600 bg-slate-100`} style={{ borderLeft: "1px solid #e2e8f0", width: 110 }}>Total</th>
                <th className={`${thBase} text-right`} style={{ backgroundColor: "#1a6ea8", color: "white", borderLeft: blueBd, width: 110 }}>Total Planned</th>
                <th className={`${thBase} text-right`} style={{ backgroundColor: "#1a6ea8", color: "white", borderLeft: blueBd, width: 110 }}>Left to Plan</th>
              </tr>
            </thead>
            <tbody>
              {/* Labor — row 0, even → white */}
              <tr style={{ borderBottom: "1px solid #fef9c3" }}>
                <td className="px-4 py-2.5 text-slate-700 font-semibold" style={{ backgroundColor: "#ffffff" }}>Labor</td>
                {planLabor.map((v, i) => (
                  <td key={i} className="px-3 py-2.5" style={{ backgroundColor: "#fffbeb", borderLeft: amberBd }}>
                    <FyCell value={v} onChange={setVal(planLabor, setPlanLabor, i)} />
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right font-semibold text-slate-700" style={{ backgroundColor: "#ffffff", borderLeft: "1px solid #e2e8f0" }}>{fmt(planLabor.reduce((s, v) => s + v, 0))}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-700" style={{ backgroundColor: blueCellBg, borderLeft: blueBd }}>{fmt(totalPlanned)}</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${leftToPlan >= 0 ? "text-emerald-700" : "text-red-600"}`} style={{ backgroundColor: leftToPlan >= 0 ? "#ecfdf5" : "#fef2f2", borderLeft: blueBd }}>{fmt(leftToPlan)}</td>
              </tr>
              {/* Travel — row 1, odd → tinted */}
              <tr style={{ borderBottom: "1px solid #fef9c3" }}>
                <td className="px-4 py-2.5 text-slate-700 font-semibold" style={{ backgroundColor: "#edf2f8" }}>Travel</td>
                {planTravel.map((v, i) => (
                  <td key={i} className="px-3 py-2.5" style={{ backgroundColor: "#fef3c7", borderLeft: amberBd }}>
                    <FyCell value={v} onChange={setVal(planTravel, setPlanTravel, i)} />
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right font-semibold text-slate-700" style={{ backgroundColor: "#edf2f8", borderLeft: "1px solid #e2e8f0" }}>{fmt(planTravel.reduce((s, v) => s + v, 0))}</td>
                <td colSpan={2} style={{ backgroundColor: "#edf2f8", borderLeft: blueBd }} />
              </tr>
              {/* Other — row 2, even → white */}
              <tr style={{ borderBottom: "1px solid #fef9c3" }}>
                <td className="px-4 py-2.5 text-slate-700 font-semibold" style={{ backgroundColor: "#ffffff" }}>OutSource / Other</td>
                {planOther.map((v, i) => (
                  <td key={i} className="px-3 py-2.5" style={{ backgroundColor: "#fffbeb", borderLeft: amberBd }}>
                    <FyCell value={v} onChange={setVal(planOther, setPlanOther, i)} />
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right font-semibold text-slate-700" style={{ backgroundColor: "#ffffff", borderLeft: "1px solid #e2e8f0" }}>{fmt(planOther.reduce((s, v) => s + v, 0))}</td>
                <td colSpan={2} style={{ backgroundColor: "#ffffff", borderLeft: blueBd }} />
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

      {/* ── Save Changes ──────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (!editable) {
              toast({ title: "You do not have edit access to this project.", variant: "destructive" });
              setPlanLabor([...initialRef.current.labor]);
              setPlanTravel([...initialRef.current.travel]);
              setPlanOther([...initialRef.current.other]);
              return;
            }
            toast({ title: "Funding plan saved." });
          }}
          title={!editable ? "Read-only for your role" : "Save funding plan changes"}
          className={`flex items-center gap-2 font-medium py-2 px-6 rounded-lg shadow-sm transition-colors text-sm ${
            editable
              ? "bg-[#1a3557] hover:bg-[#1a6ea8] text-white"
              : "bg-slate-300 text-slate-400 cursor-not-allowed"
          }`}
        >
          Save Changes
        </button>
      </div>

      {/* ── PROJECT FUNDING STATUS ──────────────────────────────── */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="px-5 py-3 flex items-center justify-between" style={navyBg}>
          <span className="text-white font-bold tracking-wide text-sm">Project Funding Status</span>
          <span className="text-xs text-blue-300">Import Macro last run: 14 Nov 2025 · It's now {new Date().toLocaleDateString("en-US",{timeZone:"UTC",month:"short",day:"numeric",year:"numeric"})}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th className={`${thBase} text-left text-slate-500 bg-slate-50`} style={{ minWidth: 100 }}>Category</th>
                <th className={`${thBase} text-left text-slate-500 bg-slate-50`} style={{ width: 50, borderLeft: "1px solid #e2e8f0" }}></th>
                {years.map((fy) => (
                  <th key={fy} className={`${thBase} text-right text-white`} style={{ backgroundColor: "#1a6ea8", borderLeft: blueBd, width: 120 }}>
                    {fy}
                    {fy === CURRENT_FY && <span className="block text-[10px] font-medium normal-case text-blue-100">Current FY</span>}
                  </th>
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

function ScheduleTab({ startDate, endDate, schedule }: { startDate: string; endDate: string; schedule?: ProjectScheduleSeed }) {
  const milestones = schedule ? schedule.milestones.map(m => ({
    name: m.label, pct: m.pct, required: m.required, planned: m.planned, actual: m.actual || null,
    status: m.actual ? "complete" : "upcoming",
  })) : [
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

  const overallPct = schedule?.percentComplete ?? 35;
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }) : "";
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
              <tr key={i}
                style={{ backgroundColor: m.status === "in-progress" ? "#dbeafe99" : i % 2 === 1 ? "#edf2f8" : "#ffffff" }}
              >
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
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("charter");

  const projectId = params.id;
  const project = MOCK_PROJECTS.find((p) => p.id === projectId);
  const canEdit = project ? user.canEdit(project) : false;

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
      <div className="max-w-5xl mx-auto space-y-5">
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
                {project.description && (
                  <div className="mt-4">
                    <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1.5 block">Description</Label>
                    <p className="text-sm text-slate-700 leading-relaxed">{project.description}</p>
                  </div>
                )}
              </div>

              <div>
                <SectionLabel>Team</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ReadonlyField label="HQ Proponent" value={project.hqProponent} />
                  <ReadonlyField label="DWG / CoP" value={project.dwgCoP} />
                  <ReadonlyField label="Project Lead" value={project.projectLead} />
                  <ReadonlyField label="Executing Org" value={project.executingOrg} />
                </div>
              </div>

              <div>
                <SectionLabel>Contract &amp; Funding Type</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1.5 block">
                      Need S&amp;C Contract Support?
                    </Label>
                    <ContractSupportBadge value={project.needsContractSupport} />
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

            </div>
          )}

          {/* ── FUNDING TAB ── */}
          {activeTab === "funding" && (
            <div className="p-6 animate-in fade-in duration-200">
              <FundingTable budget={project.budget} funding={project.funding} editable={canEdit} />
            </div>
          )}

          {/* ── SCHEDULE TAB ── */}
          {activeTab === "schedule" && (
            <div className="animate-in fade-in duration-200">
              <ScheduleTab startDate={project.startDate} endDate={project.endDate} schedule={project.schedule} />
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
