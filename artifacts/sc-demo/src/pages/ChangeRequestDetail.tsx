import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronRight, FolderOpen, User, CheckCircle, XCircle, ArrowLeft, Copy, Check,
} from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_CHANGE_REQUESTS, MOCK_PROJECTS, ChangeRequest, CRLineItem, CRTravelDetails, CRResourceDetails } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmtDelta = (n: number) => (n > 0 ? "+" : "") + fmt(n);

const isFirstRequest = (cr: ChangeRequest) => cr.status === "First Request";

function netChange(cr: ChangeRequest) {
  if (isFirstRequest(cr))
    return cr.lineItems.reduce((sum, li) => sum + li.to, 0);
  return cr.lineItems.reduce((sum, li) =>
    li.direction === "Increase" ? sum + li.amount : sum - li.amount, 0);
}

function buildLineDesc(cr: ChangeRequest, li: CRLineItem): string {
  const fy = cr.projectNumber.substring(0, 2);
  return `FY${fy}/SANDC ${li.type.toUpperCase()} FUNDS FOR ${cr.projectNumber}/${li.resource.toUpperCase()}/`;
}

function typeChipClass(type: CRLineItem["type"]) {
  if (type === "Labor")  return "bg-blue-50 text-blue-700 border-blue-200";
  if (type === "Travel") return "bg-violet-50 text-violet-700 border-violet-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function StatusBadge({ status }: { status: ChangeRequest["status"] }) {
  const map: Record<string, string> = {
    "First Request":"bg-slate-100 text-slate-600 border-slate-300",
    Approved:       "bg-emerald-100 text-emerald-800 border-emerald-200",
    Pending:        "bg-blue-100 text-blue-800 border-blue-200",
    "Under Review": "bg-amber-100 text-amber-800 border-amber-200",
    Rejected:       "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status]}`}>
      {status}
    </span>
  );
}

function DescNotesCell({ initialDesc, disabled }: { initialDesc: string; disabled: boolean }) {
  const [text, setText] = useState(initialDesc);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        rows={2}
        className="w-full text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-200 leading-relaxed disabled:opacity-60 disabled:cursor-default"
        style={{ minWidth: 200 }}
      />
      <button
        onClick={copy}
        className="self-start flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
      >
        {copied
          ? <><Check size={11} className="text-emerald-500" /> Copied</>
          : <><Copy size={11} /> Copy</>}
      </button>
    </div>
  );
}

