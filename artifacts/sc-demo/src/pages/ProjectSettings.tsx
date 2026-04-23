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

function FundingTable({ budget }: { budget: number }) {
  const split  = [0.1, 0.2, 0.35, 0.25, 0.1];
  const years  = ["FY23", "FY24", "FY25", "FY26", "FY27"];
  const rows = [
    { label: "Labor",              pct: 0.55 },
    { label: "Travel",             pct: 0.15 },
    { label: "Outsourced / Other", pct: 0.30 },
  ];
  const f = (n: number) =>
    n === 0 ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[500px]">
        <thead>
          <tr>
            <th className="border border-slate-300 bg-[#1a3557] text-white font-semibold px-3 py-2 text-left w-[140px]">
              Project Overview
            </th>
            {years.map((fy) => (
              <th key={fy} className="border border-slate-300 bg-[#2a6496] text-white font-semibold px-2 py-2 text-center">
                {fy}
              </th>
            ))}
            <th className="border border-slate-300 bg-[#1a3557] text-white font-semibold px-2 py-2 text-center">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const rowBudget = budget * row.pct;
            return (
              <tr key={row.label} className={ri % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                <td className="border border-slate-200 px-3 py-2 font-medium text-slate-700">{row.label}</td>
                {split.map((s, i) => (
                  <td key={i} className="border border-slate-200 px-2 py-2 text-right text-slate-600">
                    {f(rowBudget * s)}
                  </td>
                ))}
                <td className="border border-slate-200 px-2 py-2 text-right font-semibold text-slate-800">
                  {f(rowBudget)}
                </td>
              </tr>
            );
          })}
          <tr className="bg-[#1a3557]/10 font-semibold">
            <td className="border border-slate-300 px-3 py-2 text-slate-800">Total</td>
            {split.map((s, i) => (
              <td key={i} className="border border-slate-300 px-2 py-2 text-right text-slate-800">
                {f(budget * s)}
              </td>
            ))}
            <td className="border border-slate-300 px-2 py-2 text-right text-slate-900 font-bold">
              {f(budget)}
            </td>
          </tr>
        </tbody>
      </table>
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
