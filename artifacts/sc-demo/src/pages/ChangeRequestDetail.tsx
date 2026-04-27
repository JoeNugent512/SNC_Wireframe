import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronRight, FolderOpen, User, CheckCircle, XCircle, ArrowLeft, Copy, Check,
} from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_CHANGE_REQUESTS, MOCK_PROJECTS, ChangeRequest, CRLineItem } from "@/lib/mockData";
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

function BudgetChangesTable({ cr, disabled }: { cr: ChangeRequest; disabled: boolean }) {
  const firstReq = isFirstRequest(cr);
  const groups: { orgCode: string; items: CRLineItem[] }[] = [];
  const seen = new Map<string, number>();
  for (const li of cr.lineItems) {
    if (!seen.has(li.orgCode)) {
      seen.set(li.orgCode, groups.length);
      groups.push({ orgCode: li.orgCode, items: [] });
    }
    groups[seen.get(li.orgCode)!].items.push(li);
  }

  const net = netChange(cr);

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div
        className="grid text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-200 px-4 py-2.5"
        style={{ gridTemplateColumns: "90px 1fr 96px 96px 84px 1fr" }}
      >
        <span>Type</span>
        <span>Resource</span>
        <span className="text-right">Current</span>
        <span className="text-right">Proposed</span>
        <span className="text-right">Change</span>
        <span className="pl-2">Description / Notes</span>
      </div>

      {groups.map((group, gi) => (
        <div key={group.orgCode} className={gi > 0 ? "border-t-2 border-slate-200" : ""}>
          <OrgCodeHeader orgCode={group.orgCode} />

          {group.items.map((li, i) => {
            const displayFrom = firstReq ? 0 : li.from;
            const delta = firstReq ? li.to : (li.direction === "Increase" ? li.amount : -li.amount);
            const hasJust = !!cr.typeJustifications?.[li.type];
            return (
              <div
                key={i}
                className="grid items-start px-4 py-3 gap-3 border-t border-slate-100"
                style={{ gridTemplateColumns: "90px 1fr 96px 96px 84px 1fr" }}
              >
                <div className="pt-0.5 flex flex-col gap-1">
                  <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded border ${typeChipClass(li.type)}`}>
                    {li.type}
                  </span>
                  {hasJust && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded">
                      <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" />
                      JUSTIF.
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-700 font-medium leading-tight pt-0.5 truncate" title={li.resource}>
                  {li.resource}
                </span>
                <span className="text-sm tabular-nums text-slate-500 text-right pt-0.5">{fmt(displayFrom)}</span>
                <span className="text-sm tabular-nums font-medium text-slate-800 text-right pt-0.5">{fmt(li.to)}</span>
                <span className={`text-sm tabular-nums font-semibold text-right pt-0.5 ${delta > 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {delta > 0 ? "+" : ""}{fmt(delta)}
                </span>
                <div className="pl-2">
                  <DescNotesCell initialDesc={buildLineDesc(cr, li)} disabled={disabled} />
                </div>
              </div>
            );
          })}
          {/* per-type justification callouts for this org code group */}
          {(() => {
            const typesInGroup = [...new Set(group.items.map((li) => li.type))];
            const callouts = typesInGroup.filter((t) => cr.typeJustifications?.[t]);
            if (callouts.length === 0) return null;
            return (
              <div className="mx-4 mb-3 mt-1 rounded-lg border border-amber-200 bg-amber-50 overflow-hidden">
                {callouts.map((t, ci) => (
                  <div key={t} className={`px-3 py-2.5 ${ci > 0 ? "border-t border-amber-200" : ""}`}>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">{t} Justification</p>
                    <p className="text-xs text-amber-900 leading-relaxed">{cr.typeJustifications![t]}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ))}

      <div
        className="grid items-center px-4 py-2.5 bg-slate-50 border-t-2 border-slate-200"
        style={{ gridTemplateColumns: "90px 1fr 96px 96px 84px 1fr" }}
      >
        <span className="col-span-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">
          Net Change
        </span>
        <span className={`text-sm font-bold tabular-nums text-right ${net > 0 ? "text-emerald-700" : net < 0 ? "text-red-600" : "text-slate-500"}`}>
          {net === 0 ? "$0" : fmtDelta(net)}
        </span>
        <span />
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
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Budget Changes</h2>
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
