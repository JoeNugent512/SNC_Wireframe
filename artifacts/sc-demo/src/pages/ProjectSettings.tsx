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

type FundingRow = { id: number; label: string; planned: number; requested: number; notes: string };

function EditableAmount({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => { onChange(parseInt(raw) || 0); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange(parseInt(raw) || 0); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full text-right text-sm border border-blue-500 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400 tabular-nums bg-white"
      />
    );
  }
  return (
    <button
      onClick={() => { setRaw(String(value)); setEditing(true); }}
      className="w-full text-right text-sm text-slate-800 tabular-nums focus:outline-none"
    >
      {value === 0 ? "—" : fmt(value)}
    </button>
  );
}

function EditableNote({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Add note…"
      className="w-full text-sm text-slate-600 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-300"
    />
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

function FundingSection({
  title, columnHeader, rows, onUpdateAmount, onUpdateNote,
}: {
  title: string;
  columnHeader: string;
  rows: FundingRow[];
  onUpdateAmount: (id: number, field: "planned" | "requested", value: number) => void;
  onUpdateNote: (id: number, value: string) => void;
}) {
  const totalPlanned   = rows.reduce((s, r) => s + r.planned, 0);
  const totalRequested = rows.reduce((s, r) => s + r.requested, 0);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-[#1a3557] px-4 py-2.5">
        <span className="font-semibold text-white text-sm">{title}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">{columnHeader}</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-36 bg-blue-50 border-l border-blue-100">Total Planned</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-36 bg-blue-50 border-l border-blue-100">Total Requested</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-l border-slate-200">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 text-slate-700 bg-white">{row.label}</td>
              <td className="px-4 py-2.5 bg-blue-50 border-l border-blue-100">
                <EditableAmount value={row.planned}   onChange={(v) => onUpdateAmount(row.id, "planned",   v)} />
              </td>
              <td className="px-4 py-2.5 bg-blue-50 border-l border-blue-100">
                <EditableAmount value={row.requested} onChange={(v) => onUpdateAmount(row.id, "requested", v)} />
              </td>
              <td className="px-4 py-2.5 bg-white border-l border-slate-200">
                <EditableNote value={row.notes} onChange={(v) => onUpdateNote(row.id, v)} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 font-semibold">
            <td className="px-4 py-2.5 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">Total</td>
            <td className="px-4 py-2.5 text-right text-sm text-slate-800 tabular-nums bg-blue-50 border-l border-blue-100">{fmt(totalPlanned)}</td>
            <td className="px-4 py-2.5 text-right text-sm text-slate-800 tabular-nums bg-blue-50 border-l border-blue-100">{fmt(totalRequested)}</td>
            <td className="bg-white border-l border-slate-200" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function FundingTable({ budget }: { budget: number }) {
  const b = budget;
  const [laborRows, updateLaborAmount, updateLaborNote] = useFundingRows([
    { id: 1, label: "Nugent, Joseph Pat",  planned: Math.round(b * 0.090), requested: Math.round(b * 0.090), notes: "" },
    { id: 2, label: "U435310",             planned: Math.round(b * 0.050), requested: Math.round(b * 0.048), notes: "" },
    { id: 3, label: "Chen, David",         planned: Math.round(b * 0.035), requested: Math.round(b * 0.035), notes: "" },
  ]);
  const [travelRows, updateTravelAmount, updateTravelNote] = useFundingRows([
    { id: 1, label: "Site Visits",         planned: Math.round(b * 0.020), requested: Math.round(b * 0.020), notes: "" },
    { id: 2, label: "Equipment Transport", planned: Math.round(b * 0.013), requested: Math.round(b * 0.013), notes: "" },
  ]);
  const [materialsRows, updateMaterialsAmount, updateMaterialsNote] = useFundingRows([
    { id: 1, label: "Concrete (500 units)",  planned: Math.round(b * 0.031), requested: Math.round(b * 0.031), notes: "" },
    { id: 2, label: "Steel Rebar (2000 ft)", planned: Math.round(b * 0.021), requested: Math.round(b * 0.020), notes: "" },
  ]);

  return (
    <div className="space-y-4">
      <FundingSection title="Labor"             columnHeader="Employee / Org Code" rows={laborRows}     onUpdateAmount={updateLaborAmount}     onUpdateNote={updateLaborNote}     />
      <FundingSection title="Travel"            columnHeader="Travel Line"         rows={travelRows}    onUpdateAmount={updateTravelAmount}    onUpdateNote={updateTravelNote}    />
      <FundingSection title="Materials & Other" columnHeader="Item"                rows={materialsRows} onUpdateAmount={updateMaterialsAmount} onUpdateNote={updateMaterialsNote} />
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
              <FundingTable budget={project.budget} />
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
