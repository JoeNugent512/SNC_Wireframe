import { useState } from "react";

/* ── types ─────────────────────────────────────────── */
type Resource = {
  id: string;
  name: string;
  uic: string;
  type: "employee" | "contractor";
  committed: number;
  obligated: number;
  planned: number;
};

type NonLabor = {
  category: string;
  bucket: number;
  amount: number;
  justification: string;
};

/* ── seed data ──────────────────────────────────────── */
const APPROVED_BUDGET = 2_400_000;
const TOTAL_OBLIGATED = 947_234;

const SEED_RESOURCES: Resource[] = [
  { id: "r1", name: "John Smith",    uic: "U435000", type: "employee",   committed: 277_680, obligated: 156_240, planned: 0 },
  { id: "r2", name: "Chen, David",   uic: "U438000", type: "employee",   committed: 209_520, obligated: 133_320, planned: 0 },
  { id: "r3", name: "Williams, Sandra K.", uic: "U438000", type: "employee", committed: 176_400, obligated: 81_600, planned: 0 },
  { id: "r4", name: "Contractor (TBD)", uic: "",     type: "contractor", committed: 223_200, obligated: 104_760, planned: 0 },
];

const SEED_NONLABOR: NonLabor[] = [
  { category: "Travel",              bucket: 28_000, amount: 0, justification: "" },
  { category: "Contracts",           bucket: 85_000, amount: 0, justification: "" },
  { category: "Outsourcing & Other", bucket: 15_500, amount: 0, justification: "" },
];

const LABOR_BUCKET = 128_500;

/* ── helpers ────────────────────────────────────────── */
const fmt = (n: number) => "$" + Math.round(n).toLocaleString();
let nextId = 10;

/* ── sub-components ─────────────────────────────────── */
function ResourceRow({
  r,
  onChange,
  onRemove,
  isExtra,
}: {
  r: Resource;
  onChange: (id: string, planned: number) => void;
  onRemove: (id: string) => void;
  isExtra: boolean;
}) {
  const [raw, setRaw] = useState(r.planned > 0 ? String(r.planned) : "");
  const diff = r.planned - r.committed;

  return (
    <tr className="border-t border-slate-100">
      <td className="py-2 px-3 text-sm">
        <div className="font-medium text-slate-800">{r.name}</div>
        {r.uic && <div className="text-[10px] text-slate-400">{r.uic}</div>}
      </td>
      <td className="py-2 px-3 text-right text-sm text-slate-600 tabular-nums">{fmt(r.committed)}</td>
      <td className="py-2 px-3 text-right text-sm text-blue-700 tabular-nums">{fmt(r.obligated)}</td>
      <td className="py-2 px-3 w-32">
        <input
          type="text"
          className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-300"
          placeholder="0"
          value={raw}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, "");
            setRaw(v);
            onChange(r.id, parseInt(v, 10) || 0);
          }}
        />
      </td>
      <td className="py-2 px-3 text-right text-sm tabular-nums">
        {r.planned > 0 ? (
          <span
            className="font-semibold"
            style={{ color: diff > 0 ? "#166534" : diff < 0 ? "#dc2626" : "#64748b" }}
          >
            {diff > 0 ? "+" : ""}{fmt(diff)}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      {isExtra && (
        <td className="py-2 px-2">
          <button
            className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
            onClick={() => onRemove(r.id)}
            title="Remove"
          >
            ×
          </button>
        </td>
      )}
      {!isExtra && <td className="py-2 px-2" />}
    </tr>
  );
}

