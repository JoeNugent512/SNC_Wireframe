function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
      style={{ backgroundColor: color + "22", color }}
    >
      {label}
    </span>
  );
}

function StateCard({
  state,
  used,
  limit,
  pct,
}: {
  state: "ok" | "warning" | "over";
  used: number;
  limit: number;
  pct: number;
}) {
  const fmt = (n: number) => "$" + n.toLocaleString();

  const configs = {
    ok: {
      label: "Normal",
      barColor: "#1a6ea8",
      btnBg: "#1a6ea8",
      btnText: "white",
      btnLabel: "Request Change",
      btnDisabled: false,
      tooltip: "",
      statusColor: "#166534",
      statusBg: "#dcfce7",
      statusText: `Budget remaining: ${fmt(limit - used)}`,
    },
    warning: {
      label: "Approaching Limit (≥90%)",
      barColor: "#f59e0b",
      btnBg: "#1a6ea8",
      btnText: "white",
      btnLabel: "Request Change",
      btnDisabled: false,
      tooltip: "",
      statusColor: "#92400e",
      statusBg: "#fef3c7",
      statusText: `Caution: only ${fmt(limit - used)} remaining in approved budget`,
    },
    over: {
      label: "Over Budget",
      barColor: "#dc2626",
      btnBg: "#e2e8f0",
      btnText: "#94a3b8",
      btnLabel: "Request Change",
      btnDisabled: true,
      tooltip: "Planned amounts exceed approved budget. Reduce a quarterly plan before requesting a change.",
      statusColor: "#991b1b",
      statusBg: "#fee2e2",
      statusText: `Over budget by ${fmt(used - limit)} — reduce a planned amount first`,
    },
  };

  const c = configs[state];

  return (
    <div
      className="flex-1 rounded-lg border p-4 flex flex-col gap-3"
      style={{ borderColor: state === "over" ? "#fca5a5" : state === "warning" ? "#fcd34d" : "#e2e8f0" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.label}</span>
        <Badge
          label={state === "ok" ? "OK" : state === "warning" ? "WARN" : "BLOCKED"}
          color={state === "ok" ? "#166534" : state === "warning" ? "#92400e" : "#991b1b"}
        />
      </div>

      {/* mini bar */}
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: c.barColor }}
        />
      </div>
      <div className="text-[11px] text-slate-500 -mt-1">
        {fmt(used)} / {fmt(limit)} ({pct}%)
      </div>

      {/* status banner */}
      <div
        className="text-xs rounded px-3 py-2 font-medium"
        style={{ backgroundColor: c.statusBg, color: c.statusColor }}
      >
        {c.statusText}
      </div>

      {/* button */}
      <div className="relative group">
        <button
          disabled={c.btnDisabled}
          className="w-full rounded px-4 py-2 text-sm font-semibold transition-opacity"
          style={{
            backgroundColor: c.btnBg,
            color: c.btnText,
            cursor: c.btnDisabled ? "not-allowed" : "pointer",
            opacity: c.btnDisabled ? 0.5 : 1,
          }}
        >
          {c.btnLabel}
        </button>
        {c.btnDisabled && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded bg-slate-800 text-white text-[11px] px-3 py-2 text-center shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {c.tooltip}
          </div>
        )}
      </div>
    </div>
  );
}

export function RequestBtnStates() {
  return (
    <div className="bg-white p-6 font-sans" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Layer 2 — "Request Change" button states
      </div>
      <div className="flex gap-4">
        <StateCard state="ok"      used={1_075_734} limit={2_400_000} pct={45} />
        <StateCard state="warning" used={2_195_000} limit={2_400_000} pct={91} />
        <StateCard state="over"    used={2_480_000} limit={2_400_000} pct={103} />
      </div>
    </div>
  );
}
