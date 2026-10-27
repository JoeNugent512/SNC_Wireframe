import { useLayoutEffect, useRef, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ChevronRight, CheckCircle2, AlertCircle, Info, PlusCircle, Trash2, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { PENDING_SETUP_PROJECTS, SetupProject } from "@/lib/mockData";
import { Deliverable, saveCharterData, getCharterData } from "@/lib/setupStore";
import { useUser } from "@/lib/userContext";
import { getFiscalPeriod } from "@/lib/fiscalYear";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/toaster";

const DELIVERABLE_TYPES = [
  "UFGS", "UFC", "ER", "ECB", "EP", "EM", "ETL", "ENG", "DG", "Supplement", "OTHER",
];

const DWG_COP_OPTIONS = [
  "Architecture","Aviation","CAD/BIM","Civil","Climate Preparedness",
  "Comprehensive Plng","Construction","Contingency","Control Systems",
  "Coordinating Panel","Cost Engineering","Dam Safety","Design-Build",
  "Electrical","Engineering Management","ESEP","Facility Space Plng",
  "Fire Protection","Fuels","Geospatial","Geotechnical","Hydrology",
  "Installation Resiliency","Landscape Architecture","Levee Safety",
  "Mechanical","Medical","Pavements / Airfields","Security","Specifications",
  "Structural","Sustainability","TCP","Value Engineering","Waterfront",
  "Other (not listed)","Program Management","N/A",
];

const EXECUTING_ORG_OPTIONS = [
  "HQ E&C","HQ Other","HNC","IWR","ERDC",
  "LRB","LRC","LRE","LRH","LRL","LRN","LRP",
  "MVM","MVN","MVR","MVS","MVP","MVK",
  "NAB","NAU","NAE","NAN","NAO","NAP",
  "NWK","NWO","NWP","NWS","NWW",
  "POA","POF","POH","POJ",
  "SAC","SAJ","SAM","SAS","SAW",
  "SPA","SPL","SPK","SPF",
  "SWF","SWG","SWL","SWT",
  "TAM","TAA","OTHER (Specify in comments)",
];

const REQUIRED_FIELDS: (keyof SetupProject)[] = [
  "dwgCoP", "hqProponent", "executingOrg", "projectLead",
  "needsContractSupport",
];

// Illustrative options only; this is not a live organization directory.
const CONTRACT_SUPPORT_OPTIONS = [
  { label: "USACE Districts", options: [
    "USACE — Baltimore District", "USACE — Mobile District", "USACE — Norfolk District",
    "USACE — Sacramento District", "USACE — Savannah District", "USACE — Seattle District",
  ] },
  { label: "Military Branches", options: [
    "U.S. Army", "U.S. Navy", "U.S. Air Force", "U.S. Marine Corps", "U.S. Space Force", "U.S. Coast Guard",
  ] },
  { label: "Contracting", options: [
    "USACE Contracting Office", "Regional Contracting Center", "Other Contracting Office",
  ] },
];

const BLANK_ARMY: SetupProject = {
  id: "new",
  number: "NEW-A",
  name: "",
  description: "",
  estimatedBudget: 0,
  pmName: "",
  dwgCoP: "",
  hqProponent: "",
  executingOrg: "",
  projectLead: "",
  needsContractSupport: "",
  specialFundingType: "",
  budgetAtSubmission: 0,
  startDate: "",
  endDate: "",
  primaryCmsLink: "",
  cmsGuestLink: "",
  additionalCmsLinks: "",
  sourceRef: "",
  submittedBy: "",
  receivedDate: getFiscalPeriod().today.toISOString().slice(0, 10),
};

function isFilled(v: string) { return (v ?? "").trim() !== ""; }

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{children}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function FieldWrap({ label, filled, required = true, tooltip, children }: {
  label: string; filled: boolean; required?: boolean; tooltip?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className={`text-xs font-semibold uppercase tracking-wider ${filled ? "text-slate-400" : "text-amber-600"}`}>
          {label}
        </Label>
        {tooltip && (
          <span title={tooltip} className="cursor-help text-slate-300 hover:text-slate-500 transition-colors">
            <Info size={12} />
          </span>
        )}
        {required && !filled && (
          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Required</span>
        )}
        {filled && <CheckCircle2 size={12} className="text-emerald-500" />}
      </div>
      <div className={`rounded-lg overflow-hidden ring-1 transition-all ${filled ? "ring-slate-200" : "ring-amber-300 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]"}`}>
        {children}
      </div>
    </div>
  );
}

let _deliverableCounter = 1;
function newDeliverable(): Deliverable {
  return { id: `d-${_deliverableCounter++}`, type: "", numDesc: "" };
}

export default function ProjectSetup() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();

  const isNew = !params.id || params.id === "new";
  const raw = isNew ? BLANK_ARMY : PENDING_SETUP_PROJECTS.find((p) => p.id === params.id);

  const isArmy = isNew || (raw?.number ?? "").includes("A");

  const [form, setForm] = useState<SetupProject>(() => {
    const initial = { ...(raw ?? BLANK_ARMY) };
    const saved = getCharterData();
    if (saved.projectId === initial.id && saved.needsContractSupport !== undefined) {
      initial.needsContractSupport = saved.needsContractSupport;
      initial.contractSupportOrganization = saved.contractSupportOrganization ?? "";
    }
    return initial;
  });
  const [deliverables, setDeliverables] = useState<Deliverable[]>(() =>
    raw?.deliverables?.map(d => ({ ...d })) ?? [newDeliverable()]);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const resizeDescription = () => {
      const textarea = descriptionRef.current;
      if (!textarea) return;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + 2}px`;
    };
    resizeDescription();
    window.addEventListener("resize", resizeDescription);
    return () => window.removeEventListener("resize", resizeDescription);
  }, [form.description]);

  const readOnly = !isNew && (
    user.role === "Budget Analyst" ||
    (user.role === "Project Lead" && form.projectLead !== user.name)
  );

  if (!isNew && !PENDING_SETUP_PROJECTS.find((p) => p.id === params.id)) {
    return (
      <Layout>
        <div className="py-24 text-center text-slate-500">Project not found.</div>
      </Layout>
    );
  }

  const set = (field: keyof SetupProject, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setDeliverable = (id: string, field: keyof Deliverable, value: string) =>
    setDeliverables((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));

  const addDeliverable = () => setDeliverables((prev) => [...prev, newDeliverable()]);
  const removeDeliverable = (id: string) =>
    setDeliverables((prev) => prev.length > 1 ? prev.filter((d) => d.id !== id) : prev);

  const filledCount = REQUIRED_FIELDS.filter((f) => isFilled(form[f] as string)).length;
  const total = REQUIRED_FIELDS.length;
  const pct = Math.round((filledCount / total) * 100);
  const allFilled = filledCount === total;
  const hasDeliverable = deliverables.some((d) => isFilled(d.type));

  const handleNext = () => {
    if (readOnly && raw?.linkedProjectId) {
      setLocation(`/setup/${raw.id}/schedule`);
      return;
    }
    if (readOnly) {
      toast({ title: "You do not have edit access to this project.", variant: "destructive" });
      // Revert any edits the user may have made back to the saved project data
      if (raw) setForm({ ...raw });
      return;
    }
    saveCharterData({
      projectId: form.id,
      projectNumber: form.number,
      projectName: form.name,
      deliverables,
      needsContractSupport: form.needsContractSupport,
      contractSupportOrganization: form.needsContractSupport === "Yes" ? form.contractSupportOrganization ?? "" : "",
    });
    setLocation(`/setup/${form.id}/schedule`);
  };

  const breadcrumb = (
    <>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <Link href="/setup" className="text-slate-400 hover:text-slate-700 transition-colors">Setup Queue</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <span className="font-semibold text-slate-800 font-mono text-xs">
        {isNew ? "New Army Project" : form.number}
      </span>
    </>
  );

  return (
    <Layout breadcrumb={breadcrumb}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a3557] text-white text-xs font-semibold">
            <span className="w-4 h-4 rounded-full bg-white text-[#1a3557] flex items-center justify-center text-[10px] font-bold">1</span>
            Charter
          </div>
          <ChevronRight size={14} className="text-slate-300" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold">
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">2</span>
            Schedule
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {!isNew && (
                    <>
                      <span className="font-mono text-xs font-semibold text-slate-500">{form.number}</span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {isArmy ? "Army" : "Tri-Service"} Project Setup
                      </span>
                      {form.sourceRef && (
                        <span className="text-[10px] font-semibold text-slate-400">Source: <span className="font-mono">{form.sourceRef}</span></span>
                      )}
                    </>
                  )}
                  {isNew && (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      New Army Project
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900">{isNew ? "Army Project Charter" : form.name}</h2>
                {!isNew && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Received {new Date(form.receivedDate).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" })}
                    {form.submittedBy && ` · Submitted by ${form.submittedBy}`}
                  </p>
                )}
              </div>

              {/* Progress indicator */}
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <span className={`text-sm font-bold ${allFilled ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-500"}`}>
                  {filledCount} / {total} fields
                </span>
                <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${allFilled ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {!allFilled && (
                  <span className="text-[10px] text-amber-600 flex items-center gap-1">
                    <AlertCircle size={10} /> {total - filledCount} required
                  </span>
                )}
                {allFilled && (
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Charter complete
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">

            {/* Project Identity */}
            <div>
              <SectionLabel>Project Identity</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">S&amp;C Number</Label>
                  {isNew ? (
                    <Input
                      className="text-sm h-9 font-mono font-semibold"
                      value={form.number}
                      onChange={(e) => set("number", e.target.value)}
                      placeholder="e.g. 26A07"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-semibold text-slate-700">{form.number}</div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project Title</Label>
                  {isNew ? (
                    <Input
                      className="text-sm h-9"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Project name"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700">{form.name}</div>
                  )}
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="project-description" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</Label>
                  <Textarea
                    id="project-description"
                    ref={descriptionRef}
                    rows={4}
                    className="min-h-28 resize-none overflow-hidden text-sm"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Brief project description"
                  />
                </div>
              </div>
            </div>

            {/* Team */}
            <div>
              <SectionLabel>Team</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrap label="HQ Proponent" filled={isFilled(form.hqProponent)} tooltip="Indicate the HQ Proponent responsible for this project.">
                  <Input className="border-0 ring-0 focus-visible:ring-0 text-sm h-9" value={form.hqProponent} onChange={(e) => set("hqProponent", e.target.value)} placeholder="Full name" />
                </FieldWrap>
                <FieldWrap label="DWG / CoP" filled={isFilled(form.dwgCoP)} tooltip="Select the Discipline Working Group (DWG) or Community of Practice (CoP) responsible for oversight.">
                  <Select value={form.dwgCoP} onValueChange={(v) => set("dwgCoP", v)}>
                    <SelectTrigger className="border-0 ring-0 focus:ring-0 h-9 text-sm shadow-none">
                      <SelectValue placeholder="Select DWG / CoP" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {DWG_COP_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldWrap>
                <FieldWrap label="Project Lead" filled={isFilled(form.projectLead)} tooltip="The primary SME or field lead who will be leading the work effort.">
                  <Input className="border-0 ring-0 focus-visible:ring-0 text-sm h-9" value={form.projectLead} onChange={(e) => set("projectLead", e.target.value)} placeholder="Full name" />
                </FieldWrap>
                <FieldWrap label="Executing Org" filled={isFilled(form.executingOrg)} tooltip="Select the Organization Executing the Work (those who will be receiving funding).">
                  <Select value={form.executingOrg} onValueChange={(v) => set("executingOrg", v)}>
                    <SelectTrigger className="border-0 ring-0 focus:ring-0 h-9 text-sm shadow-none">
                      <SelectValue placeholder="Select Organization" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {EXECUTING_ORG_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldWrap>
              </div>
            </div>

            {/* Contract & Funding */}
            <div>
              <SectionLabel>Contract &amp; Funding Type</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrap label="Need S&C Contract Support?" filled={isFilled(form.needsContractSupport)} tooltip="For projects planning to utilize an AE and do not have a method to acquire them, select Yes.">
                  <Select value={form.needsContractSupport} onValueChange={v =>
                    setForm(prev => ({
                      ...prev, needsContractSupport: v as SetupProject["needsContractSupport"],
                      contractSupportOrganization: v === "Yes" ? prev.contractSupportOrganization ?? "" : "",
                    }))
                  }>
                    <SelectTrigger className="border-0 ring-0 focus:ring-0 h-9 text-sm shadow-none">
                      <SelectValue placeholder="Select Choice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldWrap>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Special Funding Type <span className="normal-case font-normal text-slate-300">(optional)</span></Label>
                  <Input className="text-sm h-9" value={form.specialFundingType} onChange={(e) => set("specialFundingType", e.target.value)} placeholder="e.g. Resiliency, Emergency" />
                </div>
                {form.needsContractSupport === "Yes" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="contract-support-organization" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Contract Support Organization
                    </Label>
                    <Select value={form.contractSupportOrganization ?? ""} onValueChange={v => set("contractSupportOrganization", v)}>
                      <SelectTrigger id="contract-support-organization" className="h-9 text-sm">
                        <SelectValue placeholder="Select support organization" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {CONTRACT_SUPPORT_OPTIONS.map(group => (
                          <SelectGroup key={group.label}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {group.options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <SectionLabel>Deliverables</SectionLabel>
              <p className="text-xs text-slate-400 mb-4">
                What documents will be completed/published as an outcome of this project? For each deliverable, select a type and enter the number or description.
              </p>

              <div className="space-y-3">
                {/* Column headers */}
                <div className="grid gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1" style={{ gridTemplateColumns: "160px 1fr 32px" }}>
                  <span>Type</span>
                  <span>Number / Description</span>
                  <span />
                </div>

                {deliverables.map((d, idx) => (
                  <div key={d.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: "160px 1fr 32px" }}>
                    <div className={`rounded-lg overflow-hidden ring-1 ${isFilled(d.type) ? "ring-slate-200" : idx === 0 ? "ring-amber-300 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]" : "ring-slate-200"}`}>
                      <Select value={d.type} onValueChange={(v) => setDeliverable(d.id, "type", v)}>
                        <SelectTrigger className="border-0 ring-0 focus:ring-0 h-9 text-sm shadow-none">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERABLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      className="h-9 text-sm font-mono"
                      value={d.numDesc}
                      onChange={(e) => setDeliverable(d.id, "numDesc", e.target.value)}
                      placeholder="e.g. 26 27 13.10 30"
                    />
                    <button
                      onClick={() => removeDeliverable(d.id)}
                      disabled={deliverables.length === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove deliverable"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addDeliverable}
                  className="flex items-center gap-2 text-xs font-medium text-[#1a6ea8] hover:text-[#1a3557] transition-colors mt-1 px-1"
                >
                  <PlusCircle size={14} />
                  Add Deliverable
                </button>

                {!hasDeliverable && (
                  <p className="text-[10px] text-amber-600 flex items-center gap-1 px-1">
                    <AlertCircle size={10} /> At least one deliverable type is required
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <Link href="/setup">
              <button className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors">
                Back to Queue
              </button>
            </Link>
            <button
              onClick={handleNext}
              title={readOnly ? "Read-only for your role" : undefined}
              className={`flex items-center gap-2 font-medium py-2 px-6 rounded-lg shadow-sm transition-colors text-sm ${
                readOnly
                  ? "bg-slate-300 text-slate-400 cursor-not-allowed"
                  : "bg-[#1a3557] hover:bg-[#1a6ea8] text-white"
              }`}
            >
              Next: Schedule
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
      <Toaster />
    </Layout>
  );
}
