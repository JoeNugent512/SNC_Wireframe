import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronRight, FolderOpen, User, CheckCircle, XCircle, ArrowLeft, Copy, Check, Lock,
} from "lucide-react";
import Layout from "@/components/Layout";
import FinancialPocTooltip from "@/components/FinancialPocTooltip";
import { MOCK_PROJECTS, ChangeRequest, CRLineItem, CRTravelDetails, CRResourceDetails } from "@/lib/mockData";
import { useChangeRequests } from "@/lib/changeRequestsContext";
import { formatRequestNumber } from "@/lib/requestNumber";
import { CURRENT_FY, getFiscalYearForDate } from "@/lib/fiscalYear";
import { fundingCurrency, fundingTotal, type ProjectFunding } from "@/lib/projectFunding";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUser } from "@/lib/userContext";

const fmt = fundingCurrency;

const fmtDelta = (n: number) => (n > 0 ? "+" : "") + fmt(n);

function CopyValue({ children, value, className = "", style }: { children: React.ReactNode; value: string; className?: string; style?: React.CSSProperties }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => setCopied(true));
  };
  const icon = copied
    ? <Check size={11} className="text-emerald-500 shrink-0" />
    : <Copy size={11} className="text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />;
  return (
    <span
      onClick={copy}
      title={copied ? "Copied" : "Click to copy"}
      className={`cursor-pointer select-none group ${className}`}
      style={style}
    >
      {children}
      {icon}
    </span>
  );
}

// Approval status does not determine whether this is initial funding or an adjustment.
const isFirstRequest = (cr: ChangeRequest) => cr.lineItems.every(li => li.from === 0);

function netChange(cr: ChangeRequest) {
  if (isFirstRequest(cr))
    return cr.lineItems.reduce((sum, li) => sum + li.to, 0);
  return cr.lineItems.reduce((sum, li) =>
    li.direction === "Increase" ? sum + li.amount : sum - li.amount, 0);
}

function buildLineDesc(cr: ChangeRequest, li: CRLineItem): string {
  const fy = cr.requestFY ?? `FY${String(getFiscalYearForDate(cr.date) % 100).padStart(2, "0")}`;
  return `${fy}/SANDC ${li.type.toUpperCase()} FUNDS FOR ${cr.projectNumber}/${li.resource.toUpperCase()}/`;
}

const FY_COLS = ["FY25", "FY26", "FY27", "FY28", "FY29"] as const;
const FY_WEIGHTS = [0.15, 0.22, 0.28, 0.22, 0.13]; // sum = 1.0

