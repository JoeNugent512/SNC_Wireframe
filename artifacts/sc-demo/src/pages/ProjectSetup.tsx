import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ChevronRight, CheckCircle2, AlertCircle, Save, Info } from "lucide-react";
import Layout from "@/components/Layout";
import { PENDING_SETUP_PROJECTS, SetupProject } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/toaster";

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
  "pmName", "dwgCoP", "hqProponent", "executingOrg", "projectLead",
  "needsContractSupport", "startDate", "endDate", "primaryCmsLink", "cmsGuestLink",
];

function isFilled(v: string) { return v.trim() !== ""; }

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

export default function ProjectSetup() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const raw = PENDING_SETUP_PROJECTS.find((p) => p.id === params.id);

  const [form, setForm] = useState<SetupProject | null>(raw ? { ...raw } : null);

  if (!form) {
    return (
      <Layout>
        <div className="py-24 text-center text-slate-500">Project not found.</div>
      </Layout>
    );
  }

  const set = (field: keyof SetupProject, value: string) =>
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);

  const filledCount = REQUIRED_FIELDS.filter((f) => isFilled(form[f] as string)).length;
  const total = REQUIRED_FIELDS.length;
  const pct = Math.round((filledCount / total) * 100);
  const allFilled = filledCount === total;

  const handleSave = () => {
    if (!allFilled) {
      toast({
        title: "Missing required fields",
        description: `Please fill in all ${total - filledCount} required fields before completing setup.`,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Setup complete",
      description: `${form.number} — ${form.name} has been added to the project list.`,
    });
    setTimeout(() => setLocation("/projects"), 1000);
  };

  const breadcrumb = (
    <>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <Link href="/setup" className="text-slate-400 hover:text-slate-700 transition-colors">Setup Queue</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <span className="font-semibold text-slate-800 font-mono text-xs">{form.number}</span>
    </>
  );

  return (
    <Layout breadcrumb={breadcrumb}>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold text-slate-500">{form.number}</span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    New Project Setup
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">Source: <span className="font-mono">{form.sourceRef}</span></span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{form.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Received {new Date(form.receivedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  {" "}· Submitted by {form.submittedBy}
                </p>
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
                    <CheckCircle2 size={10} /> Ready to submit
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
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-semibold text-slate-700">{form.number}</div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project Title</Label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700">{form.name}</div>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</Label>
                  <Textarea
                    rows={2}
                    className="resize-none text-sm"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Team */}
            <div>
              <SectionLabel>Team</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrap label="Project Manager" filled={isFilled(form.pmName)}>
                  <Input className="border-0 ring-0 focus-visible:ring-0 text-sm h-9" value={form.pmName} onChange={(e) => set("pmName", e.target.value)} placeholder="Full name" />
                </FieldWrap>
                <FieldWrap label="DWG / CoP" filled={isFilled(form.dwgCoP)} tooltip="Select the Discipline Working Group (DWG) or Community of Practice (CoP) responsible for oversight of this project.">
                  <Select value={form.dwgCoP} onValueChange={(v) => set("dwgCoP", v)}>
                    <SelectTrigger className="border-0 ring-0 focus:ring-0 h-9 text-sm shadow-none">
                      <SelectValue placeholder="Select DWG / CoP" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {DWG_COP_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldWrap>
                <FieldWrap label="HQ Proponent" filled={isFilled(form.hqProponent)} tooltip="Indicate the HQ Proponent responsible for this project.">
                  <Input className="border-0 ring-0 focus-visible:ring-0 text-sm h-9" value={form.hqProponent} onChange={(e) => set("hqProponent", e.target.value)} placeholder="Full name" />
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
                <FieldWrap label="Project Lead" filled={isFilled(form.projectLead)} tooltip="Enter the name of the primary SME or field lead who will be leading the work effort (the person using the funds).">
                  <Input className="border-0 ring-0 focus-visible:ring-0 text-sm h-9" value={form.projectLead} onChange={(e) => set("projectLead", e.target.value)} placeholder="Full name" />
                </FieldWrap>
              </div>
            </div>

            {/* Contract & Funding */}
            <div>
              <SectionLabel>Contract &amp; Funding Type</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrap label="Need S&C Contract Support?" filled={isFilled(form.needsContractSupport)} tooltip="For projects planning to utilize an AE and do not have a method to acquire them, select Yes. If you do not need this support, select No.">
                  <Select value={form.needsContractSupport} onValueChange={(v) => set("needsContractSupport", v)}>
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
              </div>
            </div>

            {/* Schedule */}
            <div>
              <SectionLabel>Schedule</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrap label="Start Date" filled={isFilled(form.startDate)}>
                  <Input type="date" className="border-0 ring-0 focus-visible:ring-0 text-sm h-9" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
                </FieldWrap>
                <FieldWrap label="End Date" filled={isFilled(form.endDate)}>
                  <Input type="date" className="border-0 ring-0 focus-visible:ring-0 text-sm h-9" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
                </FieldWrap>
              </div>
            </div>

            {/* Budget */}
            <div>
              <SectionLabel>Budget</SectionLabel>
              <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 inline-block">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Budget at Submission</div>
                <div className="text-base font-bold text-slate-900">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(form.budgetAtSubmission)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Confirmed from change request — read only</div>
              </div>
            </div>

            {/* CMS Information */}
            <div>
              <SectionLabel>CMS Information</SectionLabel>
              <p className="text-xs text-slate-400 mb-4">Required for ALL Tri-Service Projects</p>
              <div className="space-y-4">
                <FieldWrap label="Primary CMS Link" filled={isFilled(form.primaryCmsLink)}>
                  <Input className="border-0 ring-0 focus-visible:ring-0 text-sm h-9 font-mono text-xs" value={form.primaryCmsLink} onChange={(e) => set("primaryCmsLink", e.target.value)} placeholder="https://cms.wbdg.org/..." />
                </FieldWrap>
                <FieldWrap label="CMS Guest Link" filled={isFilled(form.cmsGuestLink)}>
                  <Input className="border-0 ring-0 focus-visible:ring-0 text-sm h-9 font-mono text-xs" value={form.cmsGuestLink} onChange={(e) => set("cmsGuestLink", e.target.value)} placeholder="https://cms.wbdg.org/s/..." />
                </FieldWrap>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Additional CMS Links <span className="normal-case font-normal text-slate-300">(optional)</span></Label>
                  <Input className="text-sm h-9 font-mono text-xs" value={form.additionalCmsLinks} onChange={(e) => set("additionalCmsLinks", e.target.value)} placeholder="Comma-separated URLs" />
                </div>
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
              onClick={handleSave}
              className={`flex items-center gap-2 font-medium py-2 px-6 rounded-lg shadow-sm transition-colors text-sm ${
                allFilled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-[#1a3557] hover:bg-[#243f6a] text-white"
              }`}
            >
              <Save size={15} />
              {allFilled ? "Complete Setup" : "Save Progress"}
            </button>
          </div>
        </div>
      </div>
      <Toaster />
    </Layout>
  );
}
