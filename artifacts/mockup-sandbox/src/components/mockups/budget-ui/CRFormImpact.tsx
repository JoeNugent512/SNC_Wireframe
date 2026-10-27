import { useState } from "react";

const APPROVED = 2_400_000;
const OBLIGATED = 947_234;
const Q3_CURRENT = 128_500;
const Q4_CURRENT = 0;
const EXISTING_PLANNED = OBLIGATED + Q3_CURRENT + Q4_CURRENT;

const CATEGORIES = ["Labor", "Travel", "Contracts", "Outsourcing & Other"] as const;
const REQUEST_TYPES = ["Transfer In", "Transfer Out", "New Authority", "Reduction"] as const;
const QUARTERS = ["Q3 (Apr–Jun)", "Q4 (Jul–Sep)"] as const;

function fmt(n: number) {
  return "$" + Math.abs(n).toLocaleString();
}

export function CRFormImpact() {
  const [amount, setAmount]   = useState("50000");
  const [cat, setCat]         = useState<string>(CATEGORIES[0]);
  const [type, setType]       = useState<string>(REQUEST_TYPES[0]);
  const [quarter, setQuarter] = useState<string>(QUARTERS[0]);

  const parsed   = parseInt(amount.replace(/[^0-9]/g, ""), 10) || 0;
  const isAddNew = type === "New Authority";
  const delta    = isAddNew ? parsed : type === "Transfer In" ? parsed : -parsed;
  const afterVal = EXISTING_PLANNED + delta;
  const remaining = APPROVED - EXISTING_PLANNED;
  const afterRemaining = APPROVED - afterVal;
  const overrun  = afterVal > APPROVED;
  const approaching = !overrun && afterVal / APPROVED >= 0.9;

  const statusColor = overrun ? "#dc2626" : approaching ? "#d97706" : "#166534";
  const statusBg    = overrun ? "#fee2e2" : approaching ? "#fef3c7" : "#dcfce7";
  const statusIcon  = overrun ? "!" : approaching ? "~" : "✓";

  const inputClass =
    "w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300";

  return (
    <div className="bg-white p-6 font-sans" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Layer 3 — Change Request Form (live budget impact)
      </div>

      <div className="flex gap-6">
        {/* form */}
        <div className="flex-1 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
            <select className={inputClass} value={cat} onChange={e => setCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Request Type</label>
            <select className={inputClass} value={type} onChange={e => setType(e.target.value)}>
              {REQUEST_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Quarter</label>
            <select className={inputClass} value={quarter} onChange={e => setQuarter(e.target.value)}>
              {QUARTERS.map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Amount</label>
            <input
              className={inputClass}
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Justification</label>
            <textarea
              className={inputClass + " resize-none"}
              rows={2}
              placeholder="Describe the reason for this change..."
            />
          </div>
        </div>

        {/* budget impact panel */}
        <div className="w-64 flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Budget Impact
          </div>

          <div className="rounded-lg border border-slate-200 overflow-hidden text-sm">
            <div className="bg-slate-50 px-4 py-2.5 flex justify-between text-xs">
              <span className="text-slate-500">Approved Budget</span>
              <span className="font-semibold text-slate-800">{fmt(APPROVED)}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between text-xs border-t border-slate-100">
              <span className="text-slate-500">Obligated to date</span>
              <span className="font-medium text-slate-700">{fmt(OBLIGATED)}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between text-xs border-t border-slate-100">
              <span className="text-slate-500">Q3+Q4 Planned</span>
              <span className="font-medium text-slate-700">{fmt(Q3_CURRENT + Q4_CURRENT)}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between text-xs border-t border-slate-200 bg-slate-50">
              <span className="font-semibold text-slate-700">Remaining now</span>
              <span className="font-bold text-slate-800">{fmt(remaining)}</span>
            </div>
            <div
              className="px-4 py-2.5 flex justify-between text-xs border-t-2"
              style={{ borderColor: statusColor + "55", backgroundColor: statusBg }}
            >
              <span className="font-semibold" style={{ color: statusColor }}>
                {statusIcon} This request adds
              </span>
              <span className="font-bold" style={{ color: statusColor }}>
                {delta >= 0 ? "+" : "−"}{fmt(delta)}
              </span>
            </div>
            <div
              className="px-4 py-2.5 flex justify-between text-xs border-t"
              style={{ borderTopColor: statusColor + "55" }}
            >
              <span className="font-semibold text-slate-700">Remaining after</span>
              <span className="font-bold" style={{ color: statusColor }}>
                {afterRemaining < 0 ? "−" : ""}{fmt(afterRemaining)}
              </span>
            </div>
          </div>

          {/* status message */}
          <div
            className="rounded px-3 py-2 text-xs font-medium"
            style={{ backgroundColor: statusBg, color: statusColor }}
          >
            {overrun
              ? `This request would exceed the approved budget by ${fmt(Math.abs(afterRemaining))}. Reduce the amount or adjust a quarterly plan.`
              : approaching
              ? `Caution: only ${fmt(afterRemaining)} remains after approval.`
              : `${fmt(afterRemaining)} will remain in approved budget after approval.`}
          </div>

          {/* submit */}
          <button
            disabled={overrun}
            className="w-full rounded px-4 py-2.5 text-sm font-semibold transition-all"
            style={{
              backgroundColor: overrun ? "#e2e8f0" : "#1a3557",
              color: overrun ? "#94a3b8" : "white",
              cursor: overrun ? "not-allowed" : "pointer",
              opacity: overrun ? 0.7 : 1,
            }}
          >
            {overrun ? "Reduce amount to submit" : "Submit Change Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
