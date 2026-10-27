import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ChevronRight, Lock, ArrowRight, CheckCircle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_PROJECTS, Project, ChangeRequest, CRLineItem } from "@/lib/mockData";
import { useUser } from "@/lib/userContext";
import { useChangeRequests } from "@/lib/changeRequestsContext";
import { CURRENT_FY, CURRENT_FY_NUMBER, CURRENT_QUARTER, getFiscalPeriod } from "@/lib/fiscalYear";
import { fundingCurrency } from "@/lib/projectFunding";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmt = fundingCurrency;

type RequestType = "Increase" | "Decrease" | "Transfer";
type ResourceCategory = "Labor" | "Travel" | "Contracts" | "Outsourcing & Other";

interface AllocationRow {
  id: number;
  resource: string;
  orgCode: string;
  currentPlan: number;
  requestedChange: number;
  rowDirection: "increase" | "decrease";
  notes: string;
  laborCode?: string;
}

const CATEGORY_TO_CR_TYPE: Record<ResourceCategory, CRLineItem["type"]> = {
  "Labor": "Labor",
  "Travel": "Travel",
  "Contracts": "Contracting",
  "Outsourcing & Other": "Contracting",
};

function getStubRows(project: Project, category: ResourceCategory): AllocationRow[] {
  if (project.funding) {
    if (category !== "Labor") return [];
    return project.funding.resources.map((resource, i) => ({
      id: i + 1, resource: resource.name, orgCode: resource.orgCode, laborCode: resource.laborCode,
      currentPlan: 0, requestedChange: 0, rowDirection: "increase", notes: "",
    }));
  }
  const base = Math.round(project.budget * 0.042);
  const mkRow = (id: number, resource: string, orgCode: string, multiplier: number): AllocationRow => ({
    id,
    resource,
    orgCode,
    currentPlan: Math.round(base * multiplier),
    requestedChange: 0,
    rowDirection: "increase",
    notes: "",
  });

  if (category === "Labor") {
    return [
      mkRow(1, "Nugent, Joseph Pat", "U435000", 3.0),
      mkRow(2, "Chen, David", "U435000", 2.3),
      mkRow(3, "Williams, Sandra K.", "U438000", 1.8),
      mkRow(4, "Contractor Pool", "U435000", 4.1),
    ];
  }
  if (category === "Travel") {
    return [
      mkRow(1, "CERL", "U435000", 0.8),
      mkRow(2, "CHL", "U430000", 0.5),
      mkRow(3, "Field Site Visits", "U438000", 0.4),
    ];
  }
  if (category === "Contracts") {
    return [
      mkRow(1, "Software Maintenance", "U400000", 2.1),
      mkRow(2, "Private Sector (OTHCONSVC)", "U435000", 3.5),
    ];
  }
  return [
    mkRow(1, "Corps District (MIPR)", "U400000", 1.6),
    mkRow(2, "OrderTrak (SHOP/FACIL)", "U435000", 0.85),
  ];
}