function NonLaborRow({
  item,
  onChange,
}: {
  item: NonLabor;
  onChange: (cat: string, updates: Partial<NonLabor>) => void;
}) {
  const filled = item.amount > 0;
  const over   = item.amount > item.bucket;
  const remaining = item.bucket - item.amount;

  return (
    <div
      className="rounded-lg border p-4 flex flex-col gap-3"
      style={{ borderColor: over ? "#fca5a5" : filled ? "#86efac" : "#e2e8f0" }}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-800 text-sm">{item.category}</span>
        <span className="text-xs text-slate-500">
          Bucket: <strong className="text-slate-700">{fmt(item.bucket)}</strong>
        </span>
      </div>

      {/* progress bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min((item.amount / item.bucket) * 100, 100)}%`,
            backgroundColor: over ? "#dc2626" : "#f59e0b",
          }}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
            Planned Amount
          </label>
          <input
            type="text"
            className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            placeholder="$0"
            value={item.amount > 0 ? String(item.amount) : ""}
            onChange={(e) => {
              const v = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
              onChange(item.category, { amount: v });
            }}
          />
          {over && (
            <p className="text-[11px] text-red-500 mt-1">
              Exceeds bucket by {fmt(item.amount - item.bucket)}
            </p>
          )}
          {!over && filled && (
            <p className="text-[11px] text-slate-400 mt-1">
              {remaining > 0 ? fmt(remaining) + " unallocated" : "Fully allocated"}
            </p>
          )}
        </div>
        <div className="flex-[2]">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
            Justification
          </label>
          <input
            type="text"
            className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            placeholder="Brief description of planned spend…"
            value={item.justification}
            onChange={(e) => onChange(item.category, { justification: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

/* ── main component ─────────────────────────────────── */
export function QuarterlyPlanSubmit() {
  const [resources, setResources] = useState<Resource[]>(SEED_RESOURCES);
  const [nonLabor,  setNonLabor]  = useState<NonLabor[]>(SEED_NONLABOR);
  const [newName,   setNewName]   = useState("");
  const [addingNew, setAddingNew] = useState(false);

  const laborAllocated   = resources.reduce((s, r) => s + r.planned, 0);
  const laborRemaining   = LABOR_BUCKET - laborAllocated;
  const laborOver        = laborAllocated > LABOR_BUCKET;
  const laborDone        = laborAllocated === LABOR_BUCKET;

  const nonLaborDone     = nonLabor.every((n) => n.amount > 0 && n.amount <= n.bucket && n.justification.trim() !== "");
  const nonLaborTotal    = nonLabor.reduce((s, n) => s + n.amount, 0);

  const totalPlanned     = laborAllocated + nonLaborTotal;
  const grandTotal       = TOTAL_OBLIGATED + totalPlanned;
  const overBudget       = grandTotal > APPROVED_BUDGET;
  const canSubmit        = laborDone && nonLaborDone && !overBudget && !laborOver;

  const handleResourceChange = (id: string, planned: number) => {
    setResources((p) => p.map((r) => (r.id === id ? { ...r, planned } : r)));
  };

  const handleRemoveResource = (id: string) => {
    setResources((p) => p.filter((r) => r.id !== id));
  };

  const handleAddResource = () => {
    if (!newName.trim()) return;
    setResources((p) => [
      ...p,
      { id: String(nextId++), name: newName.trim(), uic: "", type: "employee", committed: 0, obligated: 0, planned: 0 },
    ]);
    setNewName("");
    setAddingNew(false);
  };

  const handleNonLaborChange = (cat: string, updates: Partial<NonLabor>) => {
    setNonLabor((p) => p.map((n) => (n.category === cat ? { ...n, ...updates } : n)));
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* header */}
      <div className="bg-[#1a3557] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-300 uppercase tracking-wide">Highway 45 Expansion</div>
          <div className="text-lg font-semibold">Q3 Plan Submission — FY26</div>
          <div className="text-xs text-slate-300 mt-0.5">Apr – Jun 2026  ·  All buckets must be allocated before submitting</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Approved Budget</div>
          <div className="text-xl font-bold">{fmt(APPROVED_BUDGET)}</div>
          <div className="text-xs mt-0.5" style={{ color: overBudget ? "#fca5a5" : "#86efac" }}>
            {overBudget ? `Over by ${fmt(grandTotal - APPROVED_BUDGET)}` : `${fmt(APPROVED_BUDGET - grandTotal)} remaining`}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-5 flex flex-col gap-5">

        {/* ── LABOR SECTION ── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800">Labor</span>
              <span className="ml-2 text-xs text-slate-500">Assign Q3 planned hours to resources</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="tabular-nums text-slate-600">
                Allocated:{" "}
                <strong style={{ color: laborOver ? "#dc2626" : laborDone ? "#166534" : "#92400e" }}>
                  {fmt(laborAllocated)}
                </strong>
                {" / "}{fmt(LABOR_BUCKET)}
              </span>
              {/* mini progress */}
              <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((laborAllocated / LABOR_BUCKET) * 100, 100)}%`,
                    backgroundColor: laborOver ? "#dc2626" : laborDone ? "#16a34a" : "#f59e0b",
                  }}
                />
              </div>
              {laborDone && !laborOver && (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">Complete</span>
              )}
              {laborOver && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">Over by {fmt(laborAllocated - LABOR_BUCKET)}</span>
              )}
              {!laborDone && !laborOver && laborRemaining > 0 && (
                <span className="text-xs text-amber-600">{fmt(laborRemaining)} unallocated</span>
              )}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                <th className="py-2.5 px-3 text-left">Resource</th>
                <th className="py-2.5 px-3 text-right">Committed</th>
                <th className="py-2.5 px-3 text-right">Obligated</th>
                <th className="py-2.5 px-3 text-right w-32">Planned (Q3)</th>
                <th className="py-2.5 px-3 text-right">Change</th>
                <th className="py-2.5 px-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {resources.map((r, i) => (
                <ResourceRow
                  key={r.id}
                  r={r}
                  onChange={handleResourceChange}
                  onRemove={handleRemoveResource}
                  isExtra={i >= SEED_RESOURCES.length}
                />
              ))}

              {/* add new row */}
              {addingNew ? (
                <tr className="border-t border-slate-100 bg-amber-50">
                  <td className="py-2 px-3" colSpan={4}>
                    <input
                      autoFocus
                      type="text"
                      className="w-full border border-amber-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="Resource name…"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddResource();
                        if (e.key === "Escape") { setAddingNew(false); setNewName(""); }
                      }}
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="text-xs bg-[#1a3557] text-white px-3 py-1 rounded font-semibold hover:opacity-90"
                        onClick={handleAddResource}
                      >
                        Add
                      </button>
                      <button
                        className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
                        onClick={() => { setAddingNew(false); setNewName(""); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                  <td />
                </tr>
              ) : (
                <tr className="border-t border-slate-100">
                  <td colSpan={6} className="py-2 px-3">
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#1a6ea8] hover:text-[#1a3557] transition-colors"
                      onClick={() => setAddingNew(true)}
                    >
                      <span className="text-base leading-none">+</span> Add labor resource
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="py-2.5 px-3 text-xs font-semibold text-slate-500">TOTAL</td>
                <td className="py-2.5 px-3 text-right text-sm font-semibold text-slate-700 tabular-nums">
                  {fmt(resources.reduce((s, r) => s + r.committed, 0))}
                </td>
                <td className="py-2.5 px-3 text-right text-sm font-semibold text-blue-700 tabular-nums">
                  {fmt(resources.reduce((s, r) => s + r.obligated, 0))}
                </td>
                <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums"
                    style={{ color: laborOver ? "#dc2626" : laborDone ? "#166534" : "#92400e" }}>
                  {fmt(laborAllocated)}
                </td>
                <td className="py-2.5 px-3" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── NON-LABOR SECTIONS ── */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Non-Labor Categories
          </div>
          {nonLabor.map((item) => (
            <NonLaborRow key={item.category} item={item} onChange={handleNonLaborChange} />
          ))}
        </div>

        {/* ── SUBMIT FOOTER ── */}
        <div
          className="rounded-xl border p-4 flex items-center justify-between"
          style={{
            backgroundColor: canSubmit ? "#f0fdf4" : "#f8fafc",
            borderColor: canSubmit ? "#86efac" : "#e2e8f0",
          }}
        >
          <div className="text-sm">
            {canSubmit ? (
              <span className="font-semibold text-green-700">All buckets allocated — ready to submit</span>
            ) : (
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-slate-700">Complete all sections to submit</span>
                <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                  {!laborDone && !laborOver && (
                    <span className="text-amber-600">Labor: {fmt(laborRemaining)} unallocated</span>
                  )}
                  {laborOver && (
                    <span className="text-red-600">Labor: over by {fmt(laborAllocated - LABOR_BUCKET)}</span>
                  )}
                  {nonLabor.filter((n) => n.amount === 0 || n.justification.trim() === "").map((n) => (
                    <span key={n.category} className="text-amber-600">{n.category}: incomplete</span>
                  ))}
                  {overBudget && (
                    <span className="text-red-600">Total exceeds approved budget</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            disabled={!canSubmit}
            className="rounded px-6 py-2.5 text-sm font-semibold transition-all"
            style={{
              backgroundColor: canSubmit ? "#1a3557" : "#e2e8f0",
              color: canSubmit ? "white" : "#94a3b8",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            Submit Q3 Plan
          </button>
        </div>

      </div>
    </div>
  );
}
