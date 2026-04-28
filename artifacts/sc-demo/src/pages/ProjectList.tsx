import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ChevronRight, Briefcase, Search, Activity,
  PauseCircle, CheckCircle2, Clock, FileSpreadsheet, Loader2
} from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_PROJECTS, Project } from "@/lib/mockData";
import { Input } from "@/components/ui/input";

const DETAIL_LOAD_MS = 2000;

type Tab = "charter" | "funding" | "schedule";

// Generate FY funding rows for a project (mock split across 5 fiscal years)
function getFundingData(budget: number) {
  const split = [0.1, 0.2, 0.35, 0.25, 0.1];
  const years = ["FY23", "FY24", "FY25", "FY26", "FY27"];
  const laborPct   = 0.55;
  const travelPct  = 0.15;
  const otherPct   = 0.30;
  return { years, split, laborPct, travelPct, otherPct, budget };
}

function FundingTable({ budget }: { budget: number }) {
  const { years, split, laborPct, travelPct, otherPct } = getFundingData(budget);

  const fmt = (n: number) =>
    n === 0 ? "—" :
    new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD", maximumFractionDigits: 0,
    }).format(n);

  const rows = [
    { label: "Labor",             pct: laborPct  },
    { label: "Travel",            pct: travelPct },
    { label: "Outsourced / Other", pct: otherPct  },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[420px]">
        <thead>
          <tr>
            <th className="border border-slate-300 bg-[#1a3557] text-white font-semibold px-3 py-2 text-left w-[120px]">
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
                <td className="border border-slate-200 px-3 py-2 font-medium text-slate-700">
                  {row.label}
                </td>
                {split.map((s, i) => (
                  <td key={i} className="border border-slate-200 px-2 py-2 text-right text-slate-600">
                    {fmt(rowBudget * s)}
                  </td>
                ))}
                <td className="border border-slate-200 px-2 py-2 text-right font-semibold text-slate-800">
                  {fmt(rowBudget)}
                </td>
              </tr>
            );
          })}
          {/* Total row */}
          <tr className="bg-[#1a3557]/10 font-semibold">
            <td className="border border-slate-300 px-3 py-2 text-slate-800">Total</td>
            {split.map((s, i) => (
              <td key={i} className="border border-slate-300 px-2 py-2 text-right text-slate-800">
                {fmt(budget * s)}
              </td>
            ))}
            <td className="border border-slate-300 px-2 py-2 text-right text-slate-900 font-bold">
              {fmt(budget)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ProjectList() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailReady, setDetailReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("charter");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectProject = (id: string) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetailReady(false);
    setProgress(0);
    setActiveTab("charter");
  };

  // Animate progress bar inside the button, flip ready at 100%
  useEffect(() => {
    if (!selectedId || detailReady) return;
    setProgress(0);
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const pct = Math.min(((now - start) / DETAIL_LOAD_MS) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setDetailReady(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selectedId]);

  const selectedProject = selectedId
    ? MOCK_PROJECTS.find((p) => p.id === selectedId) ?? null
    : null;

  const filteredProjects = MOCK_PROJECTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "Active":   return <Activity     size={14} className="text-emerald-500" />;
      case "Planning": return <Clock        size={14} className="text-amber-500" />;
      case "On Hold":  return <PauseCircle  size={14} className="text-slate-500" />;
      case "Complete": return <CheckCircle2 size={14} className="text-blue-500" />;
    }
  };

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "Active":   return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Planning": return "bg-amber-50 text-amber-700 border-amber-200";
      case "On Hold":  return "bg-slate-50 text-slate-700 border-slate-200";
      case "Complete": return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD", maximumFractionDigits: 0,
    }).format(n);

  const TABS: { id: Tab; label: string }[] = [
    { id: "charter",  label: "Charter"  },
    { id: "funding",  label: "Funding"  },
    { id: "schedule", label: "Schedule" },
  ];

  return (
    <Layout breadcrumb={<>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300" />
      <span className="font-semibold text-slate-800">Project List</span>
    </>}>
      <div className="flex flex-col h-[calc(100vh-10rem)]">

        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
          {/* ── LEFT PANEL ── */}
          <div className="w-full lg:w-5/12 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  placeholder="Search projects..."
                  className="pl-9 bg-white border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-projects"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredProjects.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No projects found matching "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredProjects.map((project, i) => (
                    <button
                      key={project.id}
                      onClick={() => handleSelectProject(project.id)}
                      className={`w-full text-left p-4 rounded-lg transition-all border ${
                        selectedId === project.id
                          ? "bg-blue-50 border-blue-200 shadow-sm"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-100"
                      }`}
                      style={selectedId !== project.id ? { backgroundColor: i % 2 === 1 ? "#edf2f8" : "#ffffff" } : undefined}
                      data-testid={`card-project-${project.id}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-500 tracking-wider font-mono">
                          {project.number}
                        </span>
                        <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(project.status)}`}>
                          {getStatusIcon(project.status)}
                          {project.status}
                        </div>
                      </div>
                      <h3 className={`font-semibold mb-1 ${selectedId === project.id ? "text-primary" : "text-slate-900"}`}>
                        {project.name}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="w-full lg:w-7/12 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {!selectedProject ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center">
                <Briefcase size={48} className="mb-4 text-slate-200" strokeWidth={1} />
                <h3 className="text-lg font-medium text-slate-600 mb-1">No Project Selected</h3>
                <p className="text-sm max-w-xs">
                  Select a project from the list on the left to view its details and open its budget plan.
                </p>
                <p className="text-xs text-slate-400 mt-2 max-w-xs">
                  Projects appear here once set up via the Setup Queue.
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full">

                {/* ── Header (instant) ── */}
                <div className="px-6 pt-5 pb-4 border-b border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-xs font-bold rounded mb-2">
                        {selectedProject.number}
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 leading-tight">
                        {selectedProject.name}
                      </h2>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border mt-1 ${getStatusColor(selectedProject.status)}`}>
                      {getStatusIcon(selectedProject.status)}
                      {selectedProject.status}
                    </div>
                  </div>
                </div>

                {/* ── Tabs (top of detail section) ── */}
                <div className="flex border-b border-slate-200 bg-white">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                        activeTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      }`}
                      data-testid={`tab-${tab.id}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── Tab content (scrollable) ── */}
                <div className="flex-1 overflow-y-auto">
                  {/* CHARTER TAB */}
                  {activeTab === "charter" && (
                    <div className="p-5 space-y-4 animate-in fade-in duration-200 overflow-y-auto">
                      <p className="text-xs text-slate-500 leading-relaxed">{selectedProject.description}</p>

                      {/* Team — 2 col grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "DWG / CoP",       value: selectedProject.dwgCoP },
                          { label: "Need S&C Contract Support", value: selectedProject.needsContractSupport || "—" },
                          { label: "HQ Proponent",    value: selectedProject.hqProponent },
                          { label: "Special Funding Type", value: selectedProject.specialFundingType || "—" },
                          { label: "Executing Org",   value: selectedProject.executingOrg },
                          { label: "Current Budget",  value: fmt(selectedProject.budget) },
                          { label: "Project Lead",    value: selectedProject.projectLead },
                          { label: "Actual Obligation", value: fmt(selectedProject.actualObligation) },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Dates row */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Start Date</div>
                          <div className="text-sm font-semibold text-slate-800">
                            {new Date(selectedProject.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">End Date</div>
                          <div className="text-sm font-semibold text-slate-800">
                            {new Date(selectedProject.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FUNDING TAB */}
                  {activeTab === "funding" && (
                    <div className="p-6 animate-in fade-in duration-200">
                      {detailReady ? (
                        <FundingTable budget={selectedProject.budget} />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                          <Loader2 size={28} className="animate-spin text-primary/60" />
                          <p className="text-sm">Loading plans &amp; actuals…</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SCHEDULE TAB */}
                  {activeTab === "schedule" && (
                    <div className="animate-in fade-in duration-200">
                      {detailReady ? (() => {
                        const milestones = [
                          { name: "Awarded / Started",               pct: 0,   required: true,  planned: selectedProject.startDate, actual: selectedProject.startDate, status: "complete" },
                          { name: "Kickoff Meeting",                 pct: 1,   required: false, planned: "2024-02-01", actual: "2024-02-03",  status: "complete" },
                          { name: "Outline / Concept Review",        pct: 10,  required: false, planned: "2024-04-01", actual: "2024-04-08",  status: "complete" },
                          { name: "Outline Comments Resolved",       pct: 15,  required: false, planned: "2024-05-01", actual: "2024-05-10",  status: "complete" },
                          { name: "35% Review",                      pct: 30,  required: false, planned: "2024-07-15", actual: "2024-07-18",  status: "complete" },
                          { name: "35% Comments Resolved",           pct: 35,  required: false, planned: "2024-08-15", actual: null,          status: "in-progress" },
                          { name: "Interim Review",                  pct: 60,  required: true,  planned: "2024-12-01", actual: null,          status: "upcoming" },
                          { name: "Interim Review Comments Resolved",pct: 65,  required: false, planned: "2025-01-15", actual: null,          status: "upcoming" },
                          { name: "Pre-Final Review",                pct: 90,  required: true,  planned: "2025-06-01", actual: null,          status: "upcoming" },
                          { name: "Pre-Final Comments Resolved",     pct: 95,  required: false, planned: "2025-07-01", actual: null,          status: "upcoming" },
                          { name: "Final Review & Coordination",     pct: 97,  required: false, planned: "2025-08-15", actual: null,          status: "upcoming" },
                          { name: "Final to DWG",                    pct: 98,  required: true,  planned: "2025-09-30", actual: null,          status: "upcoming" },
                          { name: "DWG Comments Resolved",           pct: 99,  required: false, planned: "2025-10-31", actual: null,          status: "upcoming" },
                          { name: "Complete",                        pct: 100, required: true,  planned: selectedProject.endDate, actual: null, status: "upcoming" },
                        ];
                        const overallPct = 35;
                        const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
                        const statusDot: Record<string, string> = {
                          "complete":    "bg-emerald-500",
                          "in-progress": "bg-blue-500 ring-2 ring-blue-200",
                          "upcoming":    "bg-slate-200",
                        };
                        return (
                          <div>
                            {/* Progress bar header */}
                            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Progress</span>
                                <span className="text-sm font-bold text-slate-700">{overallPct}% Complete</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${overallPct}%` }} />
                              </div>
                            </div>

                            {/* Milestones table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Milestone</th>
                                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">%</th>
                                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Planned</th>
                                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Actual</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {milestones.map((m, i) => (
                                    <tr key={i} className={m.status === "in-progress" ? "bg-blue-50/60" : "hover:bg-slate-50/60"}>
                                      <td className="px-6 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[m.status]}`} />
                                          <span className={`font-medium ${m.status === "complete" ? "text-slate-500" : m.status === "in-progress" ? "text-blue-800" : "text-slate-700"}`}>
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
                      })() : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                          <Loader2 size={28} className="animate-spin text-primary/60" />
                          <p className="text-sm">Loading plans &amp; actuals…</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Action buttons (inline, no bar) ── */}
                <div className="flex gap-3 px-6 py-5 border-t border-slate-100">
                  <Link
                    href={detailReady ? `/projects/${selectedProject.id}/planning` : "#"}
                    className="flex-1"
                  >
                    <button
                      disabled={!detailReady}
                      className={`relative w-full overflow-hidden font-medium py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                        detailReady
                          ? "bg-primary hover:bg-primary/90 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500 border border-slate-200 cursor-wait"
                      }`}
                      data-testid="button-edit-plan"
                    >
                      {/* Progress bar fills inside button while loading */}
                      {!detailReady && (
                        <span
                          className="absolute inset-y-0 left-0 bg-primary/20 transition-none rounded-lg"
                          style={{ width: `${progress}%` }}
                        />
                      )}
                      <span className="relative flex items-center gap-2">
                        <FileSpreadsheet size={15} />
                        {detailReady ? "Edit Project" : "Loading plans & actuals…"}
                      </span>
                    </button>
                  </Link>
                  <Link href={`/projects/${selectedProject.id}/settings`} className="flex-1">
                    <button
                      className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
                      data-testid="button-project-settings"
                    >
                      Settings
                    </button>
                  </Link>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