function OrgCodeHeader({ orgCode }: { orgCode: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(orgCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono">
        {orgCode}
      </span>
      <button
        onClick={copy}
        className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
        title="Copy org code"
      >
        {copied
          ? <><Check size={11} className="text-emerald-500" /><span className="text-emerald-600">Copied</span></>
          : <><Copy size={11} /><span>Copy</span></>}
      </button>
    </div>
  );
}

const TYPE_ORDER: CRLineItem["type"][] = ["Labor", "Travel", "Contracting", "Materials", "Materials & Other"];

const TYPE_DOT: Record<string, string> = {
  Labor: "#60a5fa", Travel: "#a78bfa", Contracting: "#34d399", Materials: "#f59e0b", "Materials & Other": "#f59e0b",
};

const fieldLabelCls = "block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5";
const fieldValueCls = "text-xs text-slate-700 leading-relaxed";

function TravelDetailPanel({ d }: { d: CRTravelDetails }) {
  return (
    <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
      <div className="grid grid-cols-3 gap-x-6 gap-y-2 mb-2">
        {d.poc && (
          <div>
            <p className={fieldLabelCls}>POC</p>
            <p className={fieldValueCls}>{d.poc}</p>
          </div>
        )}
        {d.travelers && (
          <div>
            <p className={fieldLabelCls}>Travelers</p>
            <p className={fieldValueCls}>{d.travelers}</p>
          </div>
        )}
        {d.dates && (
          <div>
            <p className={fieldLabelCls}>Dates of Travel</p>
            <p className={fieldValueCls}>{d.dates}</p>
          </div>
        )}
      </div>
      {d.purpose && (
        <div>
          <p className={fieldLabelCls}>Purpose of Travel</p>
          <p className={fieldValueCls}>{d.purpose}</p>
        </div>
      )}
    </div>
  );
}

function ResourceDetailPanel({ d }: { d: CRResourceDetails }) {
  return (
    <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-2">
        {d.pop && (
          <div>
            <p className={fieldLabelCls}>Period of Performance (POP)</p>
            <p className={fieldValueCls}>{d.pop}</p>
          </div>
        )}
        {d.poc && (
          <div>
            <p className={fieldLabelCls}>POC</p>
            <p className={fieldValueCls}>{d.poc}</p>
          </div>
        )}
      </div>
      {d.purpose && (
        <div>
          <p className={fieldLabelCls}>Purpose</p>
          <p className={fieldValueCls}>{d.purpose}</p>
        </div>
      )}
    </div>
  );
}

function BudgetChangesTable({ cr, disabled }: { cr: ChangeRequest; disabled: boolean }) {
  const firstReq = isFirstRequest(cr);
  const net = netChange(cr);

  // Group by orgCode first, then type within each org — matches planning preview style
  const orgOrder: string[] = [];
  const byOrg: Record<string, CRLineItem[]> = {};
  for (const li of cr.lineItems) {
    if (!byOrg[li.orgCode]) { byOrg[li.orgCode] = []; orgOrder.push(li.orgCode); }
    byOrg[li.orgCode].push(li);
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Navy section header */}
      <div className="px-4 py-2.5" style={{ backgroundColor: "#1a3557" }}>
        <span className="text-white font-bold text-xs tracking-widest uppercase">Budget Changes</span>
      </div>

      {orgOrder.map((orgCode) => {
        const orgItems = byOrg[orgCode];
        const typeMap: Partial<Record<CRLineItem["type"], CRLineItem[]>> = {};
        for (const li of orgItems) {
          if (!typeMap[li.type]) typeMap[li.type] = [];
          typeMap[li.type]!.push(li);
        }
        const usedTypes = TYPE_ORDER.filter((t) => typeMap[t]);

        return (
          <div key={orgCode} className="border-b border-slate-200 last:border-b-0">
            {/* Org code header */}
            <div className="px-4 py-1.5 flex items-center gap-3" style={{ backgroundColor: "#1e3a5f" }}>
              <span className="font-mono text-xs font-bold" style={{ color: "#93c5fd" }}>{orgCode}</span>
            </div>

            {usedTypes.map((type) => {
              const typeItems = typeMap[type]!;
              const justification = cr.typeJustifications?.[type];
              const dot = TYPE_DOT[type] ?? "#94a3b8";

              return (
                <div key={type}>
                  {/* Type sub-header with column labels */}
                  <div className="px-4 py-1.5 flex items-center gap-2 border-b border-slate-100" style={{ backgroundColor: "#f1f5f9" }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex-1">{type}</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase" style={{ width: 96, textAlign: "right" }}>Committed</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase" style={{ width: 84, textAlign: "right" }}>Change</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase" style={{ width: 96, textAlign: "right" }}>Requested</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase pl-3" style={{ width: 220 }}>Description</span>
                  </div>

                  {/* Justification block */}
                  {justification && (
                    <div className="px-4 py-2.5 border-b" style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}>
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Justification</p>
                      <p className="text-xs text-amber-900 leading-relaxed">{justification}</p>
                    </div>
                  )}

                  {/* Data rows */}
                  {typeItems.map((li, i) => {
                    const displayFrom = firstReq ? 0 : li.from;
                    const delta = firstReq ? li.to : (li.direction === "Increase" ? li.amount : -li.amount);
                    const isTravel    = li.type === "Travel";
                    const isResource  = li.type === "Materials" || li.type === "Contracting" || li.type === "Materials & Other";
                    const hasDetail   = (isTravel && li.travelDetails) || (isResource && li.resourceDetails);
                    return (
                      <div key={i}>
                        <div
                          className="px-4 py-2.5 flex items-start gap-2 border-b border-slate-100"
                          style={{ backgroundColor: hasDetail ? "#f8fafc" : undefined }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 leading-snug truncate" title={li.resource}>{li.resource}</p>
                            <p className="text-xs text-slate-400">{li.orgCode}</p>
                          </div>
                          <span className="tabular-nums text-sm text-slate-500" style={{ width: 96, textAlign: "right", paddingTop: 2 }}>
                            {fmt(displayFrom)}
                          </span>
                          <span
                            className="tabular-nums text-sm font-semibold"
                            style={{ width: 84, textAlign: "right", paddingTop: 2, color: delta > 0 ? "#15803d" : delta < 0 ? "#b91c1c" : "#94a3b8" }}
                          >
                            {delta > 0 ? "+" : ""}{fmt(delta)}
                          </span>
                          <span className="tabular-nums text-sm font-medium text-slate-800" style={{ width: 96, textAlign: "right", paddingTop: 2 }}>
                            {fmt(li.to)}
                          </span>
                          <div style={{ width: 220 }} className="pl-3">
                            <DescNotesCell initialDesc={buildLineDesc(cr, li)} disabled={disabled} />
                          </div>
                        </div>
                        {isTravel && li.travelDetails && <TravelDetailPanel d={li.travelDetails} />}
                        {isResource && li.resourceDetails && <ResourceDetailPanel d={li.resourceDetails} />}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Net change footer */}
      <div className="px-4 py-2.5 flex items-center bg-slate-50 border-t-2 border-slate-200">
        <span className="flex-1" />
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider" style={{ width: 96, textAlign: "right" }}>Net Change</span>
        <span
          className="tabular-nums text-sm font-bold"
          style={{ width: 84, textAlign: "right", color: net > 0 ? "#15803d" : net < 0 ? "#b91c1c" : "#475569" }}
        >
          {net === 0 ? "$0" : fmtDelta(net)}
        </span>
        <span style={{ width: 96 + 220 + 12 }} />
      </div>
    </div>
  );
}

export default function ChangeRequestDetail({ params }: { params?: { id?: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [actionReason, setActionReason] = useState("");

  const cr = MOCK_CHANGE_REQUESTS.find(x => x.id === params?.id);

  if (!cr) {
    return (
      <Layout roleBadge="BA View" breadcrumb={<>
        <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <Link href="/change-requests" className="text-slate-400 hover:text-slate-700 transition-colors">Change Requests</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-500">Not Found</span>
      </>}>
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <FolderOpen size={40} className="text-slate-300 mb-3" />
          <p>Change request not found.</p>
          <Link href="/change-requests" className="mt-3 text-sm text-primary hover:underline">Back to list</Link>
        </div>
      </Layout>
    );
  }

  const isActionable = cr.status !== "Approved" && cr.status !== "Rejected";
  const project = MOCK_PROJECTS.find(p => p.number === cr.projectNumber);
  const proponent = project?.hqProponent ?? "—";
  const toa = project?.budget ?? 0;
  const planned = project?.actualObligation ?? 0;
  const freeBalance = toa - planned;

  const handleAction = (action: "Approve" | "Reject") => {
    const verb = action === "Approve" ? "approved" : "rejected";
    toast({
      title: `Change request ${verb}`,
      description: action === "Approve"
        ? `${cr.projectNumber} — ${cr.projectName} budget change has been approved.`
        : actionReason.trim()
          ? `Rejected: ${actionReason.trim()}`
          : `${cr.projectNumber} change request has been rejected.`,
      variant: action === "Approve" ? "default" : "destructive",
    });
    setTimeout(() => setLocation("/change-requests"), 1200);
  };

  return (
    <Layout roleBadge="BA View" breadcrumb={<>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300" />
      <Link href="/change-requests" className="text-slate-400 hover:text-slate-700 transition-colors">Change Requests</Link>
      <ChevronRight size={14} className="text-slate-300" />
      <span className="font-semibold text-slate-800">{cr.projectNumber}</span>
    </>}>
      <div className="max-w-5xl mx-auto space-y-6 pb-16">

        {/* Back link + header */}
        <div>
          <Link
            href="/change-requests"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft size={15} /> Back to Change Requests
          </Link>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              {/* Left: identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FolderOpen size={14} className="text-primary/70" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Change Request</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 leading-snug">
                  <span className="font-mono text-base text-slate-400 mr-2">{cr.projectNumber}</span>
                  {cr.projectName}
                </h1>
                <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                  <StatusBadge status={cr.status} />
                  <span className="text-sm text-slate-500 flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    <strong className="text-slate-700 font-semibold">{cr.submittedBy}</strong>
                    <span className="text-slate-300">·</span>
                    {cr.date}
                  </span>
                  <span className="text-sm text-slate-500">
                    Proponent: <strong className="text-slate-700 font-medium">{proponent}</strong>
                  </span>
                </div>
              </div>

              {/* Right: funding summary */}
              <div className="flex items-stretch gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200 self-start">
                {([
                  { label: "TOA",          value: toa,         color: "text-slate-800" },
                  { label: "Planned",      value: planned,     color: "text-slate-800" },
                  { label: "Free Balance", value: freeBalance, color: freeBalance >= 0 ? "text-emerald-700" : "text-red-600" },
                ] as const).map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col items-end px-4 py-3 bg-white gap-0.5 min-w-[120px]">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{label}</span>
                    <span className={`text-base font-bold tabular-nums ${color}`}>{fmt(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Project overview */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Project Overview</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{cr.projectDescription}</p>
        </div>

        {/* Budget changes */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <BudgetChangesTable cr={cr} disabled={!isActionable} />
        </div>

        {/* Justification */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Justification</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{cr.justification}</p>
        </div>

        {/* Decision + actions */}
        {isActionable && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Decision</h2>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Reason <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Provide a reason for your decision…"
                className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleAction("Reject")}
                className="px-5 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <XCircle size={16} /> Reject
              </button>
              <button
                onClick={() => handleAction("Approve")}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle size={16} /> Approve Changes
              </button>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </Layout>
  );
}