function parseDollar(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

/* ── Bucket Balance panel ──────────────────────────────────── */
interface BucketBalanceProps {
  requestType: RequestType;
  bucketAmount: number;
  allocated: number;
  totalIn: number;
  totalOut: number;
}
function BucketBalance({ requestType, bucketAmount, allocated, totalIn, totalOut }: BucketBalanceProps) {
  if (requestType === "Transfer") {
    const net = totalIn - totalOut;
    const balanced = net === 0 && totalIn > 0;
    const netCls = balanced
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : net !== 0
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-slate-500 bg-slate-50 border-slate-200";

    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Transfer Balance</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 mb-1">Total In (+)</div>
            <div className="text-lg font-bold text-emerald-800 tabular-nums">{totalIn > 0 ? fmt(totalIn) : "—"}</div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-red-600 mb-1">Total Out (−)</div>
            <div className="text-lg font-bold text-red-800 tabular-nums">{totalOut > 0 ? fmt(totalOut) : "—"}</div>
          </div>
          <div className={`rounded-lg border px-3 py-3 text-center ${netCls}`}>
            <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1">Net (must = $0)</div>
            <div className="text-lg font-bold tabular-nums">
              {balanced
                ? <CheckCircle size={20} className="mx-auto text-emerald-600" />
                : net === 0
                ? "—"
                : (net > 0 ? "+" : "") + fmt(net)}
            </div>
          </div>
        </div>
        {!balanced && (totalIn > 0 || totalOut > 0) && (
          <p className="text-xs text-slate-500 mt-3 text-center">
            {net > 0
              ? `In exceeds Out by ${fmt(net)}. Increase decrease rows or reduce increase rows.`
              : net < 0
              ? `Out exceeds In by ${fmt(Math.abs(net))}. Increase increase rows or reduce decrease rows.`
              : "Enter amounts on the rows below to begin."}
          </p>
        )}
      </div>
    );
  }

  const remaining = bucketAmount - allocated;
  const balanced = remaining === 0;
  const over = remaining < 0;
  const remainingCls = balanced
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : over
    ? "text-red-700 bg-red-50 border-red-200"
    : "text-amber-700 bg-amber-50 border-amber-200";

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Bucket Balance</h4>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Bucket Amount</div>
          <div className="text-lg font-bold text-slate-800 tabular-nums">{bucketAmount > 0 ? fmt(bucketAmount) : "—"}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Allocated</div>
          <div className="text-lg font-bold text-slate-800 tabular-nums">{allocated > 0 ? fmt(allocated) : "—"}</div>
        </div>
        <div className={`rounded-lg border px-3 py-3 text-center ${remainingCls}`}>
          <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1">
            {remaining === 0 ? "Balanced" : over ? "Over" : "Remaining"}
          </div>
          <div className="text-lg font-bold tabular-nums">
            {balanced ? <CheckCircle size={20} className="mx-auto text-emerald-600" /> : fmt(Math.abs(remaining))}
          </div>
        </div>
      </div>
      {!balanced && bucketAmount > 0 && (
        <p className="text-xs text-slate-500 mt-3 text-center">
          {over
            ? `Allocated exceeds the bucket by ${fmt(Math.abs(remaining))}. Reduce one or more rows.`
            : `Allocate ${fmt(remaining)} more across resource rows to submit.`}
        </p>
      )}
    </div>
  );
}

