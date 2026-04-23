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

type FundingRow = {
  id: number;
  label: string;
  planned: number;
  requested: number;
  totalCommitments: number;
  openCommitments: number;
  obligated: number;
  description: string;
  notes: string;
};

function EditableAmount({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  if (editing) {
    return (
      <input
        autoFocus type="text" value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => { onChange(parseInt(raw) || 0); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange(parseInt(raw) || 0); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full text-right text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400 tabular-nums bg-white"
      />
    );
  }
  return (
    <button
      onClick={() => { setRaw(String(value)); setEditing(true); }}
      className="w-full text-right text-sm text-slate-800 tabular-nums hover:underline decoration-dotted underline-offset-2 focus:outline-none"
    >
      {value === 0 ? "—" : fmt(value)}
    </button>
  );
}

function useFundingRows(initial: FundingRow[]) {
  const [rows, setRows] = useState(initial);
  const updateAmount = (id: number, field: "planned" | "requested", value: number) =>
    setRows((r) => r.map((row) => row.id === id ? { ...row, [field]: value } : row));
  const updateNote = (id: number, value: string) =>
    setRows((r) => r.map((row) => row.id === id ? { ...row, notes: value } : row));
  return [rows, updateAmount, updateNote] as const;
}

/* Column groups for visual reference:
   WHITE bg  → Label | Total Planned | Total Requested
   BLUE bg   → Total Commitments | Open Commitments | Obligated  (read-only system data)
   WHITE bg  → Description | Notes
*/
function FundingSection({
  title, columnHeader, rows, onUpdateAmount, onUpdateNote,
}: {
  title: string;
  columnHeader: string;
  rows: FundingRow[];
  onUpdateAmount: (id: number, field: "planned" | "requested", value: number) => void;
  onUpdateNote: (id: number, value: string) => void;
}) {
  const totalPlanned       = rows.reduce((s, r) => s + r.planned, 0);
  const totalRequested     = rows.reduce((s, r) => s + r.requested, 0);
  const totalCommitments   = rows.reduce((s, r) => s + r.totalCommitments, 0);
  const totalOpen          = rows.reduce((s, r) => s + r.openCommitments, 0);
  const totalObligated     = rows.reduce((s, r) => s + r.obligated, 0);

  const blueHd = "px-3 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wide bg-[#1a6ea8]";
  const blueTd = "px-3 py-2.5 text-right text-sm tabular-nums bg-blue-50 text-slate-800";

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-[#1a3557] px-4 py-2.5">
        <span className="font-semibold text-white text-sm">{title}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 min-w-[130px]">{columnHeader}</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-amber-700 uppercase tracking-wide bg-amber-50 border-l border-amber-200 w-28">Total Planned</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-amber-700 uppercase tracking-wide bg-amber-50 border-l border-amber-200 w-28">Total Requested</th>
              <th className={`${blueHd} border-l border-blue-300 w-28`}>Total Commitments</th>
              <th className={`${blueHd} border-l border-blue-300 w-28`}>Open Commitments</th>
              <th className={`${blueHd} border-l border-blue-300 w-24`}>Obligated</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-l border-slate-200 min-w-[200px]">Description</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-amber-700 uppercase tracking-wide bg-amber-50 border-l border-amber-200 min-w-[100px]">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2.5 text-slate-700 bg-slate-50 font-medium border-b border-slate-100">{row.label}</td>
                <td className="px-3 py-2.5 bg-amber-50 border-l border-amber-200 border-b border-amber-100">
                  <EditableAmount value={row.planned}   onChange={(v) => onUpdateAmount(row.id, "planned",   v)} />
                </td>
                <td className="px-3 py-2.5 bg-amber-50 border-l border-amber-200 border-b border-amber-100">
                  <EditableAmount value={row.requested} onChange={(v) => onUpdateAmount(row.id, "requested", v)} />
                </td>
                <td className={`${blueTd} border-l border-blue-200 border-b border-blue-100`}>{fmt(row.totalCommitments)}</td>
                <td className={`${blueTd} border-l border-blue-200 border-b border-blue-100`}>{fmt(row.openCommitments)}</td>
                <td className={`${blueTd} border-l border-blue-200 border-b border-blue-100`}>{fmt(row.obligated)}</td>
                <td className="px-3 py-2.5 text-xs text-slate-500 font-mono border-l border-slate-200 bg-white border-b border-slate-100 max-w-[220px] truncate" title={row.description}>
                  {row.description}
                </td>
                <td className="px-3 py-2.5 border-l border-amber-200 bg-amber-50 border-b border-amber-100">
                  <input
                    type="text"
                    value={row.notes}
                    onChange={(e) => onUpdateNote(row.id, e.target.value)}
                    placeholder="notes"
                    className="w-full text-sm text-slate-700 bg-transparent border-none focus:outline-none placeholder:text-amber-300"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-semibold">
              <td className="px-3 py-2.5 text-xs text-slate-500 uppercase tracking-wide bg-slate-100">Total</td>
              <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums bg-amber-100 border-l border-amber-200">{fmt(totalPlanned)}</td>
              <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums bg-amber-100 border-l border-amber-200">{fmt(totalRequested)}</td>
              <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums bg-blue-100 border-l border-blue-200">{fmt(totalCommitments)}</td>
              <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums bg-blue-100 border-l border-blue-200">{fmt(totalOpen)}</td>
              <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums bg-blue-100 border-l border-blue-200">{fmt(totalObligated)}</td>
              <td className="border-l border-slate-200 bg-white" />
              <td className="border-l border-amber-200 bg-amber-100" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function FundingTable({ budget, projectNumber }: { budget: number; projectNumber: string }) {
  const b = budget;
  const fy = projectNumber.slice(0, 2);
  const num = projectNumber;

  const [laborRows, updateLaborAmount, updateLaborNote] = useFundingRows([
    {
      id: 1, label: "Nugent, Joseph Pat",
      planned: Math.round(b * 0.090), requested: Math.round(b * 0.090 * 0.05),
      totalCommitments: Math.round(b * 0.090 * 0.05), openCommitments: Math.round(b * 0.090 * 0.03), obligated: Math.round(b * 0.090 * 0.02),
      description: `FY${fy}/SANDC LABOR FUNDS FOR ${num}/CEFMS/`, notes: "notes",
    },
    {
      id: 2, label: "U435310",
      planned: Math.round(b * 0.050), requested: Math.round(b * 0.050 * 0.95),
      totalCommitments: Math.round(b * 0.050 * 0.95), openCommitments: Math.round(b * 0.050 * 0.50), obligated: Math.round(b * 0.050 * 0.45),
      description: `FY${fy}/SANDC LABOR FUNDS FOR ${num}/org code/`, notes: "notes",
    },
    {
      id: 3, label: "Chen, David",
      planned: Math.round(b * 0.035), requested: Math.round(b * 0.035),
      totalCommitments: Math.round(b * 0.035 * 0.60), openCommitments: Math.round(b * 0.035 * 0.30), obligated: Math.round(b * 0.035 * 0.30),
      description: `FY${fy}/SANDC LABOR FUNDS FOR ${num}/Chen D/`, notes: "",
    },
  ]);

  const [travelRows, updateTravelAmount, updateTravelNote] = useFundingRows([
    {
      id: 1, label: "Site Visits",
      planned: Math.round(b * 0.020), requested: Math.round(b * 0.020),
      totalCommitments: Math.round(b * 0.020), openCommitments: Math.round(b * 0.020 * 0.59), obligated: Math.round(b * 0.020 * 0.41),
      description: `FY${fy}/SANDC TRAVEL FOR ${num}/Site Visits/`, notes: "",
    },
    {
      id: 2, label: "Equipment Transport",
      planned: Math.round(b * 0.013), requested: Math.round(b * 0.013),
      totalCommitments: Math.round(b * 0.013), openCommitments: Math.round(b * 0.013 * 0.50), obligated: Math.round(b * 0.013 * 0.50),
      description: `FY${fy}/SANDC TRAVEL FOR ${num}/Equip Transport/`, notes: "",
    },
  ]);

  const [materialsRows, updateMaterialsAmount, updateMaterialsNote] = useFundingRows([
    {
      id: 1, label: "Concrete (500 units)",
      planned: Math.round(b * 0.031), requested: Math.round(b * 0.031),
      totalCommitments: Math.round(b * 0.031), openCommitments: Math.round(b * 0.031 * 0.53), obligated: Math.round(b * 0.031 * 0.47),
      description: `FY${fy}/SANDC MATL FOR ${num}/Concrete/500 units`, notes: "",
    },
    {
      id: 2, label: "Steel Rebar (2000 ft)",
      planned: Math.round(b * 0.021), requested: Math.round(b * 0.021 * 0.98),
      totalCommitments: Math.round(b * 0.021 * 0.98), openCommitments: Math.round(b * 0.021 * 0.49), obligated: Math.round(b * 0.021 * 0.49),
      description: `FY${fy}/SANDC MATL FOR ${num}/Rebar/2000 units`, notes: "",
    },
  ]);

  const allRows = [...laborRows, ...travelRows, ...materialsRows];
  const totalPlanned = allRows.reduce((s, r) => s + r.planned, 0);
  const leftToPlan = budget - totalPlanned;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#1a3557] px-5 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-1">TOA</p>
          <p className="text-2xl font-bold tabular-nums">{fmt(budget)}</p>
          <p className="text-xs text-blue-300 mt-1">Total Obligating Authority</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Planned</p>
          <p className="text-2xl font-bold tabular-nums text-slate-800">{fmt(totalPlanned)}</p>
          <p className="text-xs text-slate-400 mt-1">Amount currently planned</p>
        </div>
        <div className={`rounded-xl border px-5 py-4 ${leftToPlan >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${leftToPlan >= 0 ? "text-emerald-600" : "text-red-500"}`}>Left to Plan</p>
          <p className={`text-2xl font-bold tabular-nums ${leftToPlan >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmt(leftToPlan)}</p>
          <p className={`text-xs mt-1 ${leftToPlan >= 0 ? "text-emerald-500" : "text-red-400"}`}>Remaining to allocate</p>
        </div>
      </div>

      {/* Tables */}
      <FundingSection title="Labor"             columnHeader="Employee / Org Code" rows={laborRows}     onUpdateAmount={updateLaborAmount}     onUpdateNote={updateLaborNote}     />
      <FundingSection title="Travel"            columnHeader="Travel Line"         rows={travelRows}    onUpdateAmount={updateTravelAmount}    onUpdateNote={updateTravelNote}    />
      <FundingSection title="Materials & Other" columnHeader="Item"                rows={materialsRows} onUpdateAmount={updateMaterialsAmount} onUpdateNote={updateMaterialsNote} />

      {/* Submit */}
      <div className="flex justify-center pt-2">
        <button className="px-10 py-2.5 bg-[#1a3557] hover:bg-[#16304d] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
          Submit
        </button>
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