function ProjectFundingTable({ project }: { project: { budget: number; planningBudget?: number; funding?: ProjectFunding } }) {
  const total = project.planningBudget ?? project.budget;
  const laborTotal    = Math.round(total * 0.72);
  const travelTotal   = Math.round(total * 0.04);
  const otherTotal    = Math.round(total * 0.08);
  const categories = project.funding ? [
    { label: "Labor", key: "Labor" as const },
    { label: "Travel", key: "Travel" as const },
    { label: "Outsourced / Other", key: "Outsourcing & Other" as const },
  ].map(({ label, key }) => {
    const values = FY_COLS.map(fy => project.funding!.annual[fy]?.[key]?.plan ?? 0);
    return { label, values, total: values.reduce((sum, value) => sum + value, 0) };
  }) : [
    { label: "Labor",            total: laborTotal,  values: FY_WEIGHTS.map(w => Math.round(laborTotal * w)) },
    { label: "Travel",           total: travelTotal, values: FY_WEIGHTS.map(w => Math.round(travelTotal * w)) },
    { label: "Outsourced / Other", total: otherTotal, values: FY_WEIGHTS.map(w => Math.round(otherTotal * w)) },
  ];
  const yearTotals = FY_COLS.map((_, i) => categories.reduce((s, c) => s + c.values[i], 0));
  const grandTotal = categories.reduce((s, c) => s + c.total, 0);
  return (
    <div className="rounded-lg border border-slate-200 overflow-x-auto">
      <table className="text-xs w-full min-w-[640px] border-collapse">
        <thead>
          <tr style={{ backgroundColor: "#1a3557" }}>
            <th className="px-3 py-2 text-left text-white font-semibold">Project Overview</th>
            {FY_COLS.map(fy => (
              <th key={fy} className={`px-3 py-2 text-right font-semibold ${fy === CURRENT_FY ? "bg-amber-200 text-amber-950" : "text-white"}`}>
                {fy}
                {fy === CURRENT_FY && <span className="block text-[10px] font-medium">Current FY</span>}
              </th>
            ))}
            <th className="px-3 py-2 text-right text-white font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.map(({ label, values, total: catTotal }) => (
            <tr key={label} className="bg-white">
              <td className="px-3 py-2 text-slate-600 font-medium whitespace-nowrap">{label}</td>
              {values.map((v, i) => (
                <td key={i} className={`px-3 py-2 text-right tabular-nums ${FY_COLS[i] === CURRENT_FY ? "bg-amber-50 text-amber-950 font-semibold" : "text-slate-700"}`}>{fmt(v)}</td>
              ))}
              <td className="px-3 py-2 text-right font-bold text-slate-800 tabular-nums">{fmt(catTotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: "#1a3557" }}>
            <td className="px-3 py-2 text-white font-bold text-[11px]">Total</td>
            {yearTotals.map((v, i) => (
              <td key={i} className={`px-3 py-2 text-right font-bold tabular-nums ${FY_COLS[i] === CURRENT_FY ? "bg-amber-200 text-amber-950" : "text-white"}`}>{fmt(v)}</td>
            ))}
            <td className="px-3 py-2 text-right text-white font-bold tabular-nums">{fmt(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function typeChipClass(type: CRLineItem["type"]) {
  if (type === "Labor")  return "bg-blue-50 text-blue-700 border-blue-200";
  if (type === "Travel") return "bg-violet-50 text-violet-700 border-violet-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function StatusBadge({ status }: { status: ChangeRequest["status"] }) {
  const map: Record<string, string> = {
    "Pending Approval":  "bg-blue-100 text-blue-800 border-blue-200",
    "Approved":          "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Complete - Partial":"bg-amber-100 text-amber-800 border-amber-200",
    "Complete":          "bg-teal-100 text-teal-800 border-teal-200",
    "Archived":          "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status]}`}>
      {status}
    </span>
  );
}

function DescNotesCell({ initialDesc }: { initialDesc: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(initialDesc).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <textarea
        value={initialDesc}
        readOnly
        rows={2}
        className="w-full text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 resize-none focus:outline-none leading-relaxed cursor-text select-all"
        style={{ minWidth: 200 }}
      />
      <button
        onClick={copy}
        title="Copy formatted description to clipboard"
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

/* ── OH / Flex-4 helpers (ERDC labs only) ────────────────────── */
const ERDC_OH_RATES: Record<string, number> = {
  U435000: 0.28, U435310: 0.28, U438000: 0.28, U430000: 0.25, U431000: 0.27,
  U432000: 0.26, U433000: 0.26, U434000: 0.27, U436000: 0.25,
  U437000: 0.26, U439000: 0.29,
};
const isErdcOrg = (orgCode: string) => orgCode.startsWith("U");
const isErdcLabResource = (resource: string) =>
  !resource.toLowerCase().includes("usace") && !resource.toLowerCase().includes("district");

const flex4Amount    = (r: number) => Math.round(r * 0.03);
const flex4Remaining = (r: number) => r - flex4Amount(r);
const labBase        = (rem: number, rate: number) => Math.round(rem / (1 + rate));
const ohAmount       = (rem: number, rate: number) => Math.round(labBase(rem, rate) * rate);
const frb            = (rem: number, rate: number) => rem - labBase(rem, rate) - ohAmount(rem, rate);

function LaborFlex4Panel({ requested, orgCode, isTravel }: { requested: number; orgCode: string; isTravel?: boolean }) {
  const ohRate = ERDC_OH_RATES[orgCode] ?? 0.28;
  const f4  = flex4Amount(requested);
  const rem = flex4Remaining(requested);
  const lb  = labBase(rem, ohRate);
  const oh  = ohAmount(rem, ohRate);
  const frbVal = frb(rem, ohRate);
  return (
    <div className="px-4 py-2.5 border-b border-slate-100 bg-blue-50">
      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1.5">OH Rate / Flex-4 Breakdown</p>
      <div className="grid gap-y-1 text-xs" style={{ gridTemplateColumns: "1fr auto" }}>
        <span className="text-blue-700">OH Rate</span>
        <CopyValue value={`${(ohRate * 100).toFixed(0)}%`} className="text-right font-mono font-bold text-blue-800 inline-flex items-center justify-end gap-1 cursor-pointer">{(ohRate * 100).toFixed(0)}%</CopyValue>
        <span className="text-blue-700">Flex-4 (3% off top)</span>
        <CopyValue value={fmt(f4)} className="text-right font-mono font-semibold text-blue-800 inline-flex items-center justify-end gap-1 cursor-pointer">{fmt(f4)}</CopyValue>
        <span className="text-slate-500">Remaining (97%)</span>
        <CopyValue value={fmt(rem)} className="text-right font-mono text-slate-600 inline-flex items-center justify-end gap-1 cursor-pointer">{fmt(rem)}</CopyValue>
        <span className="pl-4 text-blue-700">Lab Base</span>
        <CopyValue value={fmt(lb)} className="text-right font-mono font-semibold text-blue-800 inline-flex items-center justify-end gap-1 cursor-pointer">{fmt(lb)}</CopyValue>
        <span className="pl-4 text-blue-700">OH ({(ohRate * 100).toFixed(0)}%)</span>
        <CopyValue value={fmt(oh)} className="text-right font-mono font-semibold text-blue-800 inline-flex items-center justify-end gap-1 cursor-pointer">{fmt(oh)}</CopyValue>
        {!isTravel && frbVal !== 0 && <>
          <span className="pl-4 text-slate-400">FRB (rounding)</span>
          <CopyValue value={fmt(frbVal)} className="text-right font-mono text-slate-400 inline-flex items-center justify-end gap-1 cursor-pointer">{fmt(frbVal)}</CopyValue>
        </>}
      </div>
    </div>
  );
}

const TYPE_ORDER: CRLineItem["type"][] = ["Labor", "Travel", "Contracting", "Materials"];

const TYPE_DOT: Record<string, string> = {
  Labor: "#60a5fa", Travel: "#a78bfa", Contracting: "#34d399", Materials: "#f59e0b",
};

const detailLabelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1";
const detailFieldCls = "w-full border border-slate-200 rounded px-2.5 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300";

const roFieldCls = "w-full border border-slate-100 rounded px-2.5 py-1.5 text-sm text-slate-700 bg-slate-50 resize-none select-text cursor-text focus:outline-none";

const roValueCls = "w-full px-2.5 py-1.5 text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded cursor-pointer hover:bg-slate-100 transition-colors leading-snug flex items-center justify-between gap-2";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className={detailLabelCls}>{label}</label>
      <CopyValue value={value} className={roValueCls}>
        <span className="flex-1 min-w-0">{value || <span className="text-slate-300 italic">—</span>}</span>
      </CopyValue>
    </div>
  );
}

function TravelDetailPanel({ d }: { d: CRTravelDetails }) {
  return (
    <div className="border-b border-slate-100 bg-slate-50">
      <div className="px-6 pt-3 pb-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Travel Details</span>
      </div>
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <FinancialPocTooltip name={d.poc ?? ""} contact={d.pocContact}>
            <DetailField label="POC" value={d.poc ?? ""} />
          </FinancialPocTooltip>
          <DetailField label="Travelers" value={d.travelers ?? ""} />
          <DetailField label="Dates of Travel" value={d.dates ?? ""} />
        </div>
        <DetailField label="Purpose of Travel" value={d.purpose ?? ""} />
      </div>
    </div>
  );
}

function ResourceDetailPanel({ d, label = "Resource Details" }: { d: CRResourceDetails; label?: string }) {
  return (
    <div className="border-b border-slate-100 bg-slate-50">
      <div className="px-6 pt-3 pb-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <DetailField label="Period of Performance (POP)" value={d.pop ?? ""} />
          <FinancialPocTooltip name={d.poc ?? ""} contact={d.pocContact}>
            <DetailField label="POC" value={d.poc ?? ""} />
          </FinancialPocTooltip>
        </div>
        <DetailField label="Purpose" value={d.purpose ?? ""} />
      </div>
    </div>
  );
}

/* ── Budget Context Card ─────────────────────────────────────── */
function BudgetContextCard({ cr, project }: {
  cr: ChangeRequest;
  project: { budget: number; planningBudget?: number; actualObligation: number; funding?: ProjectFunding };
}) {
  const FY_LABEL = CURRENT_FY;
  const currentFYIndex = FY_COLS.indexOf(CURRENT_FY as typeof FY_COLS[number]);
  const currentFYWeight = FY_WEIGHTS[currentFYIndex] ?? 0;

  // Mirror exactly what ProjectFundingTable does so the total matches the header card
  const total      = project.planningBudget ?? project.budget;
  const laborTotal = Math.round(total * 0.72);
  const travelTot  = Math.round(total * 0.04);
  const otherTot   = Math.round(total * 0.08);
  const fyBudget   = project.funding ? fundingTotal(project.funding, CURRENT_FY, "plan") : [laborTotal, travelTot, otherTot]
    .reduce((s, cat) => s + Math.round(cat * currentFYWeight), 0);

  // Total funds requested = sum of all "to" values (what each line item will cost)
  const thisRequest = project.funding ? netChange(cr) : cr.lineItems.reduce((s, li) => s + li.to, 0);

  // Quarters are a proportional informational breakdown of the FY budget
  const qWeights = [0.20, 0.25, 0.30, 0.25];
  const quarters = project.funding
    ? ["Q1", "Q2", "Q3", "Q4"].map(q => Object.values(project.funding!.quarterly[CURRENT_FY] ?? {}).reduce((sum, amounts) => sum + (amounts[q as keyof typeof amounts] ?? 0), 0))
    : qWeights.map(w => Math.round(fyBudget * w));
  quarters[3] += fyBudget - quarters.reduce((a, b) => a + b, 0); // fix rounding

  // Q4 scenario: derive obligated so Available = thisRequest → New Available = $0
  const obligated = project.funding
    ? fundingTotal(project.funding, CURRENT_FY, "obligated") + fundingTotal(project.funding, CURRENT_FY, "committed")
    : Math.max(0, fyBudget - thisRequest);
  const available = project.funding ? fyBudget - obligated : thisRequest;
  const newAvailable = project.funding ? available - thisRequest : 0;

  const NAVY = "#1a3557";
  const rowCls = "flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0";
  const labelCls = "text-sm text-slate-600";
  const valueCls = "text-sm font-semibold tabular-nums text-slate-800";

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-2.5 flex items-center justify-between" style={{ backgroundColor: NAVY }}>
        <span className="text-white font-bold text-xs tracking-widest uppercase">Budget Context — {FY_LABEL}</span>
        <span className="text-blue-300 text-xs font-medium">Current fiscal year</span>
      </div>

      <div className="p-5 flex flex-col gap-4">

        {/* FY budget + quarterly breakdown — single horizontal strip */}
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project Budget This FY</p>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{fmt(fyBudget)}</div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {["Q1","Q2","Q3","Q4"].map((q, i) => (
              <div key={q} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-center min-w-[100px]">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{q}</div>
                <div className="text-sm font-bold tabular-nums text-slate-800">{fmt(quarters[i])}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 1: current position */}
        <div className="rounded-lg border border-slate-200 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Position</p>
          <div className={rowCls}>
            <span className={labelCls}>Project Budget ({FY_LABEL})</span>
            <span className={valueCls}>{fmt(fyBudget)}</span>
          </div>
          <div className={rowCls}>
            <span className={labelCls}>Obligated &amp; Committed</span>
            <span className="text-sm font-semibold tabular-nums text-slate-600">− {fmt(obligated)}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5">
            <span className="text-sm font-semibold text-slate-700">Available to Commit</span>
            <span className={`text-sm font-bold tabular-nums ${available >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {fmt(available)}
            </span>
          </div>
        </div>

        {/* Section 2: impact of this request */}
        <div className="rounded-lg border-2 border-primary/20 px-4 py-3" style={{ backgroundColor: "#f8faff" }}>
          <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-2">Impact of This Request</p>
          <div className={rowCls}>
            <span className={labelCls}>Available to Commit</span>
            <span className={valueCls}>{fmt(available)}</span>
          </div>
          <div className={rowCls}>
            <span className={labelCls}>Requested Amount</span>
            <span className="text-sm font-bold tabular-nums px-2 py-0.5 rounded" style={{ backgroundColor: "#fef08a", color: "#713f12" }}>
              {thisRequest > 0 ? "−" : "+"} {fmt(Math.abs(thisRequest))}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5">
            <span className="text-sm font-semibold text-slate-700">New Available to Commit</span>
            <span className={`text-sm font-bold tabular-nums ${newAvailable >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {fmt(newAvailable)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestLineItemsTable({ cr, disabled }: { cr: ChangeRequest; disabled: boolean }) {
  const firstReq = isFirstRequest(cr);
  const net = netChange(cr);

  // Editable labor codes: key = `${orgCode}||${resource}`
  const [laborCodes, setLaborCodes] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const li of cr.lineItems) {
      if (li.type === "Labor") {
        const key = `${li.orgCode}||${li.resource}`;
        init[key] = li.laborCode ?? "";
      }
    }
    return init;
  });
  const setCode = (key: string, val: string) =>
    setLaborCodes(prev => ({ ...prev, [key]: val }));

  // Group by orgCode first, then type within each org
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
        <span className="text-white font-bold text-xs tracking-widest uppercase">Request&apos;s Line Items</span>
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
            <OrgCodeHeader orgCode={orgCode} />

            {usedTypes.map((type) => {
              const typeItems = typeMap[type]!;
              const dot = TYPE_DOT[type] ?? "#94a3b8";

              return (
                <div key={type}>
                  {/* Type sub-header with column labels */}
                  <div className="px-4 py-1.5 flex items-center gap-2 border-b border-slate-100" style={{ backgroundColor: "#f1f5f9" }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex-1">{type}</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase" style={{ width: 140, textAlign: "right" }}>Funds Requested</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase pl-4" style={{ width: 260 }}>Description</span>
                    {type === "Labor"
                      ? <span className="text-xs font-semibold text-slate-400 uppercase pl-4" style={{ width: 130 }}>Labor Code</span>
                      : <span className="flex-shrink-0" style={{ width: 130 + 16 }} />
                    }
                  </div>

                  {/* Data rows */}
                  {typeItems.map((li, i) => {
                    const delta = firstReq ? li.to : (li.direction === "Increase" ? li.amount : -li.amount);
                    const isTravel   = li.type === "Travel";
                    const isResource = li.type === "Materials" || li.type === "Contracting";
                    const lcKey = `${li.orgCode}||${li.resource}`;
                    const laborCode = laborCodes[lcKey]?.trim() ?? "";
                    return (
                      <div key={i}>
                        <div
                          className="px-4 py-2.5 flex items-start gap-2 border-b border-slate-100"
                          style={{ backgroundColor: i % 2 === 1 ? "#edf2f8" : "#ffffff" }}
                        >
                          {/* Resource name + org code; charge codes are separate identifiers. */}
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <CopyValue value={li.resource} className="inline-flex items-center gap-1 max-w-full">
                              <span className="text-sm font-semibold text-slate-800 leading-snug truncate hover:text-blue-700 transition-colors" title={li.resource}>{li.resource}</span>
                            </CopyValue>
                            <CopyValue value={li.orgCode} className="inline-flex items-center gap-1">
                              <span className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Org Code: {li.orgCode}</span>
                            </CopyValue>
                          </div>

                          {/* Funds Requested: delta prominent, final amount below */}
                          <div style={{ width: 140, paddingTop: 2 }} className="flex flex-col items-end gap-0.5 flex-shrink-0">
                            <CopyValue
                              value={`${delta > 0 ? "+" : ""}${fmt(delta)}`}
                              className="tabular-nums text-sm font-bold inline-flex items-center justify-end gap-1"
                              style={{ color: delta > 0 ? "#15803d" : delta < 0 ? "#b91c1c" : "#94a3b8" }}
                            >
                              {delta > 0 ? "+" : delta < 0 ? "−" : ""}{fmt(Math.abs(delta))}
                            </CopyValue>
                            <CopyValue value={fmt(li.to)} className="tabular-nums text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center justify-end gap-1">
                              {fmt(li.to)}
                            </CopyValue>
                          </div>

                          {/* Description */}
                          <div style={{ width: 260 }} className="pl-4">
                            <DescNotesCell initialDesc={buildLineDesc(cr, li)} />
                          </div>

                          {/* Labor Code column — editable for Labor, empty spacer for other types */}
                          {type === "Labor" ? (
                            <div style={{ width: 130 }} className="pl-4 flex-shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <input
                                    type="text"
                                    value={laborCode ? laborCodes[lcKey] : ""}
                                    onChange={e => setCode(lcKey, e.target.value)}
                                    placeholder="N/A"
                                    aria-label={`Labor charge code for ${li.resource}`}
                                    className="w-full text-xs font-mono border border-slate-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60 text-slate-700 placeholder:text-slate-500"
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  {laborCode ? "This is a labor charge code (LLC)." : "No LLC found."}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <div className="flex-shrink-0" style={{ width: 130 + 16 }} />
                          )}
                        </div>
                        {isTravel && li.travelDetails && <TravelDetailPanel d={li.travelDetails} />}
                        {isTravel && isErdcOrg(li.orgCode) && isErdcLabResource(li.resource) && li.to > 0 && (
                          <LaborFlex4Panel requested={li.to} orgCode={li.orgCode} isTravel />
                        )}
                        {isResource && li.resourceDetails && (
                          <ResourceDetailPanel
                            d={li.resourceDetails}
                            label={li.type === "Contracting" ? "Contracting Details" : "Materials Details"}
                          />
                        )}
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
      <div className="px-4 py-2.5 flex items-center bg-slate-50 border-t-2 border-slate-200 gap-2">
        <span className="flex-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Net Change</span>
        <span
          className="tabular-nums text-sm font-bold"
          style={{ width: 140, textAlign: "right", color: net > 0 ? "#15803d" : net < 0 ? "#b91c1c" : "#475569" }}
        >
          {net === 0 ? "$0" : (net > 0 ? "+" : "") + fmt(net)}
        </span>
        <span style={{ width: 260 + 16 }} />
      </div>
    </div>
  );
}

function CRAccessRestricted() {
  return (
    <Layout breadcrumb={<>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300" />
      <span className="font-semibold text-slate-800">Funds Requests</span>
    </>}>
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Lock size={24} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-xs">
          Funds Requests are only accessible to Budget Analysts, Program Team, and Admins. Switch your role in the top nav to view this page.
        </p>
        <Link href="/" className="mt-6 text-sm text-primary hover:underline font-medium">Return to Home</Link>
      </div>
    </Layout>
  );
}

export default function ChangeRequestDetail({ params }: { params?: { id?: string } }) {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [actionReason, setActionReason] = useState("");
  const [reasonError, setReasonError] = useState(false);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const { changeRequests } = useChangeRequests();

  if (user.role === "Project Lead" || user.role === "Proponent") {
    return <CRAccessRestricted />;
  }

  const cr = changeRequests.find(x => x.id === params?.id);

  if (!cr) {
    return (
      <Layout breadcrumb={<>
        <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <Link href="/change-requests" className="text-slate-400 hover:text-slate-700 transition-colors">Funds Requests</Link>
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

  const isActionable = cr.status === "Pending Approval";
  const project = MOCK_PROJECTS.find(p => p.number === cr.projectNumber);
  const proponent = project?.hqProponent ?? "—";
  const toa = project?.budget ?? 0;
  const planned = project?.actualObligation ?? 0;
  const freeBalance = toa - planned;

  const handleAction = (action: "Approve" | "Reject") => {
    if (action === "Reject" && !actionReason.trim()) {
      setReasonError(true);
      reasonRef.current?.focus();
      return;
    }
    setReasonError(false);
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

  const reqNum = formatRequestNumber(cr, changeRequests);

  return (
    <Layout breadcrumb={<>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300" />
      <Link href="/change-requests" className="text-slate-400 hover:text-slate-700 transition-colors">Funds Requests</Link>
      <ChevronRight size={14} className="text-slate-300" />
      <span className="font-semibold text-slate-800">{reqNum} : {cr.projectNumber}</span>
    </>}>
      <div className="max-w-6xl mx-auto space-y-6 pb-28">

        {/* Back link + header */}
        <div>
          <Link
            href="/change-requests"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft size={15} /> Back to Funds Requests
          </Link>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen size={14} className="text-primary/70" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Funds Request</span>
                  <span className="font-mono text-sm font-bold text-primary ml-1">{reqNum}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 leading-snug flex items-baseline gap-2 flex-wrap">
                  <span className="font-mono">{cr.projectNumber}</span>
                  <span>{cr.projectName}</span>
                </h1>
              </div>
              <div className="shrink-0">
                <StatusBadge status={cr.status} />
              </div>
            </div>
            <dl className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ["Proponent", proponent],
                ["Submitter", cr.submittedBy],
                ["Date Submitted", cr.date],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 px-4 py-3 min-w-0">
                  <dt className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800 break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Request line items */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <RequestLineItemsTable cr={cr} disabled={!isActionable} />
        </div>

        {/* Request notes */}
        {isActionable && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes</h2>
            <div>
              <label htmlFor="decision-reason" className="block text-sm font-medium text-slate-600 mb-1.5">
                Note <span className="text-slate-400 font-normal">(required to reject — will appear in notification)</span>
              </label>
              <textarea
                id="decision-reason"
                ref={reasonRef}
                aria-invalid={reasonError}
                aria-describedby={reasonError ? "decision-reason-error" : undefined}
                rows={3}
                value={actionReason}
                onChange={(e) => {
                  setActionReason(e.target.value);
                  if (e.target.value.trim()) setReasonError(false);
                }}
                placeholder="Add a note to this request…"
                className={`w-full text-sm text-slate-700 border ${reasonError ? "border-red-500" : "border-slate-200"} rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white`}
              />
              {reasonError && (
                <p id="decision-reason-error" role="alert" className="mt-1 text-sm text-red-600">
                  Enter a note explaining why this request is being rejected.
                </p>
              )}
            </div>
            <p className="text-xs text-slate-400">Use the action bar at the bottom of the screen to approve or reject.</p>
          </div>
        )}

        {/* Supplemental context follows the information needed for a decision. */}
        {project && (
          <>
            <div className="flex items-center gap-4 pt-2" role="separator" aria-label="Supporting context">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Supporting Context</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <BudgetContextCard cr={cr} project={project} />
            <section aria-labelledby="project-funding-title" className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h2 id="project-funding-title" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Full Project Funding Breakdown
              </h2>
              <ProjectFundingTable project={project} />
            </section>
          </>
        )}
      </div>

      {/* Sticky action bar — always visible at the bottom when actionable */}
      {isActionable && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 truncate">
                Reviewing: <span className="font-semibold text-slate-600">{cr.projectNumber} — {cr.projectName}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
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
        </div>
      )}
      <Toaster />
    </Layout>
  );
}