export default function ProjectRequest() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useUser();
  const { addChangeRequest } = useChangeRequests();
  const { toast } = useToast();

  const project = MOCK_PROJECTS.find((p) => p.id === params.id);

  const [fy, setFy] = useState<string>(CURRENT_FY);
  const [quarter, setQuarter] = useState<string>(`Q${CURRENT_QUARTER}`);
  const [requestType, setRequestType] = useState<RequestType>("Increase");
  const [category, setCategory] = useState<ResourceCategory>("Labor");
  const [bucketAmountRaw, setBucketAmountRaw] = useState("");
  const [headerLocked, setHeaderLocked] = useState(false);
  const [rows, setRows] = useState<AllocationRow[]>([]);
  const [justification, setJustification] = useState("");

  const bucketAmount = parseDollar(bucketAmountRaw);
  const isTransfer = requestType === "Transfer";

  const allocated = rows.reduce((s, r) => s + r.requestedChange, 0);
  const totalIn = rows.filter((r) => r.rowDirection === "increase").reduce((s, r) => s + r.requestedChange, 0);
  const totalOut = rows.filter((r) => r.rowDirection === "decrease").reduce((s, r) => s + r.requestedChange, 0);
  const remaining = bucketAmount - allocated;

  const transferBalanced = isTransfer && totalIn > 0 && totalIn === totalOut;
  const bucketBalanced = !isTransfer && remaining === 0;
  const canSubmit = headerLocked && justification.trim().length > 0
    && (isTransfer ? transferBalanced : bucketBalanced && bucketAmount > 0);

  useEffect(() => {
    if (!project) return;
    setRows(getStubRows(project, category));
  }, [category, project?.id]);

  if (!project) {
    return (
      <Layout>
        <div className="py-24 text-center text-slate-500">Project not found.</div>
      </Layout>
    );
  }

  const handleContinue = () => {
    if (!isTransfer && bucketAmount === 0) return;
    setHeaderLocked(true);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    const lineItems: CRLineItem[] = isTransfer
      ? rows
          .filter((r) => r.requestedChange > 0)
          .map((r) => ({
            direction: (r.rowDirection === "increase" ? "Increase" : "Decrease") as CRLineItem["direction"],
            type: CATEGORY_TO_CR_TYPE[category],
            orgCode: r.orgCode,
            resource: r.resource,
            laborCode: r.laborCode,
            amount: r.requestedChange,
            from: r.currentPlan,
            to: r.rowDirection === "increase"
              ? r.currentPlan + r.requestedChange
              : r.currentPlan - r.requestedChange,
          }))
      : rows
          .filter((r) => r.requestedChange > 0)
          .map((r) => ({
            direction: requestType as "Increase" | "Decrease",
            type: CATEGORY_TO_CR_TYPE[category],
            orgCode: r.orgCode,
            resource: r.resource,
            laborCode: r.laborCode,
            amount: r.requestedChange,
            from: r.currentPlan,
            to: requestType === "Increase"
              ? r.currentPlan + r.requestedChange
              : r.currentPlan - r.requestedChange,
          }));

    const cr: ChangeRequest = {
      id: `cr-${Date.now()}`,
      projectNumber: project.number,
      projectName: project.name,
      projectDescription: project.description,
      submittedBy: user.name,
      date: getFiscalPeriod().today.toISOString().slice(0, 10),
      justification,
      status: "Pending Approval",
      lineItems,
      requestFY: fy,
      requestQuarter: quarter,
      resourceCategory: category,
      requestType,
    };

    addChangeRequest(cr);
    toast({
      title: "Request submitted",
      description: `Change request for ${project.name} has been submitted for review.`,
    });
    navigate("/change-requests");
  };

  const updateRow = (id: number, field: keyof AllocationRow, value: number | string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const fyOptions = Array.from({ length: 4 }, (_, i) => `FY${CURRENT_FY_NUMBER + i}`);
  const qOptions = ["Q1", "Q2", "Q3", "Q4"].filter((_, i) =>
    fy !== CURRENT_FY || i + 1 >= CURRENT_QUARTER);

  return (
    <Layout
      breadcrumb={
        <>
          <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
          <ChevronRight size={14} className="text-slate-300" />
          <Link href="/projects" className="text-slate-400 hover:text-slate-700 transition-colors">Projects</Link>
          <ChevronRight size={14} className="text-slate-300" />
          <Link href={`/projects/${project.id}/planning`} className="text-slate-400 hover:text-slate-700 transition-colors truncate max-w-[140px]">{project.name}</Link>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="font-semibold text-slate-800">Request Change</span>
        </>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">

        <div>
          <p className="text-xs font-mono text-slate-400 mb-0.5">{project.number}</p>
          <h2 className="text-2xl font-bold text-slate-900">Budget Change Request</h2>
          <p className="text-sm text-slate-500 mt-1">
            Complete the request header, allocate the change across resource lines, and submit for review.
          </p>
        </div>

        {/* Step 1 — Request Header */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div
            className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between"
            style={{ backgroundColor: "#1a3557" }}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
              <span className="text-white font-semibold text-sm">Request Header</span>
            </div>
            {headerLocked && (
              <div className="flex items-center gap-1.5 text-white/70 text-xs">
                <Lock size={12} />
                <span>Locked</span>
              </div>
            )}
          </div>

          {!headerLocked ? (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">Project Info</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Project Number</label>
                    <div className="mt-1 text-sm font-mono font-semibold text-slate-800">{project.number}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Project Name</label>
                    <div className="mt-1 text-sm font-semibold text-slate-800">{project.name}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Submitted By</label>
                    <div className="mt-1 text-sm text-slate-700">{user.name}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">Request Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Fiscal Year</label>
                    <Select value={fy} onValueChange={value => {
                      setFy(value);
                      if (value === CURRENT_FY && Number(quarter.slice(1)) < CURRENT_QUARTER) {
                        setQuarter(`Q${CURRENT_QUARTER}`);
                      }
                    }}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {fyOptions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Quarter</label>
                    <Select value={quarter} onValueChange={setQuarter}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {qOptions.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Request Type</label>
                  <Select value={requestType} onValueChange={(v) => setRequestType(v as RequestType)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Increase">Increase</SelectItem>
                      <SelectItem value="Decrease">Decrease</SelectItem>
                      <SelectItem value="Transfer">Transfer (within category)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Resource Category</label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ResourceCategory)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Labor">Labor</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Contracts">Contracts</SelectItem>
                      <SelectItem value="Outsourcing & Other">Outsourcing &amp; Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!isTransfer && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Bucket Amount
                      <span className="text-slate-400 font-normal ml-1">— total $ to {requestType.toLowerCase()}</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <Input
                        className="pl-7 h-9 text-sm tabular-nums"
                        placeholder="0"
                        value={bucketAmountRaw}
                        onChange={(e) => setBucketAmountRaw(e.target.value.replace(/[^0-9]/g, ""))}
                      />
                    </div>
                  </div>
                )}
                {isTransfer && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-700">
                    For a Transfer, mark individual resource rows as (+) increase or (−) decrease. Increases must equal decreases before you can submit.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <span><span className="font-semibold text-slate-800">{project.number}</span> &mdash; {project.name}</span>
              <span className="text-slate-300">|</span>
              <span>{fy} {quarter}</span>
              <span className="text-slate-300">|</span>
              <span
                className={`font-semibold ${
                  requestType === "Increase" ? "text-emerald-700"
                  : requestType === "Decrease" ? "text-red-700"
                  : "text-blue-700"
                }`}
              >
                {requestType}
              </span>
              <span className="text-slate-300">|</span>
              <span>{category}</span>
              {!isTransfer && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="font-semibold tabular-nums text-slate-800">{fmt(bucketAmount)}</span>
                </>
              )}
              <button onClick={() => setHeaderLocked(false)} className="text-primary hover:underline text-xs ml-auto">
                Edit
              </button>
            </div>
          )}

          {!headerLocked && (
            <div className="px-5 pb-5 flex justify-end">
              <button
                onClick={handleContinue}
                disabled={!isTransfer && bucketAmount === 0}
                className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2 rounded-lg transition-opacity disabled:opacity-40"
                style={{ backgroundColor: "#1a3557" }}
              >
                Continue <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Step 2 — Allocation Table */}
        {headerLocked && (
          <>
            <BucketBalance
              requestType={requestType}
              bucketAmount={bucketAmount}
              allocated={allocated}
              totalIn={totalIn}
              totalOut={totalOut}
            />

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div
                className="px-5 py-3.5 border-b border-slate-200 flex items-center gap-2"
                style={{ backgroundColor: "#1a3557" }}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                <span className="text-white font-semibold text-sm">Allocation — {category}</span>
                <span className="text-white/50 text-xs ml-1">
                  {isTransfer
                    ? "Toggle (+/−) per row, then enter amounts. Increases must equal decreases."
                    : `Distribute ${fmt(bucketAmount)} across resource rows.`}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 640 }}>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {isTransfer && <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 w-16">Dir.</th>}
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Resource</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">Org Code</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Current Plan</th>
                      <th
                        className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: "#fffbeb", color: "#92400e" }}
                      >
                        Requested Change
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">New Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, i) => {
                      const isIncrease = isTransfer ? row.rowDirection === "increase" : requestType === "Increase";
                      const newPlan = isIncrease
                        ? row.currentPlan + row.requestedChange
                        : row.currentPlan - row.requestedChange;
                      const hasChange = row.requestedChange > 0;
                      return (
                        <tr key={row.id} style={{ backgroundColor: i % 2 === 1 ? "#f8fafc" : "#ffffff" }}>
                          {isTransfer && (
                            <td className="px-3 py-3 text-center">
                              <button
                                onClick={() =>
                                  updateRow(row.id, "rowDirection", row.rowDirection === "increase" ? "decrease" : "increase")
                                }
                                title={row.rowDirection === "increase" ? "Click to switch to decrease" : "Click to switch to increase"}
                                className="transition-colors"
                              >
                                {row.rowDirection === "increase"
                                  ? <ArrowUpCircle size={18} className="text-emerald-500 hover:text-emerald-700" />
                                  : <ArrowDownCircle size={18} className="text-red-500 hover:text-red-700" />}
                              </button>
                            </td>
                          )}
                          <td className="px-4 py-3 font-medium text-slate-800">{row.resource}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500 hidden sm:table-cell">{row.orgCode}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmt(row.currentPlan)}</td>
                          <td className="px-4 py-3 text-right" style={{ backgroundColor: "#fffbeb" }}>
                            <div className="flex items-center justify-end gap-1">
                              {!isTransfer && (
                                <span className="text-xs text-amber-600 font-semibold">
                                  {requestType === "Increase" ? "+" : "−"}
                                </span>
                              )}
                              {isTransfer && (
                                <span className={`text-xs font-semibold ${row.rowDirection === "increase" ? "text-emerald-600" : "text-red-600"}`}>
                                  {row.rowDirection === "increase" ? "+" : "−"}
                                </span>
                              )}
                              <input
                                type="text"
                                value={row.requestedChange === 0 ? "" : String(row.requestedChange)}
                                onChange={(e) => updateRow(row.id, "requestedChange", parseDollar(e.target.value))}
                                placeholder="0"
                                className="w-24 text-right text-sm tabular-nums border border-amber-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className={`font-medium ${
                              hasChange
                                ? isIncrease ? "text-emerald-700" : "text-red-700"
                                : "text-slate-500"
                            }`}>
                              {fmt(newPlan)}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <input
                              type="text"
                              value={row.notes}
                              onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                              placeholder="Optional"
                              className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300 text-slate-600"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 bg-slate-50">
                      {isTransfer && <td />}
                      <td className="px-4 py-3 text-xs font-bold uppercase text-slate-500 tracking-wide" colSpan={2}>Total</td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-700">
                        {fmt(rows.reduce((s, r) => s + r.currentPlan, 0))}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold" style={{ backgroundColor: "#fffbeb" }}>
                        {isTransfer ? (
                          <span className="text-slate-700">{totalIn > 0 || totalOut > 0 ? `+${fmt(totalIn)} / −${fmt(totalOut)}` : "—"}</span>
                        ) : (
                          <span style={{ color: remaining === 0 ? "#065f46" : remaining < 0 ? "#b91c1c" : "#92400e" }}>
                            {requestType === "Increase" ? "+" : "−"}{fmt(allocated)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-700">—</td>
                      <td className="hidden md:table-cell" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Step 3 — Review & Submit */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div
                className="px-5 py-3.5 border-b border-slate-200 flex items-center gap-2"
                style={{ backgroundColor: "#1a3557" }}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                <span className="text-white font-semibold text-sm">Review &amp; Submit</span>
              </div>
              <div className="p-5 space-y-5">
                {/* Summary */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Request Summary</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-slate-400">Project</div>
                      <div className="font-semibold text-slate-800 text-xs mt-0.5">{project.number}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Period</div>
                      <div className="font-semibold text-slate-800 text-xs mt-0.5">{fy} {quarter}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Category / Type</div>
                      <div className="font-semibold text-slate-800 text-xs mt-0.5">{category} &mdash; {requestType}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Net Change</div>
                      <div className={`font-bold text-sm tabular-nums mt-0.5 ${
                        requestType === "Increase" ? "text-emerald-700"
                        : requestType === "Decrease" ? "text-red-700"
                        : "text-slate-700"
                      }`}>
                        {isTransfer
                          ? `+${fmt(totalIn)} / −${fmt(totalOut)}`
                          : (requestType === "Increase" ? "+" : "−") + fmt(allocated)}
                      </div>
                    </div>
                  </div>
                  {rows.filter((r) => r.requestedChange > 0).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
                      {rows.filter((r) => r.requestedChange > 0).map((r) => {
                        const isInc = isTransfer ? r.rowDirection === "increase" : requestType === "Increase";
                        return (
                          <div key={r.id} className="flex items-center justify-between text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              {isTransfer && (
                                isInc
                                  ? <ArrowUpCircle size={12} className="text-emerald-500" />
                                  : <ArrowDownCircle size={12} className="text-red-500" />
                              )}
                              {r.resource}
                            </span>
                            <span className="tabular-nums font-medium">
                              {fmt(r.currentPlan)} &rarr;{" "}
                              <span className={isInc ? "text-emerald-700" : "text-red-700"}>
                                {fmt(isInc ? r.currentPlan + r.requestedChange : r.currentPlan - r.requestedChange)}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Justification */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                    Justification <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Describe the reason for this change request, including any relevant background, approvals, or dependencies..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="text-sm resize-none"
                  />
                </div>

                {/* Validation warnings */}
                {isTransfer && !transferBalanced && (totalIn > 0 || totalOut > 0) && (
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                    <span className="font-semibold flex-shrink-0">Not ready:</span>
                    <span>
                      {totalIn > totalOut
                        ? `Increase rows exceed decrease rows by ${fmt(totalIn - totalOut)}. Add more decreases or reduce increases.`
                        : totalOut > totalIn
                        ? `Decrease rows exceed increase rows by ${fmt(totalOut - totalIn)}. Add more increases or reduce decreases.`
                        : "Enter amounts on at least one increase and one decrease row."}
                    </span>
                  </div>
                )}
                {!isTransfer && remaining !== 0 && bucketAmount > 0 && (
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                    <span className="font-semibold flex-shrink-0">Not ready:</span>
                    <span>
                      {remaining > 0
                        ? `${fmt(remaining)} of the bucket has not been allocated. Distribute it across resource lines above.`
                        : `Allocation exceeds the bucket by ${fmt(Math.abs(remaining))}. Reduce one or more resource lines.`}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <Link
                    href={`/projects/${project.id}/planning`}
                    className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="flex items-center gap-2 text-sm font-semibold text-white px-6 py-2.5 rounded-lg transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: "#1a3557" }}
                  >
                    Submit Request <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
