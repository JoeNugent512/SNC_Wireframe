export function BudgetHealthBar() {
  const APPROVED = 2_400_000;
  const obligated = 947_234;
  const q3Planned = 128_500;
  const q4Planned = 0;
  const remaining = APPROVED - obligated - q3Planned - q4Planned;
  const pctObligated = (obligated / APPROVED) * 100;
  const pctQ3 = (q3Planned / APPROVED) * 100;
  const pctQ4 = (q4Planned / APPROVED) * 100;
  const pctRemaining = (remaining / APPROVED) * 100;

  const fmt = (n: number) =>
    "$" + Math.round(n / 1000).toLocaleString() + "k";

  return (
    <div className="bg-white font-sans p-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        FY26 Budget Utilization
      </div>

      {/* stacked bar */}
      <div className="flex h-8 w-full rounded overflow-hidden border border-slate-200 mb-3">
        <div
          className="flex items-center justify-center text-white text-[11px] font-semibold"
          style={{ width: `${pctObligated}%`, backgroundColor: "#1a3557" }}
          title={`Obligated: ${fmt(obligated)}`}
        >
          {pctObligated > 8 ? fmt(obligated) : ""}
        </div>
        <div
          className="flex items-center justify-center text-[11px] font-semibold"
          style={{ width: `${pctQ3}%`, backgroundColor: "#f59e0b", color: "#78350f" }}
          title={`Q3 Planned: ${fmt(q3Planned)}`}
        >
          {pctQ3 > 5 ? fmt(q3Planned) : ""}
        </div>
        {pctQ4 > 0 && (
          <div
            className="flex items-center justify-center text-[11px] font-semibold"
            style={{ width: `${pctQ4}%`, backgroundColor: "#fcd34d", color: "#78350f" }}
            title={`Q4 Planned: ${fmt(q4Planned)}`}
          >
            {pctQ4 > 5 ? fmt(q4Planned) : ""}
          </div>
        )}
        <div
          className="flex items-center justify-center text-[11px] font-semibold"
          style={{ width: `${pctRemaining}%`, backgroundColor: "#dcfce7", color: "#166534" }}
        >
          {pctRemaining > 8 ? fmt(remaining) + " left" : ""}
        </div>
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#1a3557" }} />
          <span className="text-slate-600">Obligated <strong className="text-slate-800">{fmt(obligated)}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#f59e0b" }} />
          <span className="text-slate-600">Q3 Planned <strong className="text-slate-800">{fmt(q3Planned)}</strong></span>
        </div>
        {q4Planned > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#fcd34d" }} />
            <span className="text-slate-600">Q4 Planned <strong className="text-slate-800">{fmt(q4Planned)}</strong></span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block border border-slate-300" style={{ backgroundColor: "#dcfce7" }} />
          <span className="text-slate-600">Remaining <strong className="text-green-700">{fmt(remaining)}</strong></span>
        </div>
        <div className="ml-auto text-slate-500">
          Approved Budget: <strong className="text-slate-800">{fmt(APPROVED)}</strong>
        </div>
      </div>
    </div>
  );
}
