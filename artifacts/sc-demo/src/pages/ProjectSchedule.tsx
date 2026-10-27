import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ChevronRight, PlusCircle, X, ChevronDown } from "lucide-react";
import Layout from "@/components/Layout";
import { getCharterData } from "@/lib/setupStore";
import { PENDING_SETUP_PROJECTS } from "@/lib/mockData";
import { ScheduleMilestone, ALL_MILESTONE_DEFS } from "@/lib/scheduleTypes";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const REQUIRED_KEYS = new Set(ALL_MILESTONE_DEFS.filter((m) => m.required).map((m) => m.key));
const LOCKED_PCT_KEYS = new Set(["awarded", "complete"]);

function initMilestones(): ScheduleMilestone[] {
  return ALL_MILESTONE_DEFS.filter((m) => m.required).map((m) => ({
    ...m, planned: "", actual: "",
  }));
}

const PROJECT_STATUS_OPTIONS = [
  "Not Started",
  "Awarded / Started",
  "Kickoff Meeting",
  "Outline / Concept Review",
  "35% Review",
  "Interim Review",
  "Pre Final Review",
  "Final to DWG",
  "Complete",
];

interface DelivRow {
  id: string;
  label: string;
  pct: string;
  planned: string;
  actual: string;
}

export default function ProjectSchedule() {
  const params = useParams();
  const [, setLocation] = useLocation();

  const setupProject = PENDING_SETUP_PROJECTS.find(p => p.id === params.id);
  const savedCharter = getCharterData();
  const charter = savedCharter.projectId === params.id ? savedCharter : {
    projectId: setupProject?.id ?? "",
    projectNumber: setupProject?.number ?? "",
    projectName: setupProject?.name ?? "",
    deliverables: setupProject?.deliverables ?? [],
  };
  const deliverables = charter.deliverables ?? [];
  const projectNumber = charter.projectNumber || params.id || "New Project";
  const projectName = charter.projectName || "";

  const [milestones, setMilestones] = useState<ScheduleMilestone[]>(() =>
    setupProject?.schedule?.milestones.map(m => ({ ...m })) ?? initMilestones());
  const [projectStatus, setProjectStatus] = useState(setupProject?.schedule?.status ?? "");
  const [pctComplete, setPctComplete] = useState(String(setupProject?.schedule?.percentComplete ?? 0));
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const filledDeliverables = deliverables.filter((d) => d.type);
  const multipleDeliverables = filledDeliverables.length > 1;

  const [delivRows, setDelivRows] = useState<DelivRow[]>(() =>
    filledDeliverables.map((d) => ({
      id: d.id,
      label: d.numDesc ? `${d.type} ${d.numDesc}` : d.type,
      pct: "90",
      planned: "",
      actual: "",
    }))
  );

  const allRequiredPlanned =
    milestones.every((m) => !m.required || m.planned) &&
    (!multipleDeliverables || delivRows.every((d) => d.planned));

  const visibleKeys = new Set(milestones.map((m) => m.key));
  const visibleLabels = new Set(milestones.map((m) => m.label));
  const addableOptions = ALL_MILESTONE_DEFS.filter((m) => !m.required && !visibleKeys.has(m.key));
  const statusOptions = PROJECT_STATUS_OPTIONS.filter((s) => s === projectStatus || !visibleLabels.has(s));

  const addMilestone = (key: string) => {
    const def = ALL_MILESTONE_DEFS.find((m) => m.key === key);
    if (!def) return;
    setMilestones((prev) => {
      const next = [...prev, { ...def, planned: "", actual: "" }];
      next.sort((a, b) => a.pct - b.pct);
      return next;
    });
    setShowAddDropdown(false);
  };

  const removeMilestone = (key: string) => {
    if (REQUIRED_KEYS.has(key)) return;
    setMilestones((prev) => prev.filter((m) => m.key !== key));
  };

  const updateMilestone = (key: string, field: "planned" | "actual" | "pct", value: string) => {
    setMilestones((prev) => {
      const updated = prev.map((m) => m.key === key ? { ...m, [field]: field === "pct" ? Number(value) : value } : m);
      return field === "pct" ? [...updated].sort((a, b) => a.pct - b.pct) : updated;
    });
    if (field === "actual" && value) {
      const ms = milestones.find((m) => m.key === key);
      if (ms) setPctComplete(String(ms.pct));
    }
  };

  const updateDeliv = (id: string, field: keyof DelivRow, value: string) => {
    setDelivRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };

  const breadcrumb = (
    <>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <Link href="/setup" className="text-slate-400 hover:text-slate-700 transition-colors">Setup Queue</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <Link href={`/setup/${params.id}`} className="text-slate-400 hover:text-slate-700 transition-colors font-mono text-xs">{projectNumber}</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <span className="font-semibold text-slate-800">Schedule</span>
    </>
  );

  return (
    <Layout breadcrumb={breadcrumb}>
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <Link href={`/setup/${params.id}`}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold cursor-pointer hover:bg-slate-200 transition-colors">
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
              Charter
            </div>
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a3557] text-white text-xs font-semibold">
            <span className="w-4 h-4 rounded-full bg-white text-[#1a3557] flex items-center justify-center text-[10px] font-bold">2</span>
            Schedule
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs font-semibold text-slate-500">{projectNumber}</span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Schedule
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{projectName || "New Project"}</h2>
              </div>

              {/* Project Status + % Complete */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">Project Status</Label>
                  <div className="w-44">
                    <Select value={projectStatus} onValueChange={(v) => {
                      setProjectStatus(v);
                      const match = ALL_MILESTONE_DEFS.find((m) => m.label === v);
                      if (match) setPctComplete(String(match.pct));
                    }}>
                      <SelectTrigger className="h-8 text-xs border-slate-200">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">% Complete</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="w-14 h-8 text-xs text-center"
                    value={pctComplete}
                    onChange={(e) => setPctComplete(e.target.value)}
                  />
                  <span className="text-slate-400 text-sm">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">

            {/* Milestones table */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Milestones</span>
                <div className="flex-1 h-px bg-slate-100" />
                <p className="text-[10px] text-slate-400">Underlined = required</p>
              </div>

              <div className="border border-slate-200 rounded-lg">
                {/* Table header */}
                <div
                  className="grid bg-slate-50 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-2 rounded-t-lg"
                  style={{ gridTemplateColumns: "1fr 72px 148px 148px 28px" }}
                >
                  <span>Milestone</span>
                  <span className="text-center">%</span>
                  <span>Planned</span>
                  <span>Actual</span>
                  <span />
                </div>

                {/* Combined sorted rows: milestones + deliverables */}
                {[
                  ...milestones.map((m) => ({ kind: "milestone" as const, pctNum: m.pct, data: m })),
                  ...(multipleDeliverables ? delivRows.map((d) => ({ kind: "deliv" as const, pctNum: Number(d.pct) || 90, data: d })) : []),
                ]
                  .sort((a, b) => a.pctNum - b.pctNum)
                  .map((row, idx) => {
                    const isEven = idx % 2 === 0;
                    const bg = isEven ? "bg-white" : "bg-slate-50/50";
                    if (row.kind === "milestone") {
                      const m = row.data;
                      return (
                        <div
                          key={m.key}
                          className={`grid items-center px-3 py-1.5 gap-2 ${bg} border-b border-slate-100 last:border-0 last:rounded-b-lg`}
                          style={{ gridTemplateColumns: "1fr 72px 148px 148px 28px" }}
                        >
                          <span className={`text-sm ${m.required ? "font-semibold underline decoration-dotted text-slate-800" : "text-slate-600"}`}>
                            {m.label}
                          </span>
                          {LOCKED_PCT_KEYS.has(m.key) ? (
                            <span className="text-xs font-mono text-slate-500 text-center">{m.pct}%</span>
                          ) : (
                            <div className="flex items-center gap-0.5">
                              <Input
                                type="number"
                                min={1}
                                max={99}
                                className="h-7 text-xs text-center px-1 border-slate-200"
                                value={m.pct}
                                onChange={(e) => updateMilestone(m.key, "pct", e.target.value)}
                              />
                              <span className="text-[10px] text-slate-400">%</span>
                            </div>
                          )}
                          <div className="relative">
                            <Input
                              type="date"
                              className={`h-7 text-xs ${m.required && !m.planned ? "border-amber-400 bg-amber-50/40" : "border-slate-200"}`}
                              value={m.planned}
                              onChange={(e) => updateMilestone(m.key, "planned", e.target.value)}
                            />
                            {m.required && !m.planned && (
                              <span className="absolute top-0 left-2 -translate-y-1/2 bg-white px-0.5 text-[9px] font-bold text-amber-500 uppercase tracking-wide leading-none">Required</span>
                            )}
                          </div>
                          <Input
                            type="date"
                            className="h-7 text-xs border-slate-200"
                            value={m.actual}
                            onChange={(e) => updateMilestone(m.key, "actual", e.target.value)}
                          />
                          <button
                            onClick={() => removeMilestone(m.key)}
                            disabled={m.required}
                            className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-0 disabled:cursor-default"
                            title="Remove milestone"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    } else {
                      const d = row.data;
                      return (
                        <div
                          key={d.id}
                          className={`grid items-center px-3 py-1.5 gap-2 ${bg} border-b border-slate-100 last:border-0 last:rounded-b-lg`}
                          style={{ gridTemplateColumns: "1fr 72px 148px 148px 28px" }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-semibold text-[#1a6ea8] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                              Deliverable
                            </span>
                            <span className="text-sm text-slate-700 font-medium">{d.label}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Input
                              type="number"
                              min={1}
                              max={99}
                              className="h-7 text-xs text-center px-1 border-slate-200"
                              value={d.pct}
                              onChange={(e) => updateDeliv(d.id, "pct", e.target.value)}
                            />
                            <span className="text-[10px] text-slate-400">%</span>
                          </div>
                          <div className="relative">
                            <Input
                              type="date"
                              className={`h-7 text-xs ${!d.planned ? "border-amber-400 bg-amber-50/40" : "border-slate-200"}`}
                              value={d.planned}
                              onChange={(e) => updateDeliv(d.id, "planned", e.target.value)}
                            />
                            {!d.planned && (
                              <span className="absolute top-0 left-2 -translate-y-1/2 bg-white px-0.5 text-[9px] font-bold text-amber-500 uppercase tracking-wide leading-none">Required</span>
                            )}
                          </div>
                          <Input
                            type="date"
                            className="h-7 text-xs border-slate-200"
                            value={d.actual}
                            onChange={(e) => updateDeliv(d.id, "actual", e.target.value)}
                          />
                          <span />
                        </div>
                      );
                    }
                  })
                }
              </div>

              {/* Add optional milestone */}
              {addableOptions.length > 0 && (
                <div className="mt-3 relative">
                  <button
                    onClick={() => setShowAddDropdown((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#1a6ea8] hover:text-[#1a3557] transition-colors"
                  >
                    <PlusCircle size={13} />
                    Add Milestone
                    <ChevronDown size={12} className={`transition-transform ${showAddDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showAddDropdown && (
                    <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-60">
                      {addableOptions.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => addMilestone(opt.key)}
                          className="w-full text-left text-sm px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                        >
                          <span>{opt.label}</span>
                          <span className="text-xs text-slate-400 font-mono ml-4">{opt.pct}%</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <Link href={`/setup/${params.id}`}>
              <button className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors">
                Back: Charter
              </button>
            </Link>
            <div className="flex items-center gap-3">
              {!allRequiredPlanned && (
                <span className="text-xs text-amber-600 font-medium">All required milestones need a planned date</span>
              )}
              <button
                onClick={() => {
                  if (!allRequiredPlanned) return;
                  if (setupProject?.linkedProjectId) {
                    setLocation(`/projects/${setupProject.linkedProjectId}/planning`);
                  } else {
                    setShowDemoModal(true);
                  }
                }}
                disabled={!allRequiredPlanned}
                className="flex items-center gap-2 font-medium py-2 px-6 rounded-lg shadow-sm transition-colors text-sm bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Start Planning
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo modal */}
      {showDemoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowDemoModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#1a3557] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">S&C</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Demo Mode</h3>
                  <p className="text-xs text-slate-400">S&C Planning Tool</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                In a live environment, this would create the project and open the planning workspace with your charter and schedule data pre-loaded.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mt-2">
                For this demo, you will be taken to an existing sample project in the planning workspace.
              </p>
            </div>
            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-sm text-slate-500 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDemoModal(false);
                  setLocation("/projects/7/planning");
                }}
                className="text-sm font-semibold bg-[#1a3557] hover:bg-[#1a6ea8] text-white px-5 py-2 rounded-lg transition-colors"
              >
                Continue to Planning
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
