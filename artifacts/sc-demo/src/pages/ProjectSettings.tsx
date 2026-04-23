import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ChevronRight, Save, ArrowLeft, FileText, Settings2, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_PROJECTS, Project } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";

type Tab = "charter" | "settings";

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

export default function ProjectSettings() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("charter");

  const projectId = params.id;
  const project = MOCK_PROJECTS.find((p) => p.id === projectId);

  const [form, setForm] = useState({
    name: project?.name ?? "",
    status: project?.status ?? "Planning",
    pmName: project?.pmName ?? "",
    description: project?.description ?? "",
  });

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Project details have been updated." });
    setTimeout(() => setLocation(`/projects/${projectId}/planning`), 900);
  };

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
      <span className="font-semibold text-slate-800">Settings</span>
    </>
  );

  return (
    <Layout breadcrumb={breadcrumb}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Card */}
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
            {([ 
              { key: "charter", icon: FileText, label: "Charter" },
              { key: "settings", icon: Settings2, label: "Settings" },
            ] as { key: Tab; icon: typeof FileText; label: string }[]).map(({ key, icon: Icon, label }) => (
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

              {/* Project Identity */}
              <div>
                <SectionLabel>Project Identity</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ReadonlyField label="S&C Number" value={project.number} />
                  <ReadonlyField label="Project Title" value={project.name} />
                </div>
              </div>

              {/* Team */}
              <div>
                <SectionLabel>Team</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ReadonlyField label="DWG / CoP" value={project.dwgCoP} />
                  <ReadonlyField label="HQ Proponent" value={project.hqProponent} />
                  <ReadonlyField label="Executing Org" value={project.executingOrg} />
                  <ReadonlyField label="Project Lead" value={project.projectLead} />
                </div>
              </div>

              {/* Contract & Funding */}
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

              {/* Budget */}
              <div>
                <SectionLabel>Budget</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Budget at Submission", value: project.budgetAtSubmission },
                    { label: "Current Project Budget", value: project.budget },
                    { label: "Actual Obligation", value: project.actualObligation },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">{label}</div>
                      <div className="text-base font-bold text-slate-900">{fmt(value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CMS Information */}
              <div>
                <SectionLabel>CMS Information</SectionLabel>
                <p className="text-xs text-slate-400 mb-3">Required for ALL Tri-Service Projects</p>
                <div className="space-y-4">
                  <ReadonlyField label="Primary CMS Link" value={project.primaryCmsLink} url />
                  <ReadonlyField label="CMS Guest Link" value={project.cmsGuestLink} url />
                  <ReadonlyField label="Additional CMS Links" value={project.additionalCmsLinks} url />
                </div>
              </div>

            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <div className="p-6 space-y-5">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    data-testid="input-project-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val: Project["status"]) => setForm((p) => ({ ...p, status: val }))}
                  >
                    <SelectTrigger id="status" data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pmName">Project Manager</Label>
                <Input
                  id="pmName"
                  value={form.pmName}
                  onChange={(e) => setForm((p) => ({ ...p, pmName: e.target.value }))}
                  data-testid="input-pm-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  data-testid="input-description"
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex justify-end">
            {activeTab === "settings" ? (
              <button
                onClick={handleSave}
                className="bg-[#1a3557] hover:bg-[#243f6a] text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
                data-testid="button-save-settings"
              >
                <Save size={15} />
                Save Changes
              </button>
            ) : (
              <span className="text-xs text-slate-400 italic">Charter fields are read-only in this demo</span>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </Layout>
  );
}
