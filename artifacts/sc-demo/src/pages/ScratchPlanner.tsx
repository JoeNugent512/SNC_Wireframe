import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronDown, ChevronRight, ArrowLeft, Plus, Trash2, LayoutList, Rows3, ChevronsRight, Check, X } from "lucide-react";
import Layout from "@/components/Layout";
import { CURRENT_FY_NUMBER, CURRENT_QUARTER } from "@/lib/fiscalYear";

/* ─── helpers ─────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

let _uid = 200;
const uid = () => ++_uid;

const FY_NUMS = [25, 26, 27, 28, 29] as const;
type FY = typeof FY_NUMS[number];

type QKey =
  | "fy25q1" | "fy25q2" | "fy25q3" | "fy25q4"
  | "fy26q1" | "fy26q2" | "fy26q3" | "fy26q4"
  | "fy27q1" | "fy27q2" | "fy27q3" | "fy27q4"
  | "fy28q1" | "fy28q2" | "fy28q3" | "fy28q4"
  | "fy29q1" | "fy29q2" | "fy29q3" | "fy29q4";

const ALL_QKEYS: QKey[] = [
  "fy25q1","fy25q2","fy25q3","fy25q4",
  "fy26q1","fy26q2","fy26q3","fy26q4",
  "fy27q1","fy27q2","fy27q3","fy27q4",
  "fy28q1","fy28q2","fy28q3","fy28q4",
  "fy29q1","fy29q2","fy29q3","fy29q4",
];

function fyKeys(fy: FY): QKey[] {
  return [`fy${fy}q1`, `fy${fy}q2`, `fy${fy}q3`, `fy${fy}q4`] as QKey[];
}

function fySum(row: ScratchRow, fy: FY): number {
  return fyKeys(fy).reduce((s, k) => s + row[k], 0);
}

function qSum(rows: ScratchRow[], q: QKey): number {
  return rows.reduce((s, r) => s + r[q], 0);
}

function fyTotal(rows: ScratchRow[], fy: FY): number {
  return rows.reduce((s, r) => s + fySum(r, fy), 0);
}

function blankRow(label: string, sub: string): ScratchRow {
  const zeros = Object.fromEntries(ALL_QKEYS.map((k) => [k, 0])) as Record<QKey, number>;
  return { id: uid(), label, sub, ...zeros };
}

function splitFY(annual: number): [number, number, number, number] {
  const base = Math.floor(annual / 4);
  const rem = annual - base * 4;
  return [base + rem, base, base, base];
}

/* ─── types ────────────────────────────────────────────────────── */
type ScratchRow = {
  id: number; label: string; sub: string;
  fy25q1: number; fy25q2: number; fy25q3: number; fy25q4: number;
  fy26q1: number; fy26q2: number; fy26q3: number; fy26q4: number;
  fy27q1: number; fy27q2: number; fy27q3: number; fy27q4: number;
  fy28q1: number; fy28q2: number; fy28q3: number; fy28q4: number;
  fy29q1: number; fy29q2: number; fy29q3: number; fy29q4: number;
};

type Category = "Labor" | "Travel" | "Contract" | "Outsourcing";
type ViewMode = "fy" | "quarter";
type FyQTargets = [number, number, number, number];
type QTargets = Record<Category, Record<FY, FyQTargets>>;

/* ─── colour tokens ─────────────────────────────────────────────── */
/* Gold  = editable */
const GOLD_BG   = "#fffbeb";
const GOLD_BG2  = "#fef3c7";   /* alternating rows */
const GOLD_BD   = "1px solid #fbbf24";
/* Blue  = non-editable / computed / past */
const BLUE_BG   = "#eff6ff";
const BLUE_BG2  = "#dbeafe";
const BLUE_BD   = "1px solid #93c5fd";

/* ─── fiscal calendar ────────────────────────────────────────────── */
const CURRENT_FY = CURRENT_FY_NUMBER;
const CURRENT_Q  = CURRENT_QUARTER;
const isPastQ  = (fy: number, q: number) =>
  fy < CURRENT_FY || (fy === CURRENT_FY && q < CURRENT_Q);
const isPastFY = (fy: number) => fy < CURRENT_FY;

/* ─── stub data ─────────────────────────────────────────────────── */
const STUB_LABOR: ScratchRow[] = [
  { id: 1, label: "Nugent, Joseph Pat", sub: "U435000/CERL",
    fy25q1: 10000, fy25q2: 12000, fy25q3: 13000, fy25q4: 10000,
    fy26q1: 12000, fy26q2: 12000, fy26q3: 11000, fy26q4: 10000,
    fy27q1: 11000, fy27q2: 11000, fy27q3: 11000, fy27q4: 11000,
    fy28q1: 10000, fy28q2: 10000, fy28q3: 10000, fy28q4: 10000,
    fy29q1:  8000, fy29q2:  8000, fy29q3:  8000, fy29q4:  8000 },
  { id: 2, label: "Chen, David", sub: "U435000/CERL",
    fy25q1: 8000, fy25q2: 8000, fy25q3: 8000, fy25q4: 8000,
    fy26q1: 9000, fy26q2: 9000, fy26q3: 9000, fy26q4: 8000,
    fy27q1: 9000, fy27q2: 9000, fy27q3: 9000, fy27q4: 9000,
    fy28q1: 8000, fy28q2: 8000, fy28q3: 8000, fy28q4: 8000,
    fy29q1: 7000, fy29q2: 7000, fy29q3: 7000, fy29q4: 7000 },
  { id: 3, label: "Williams, Sandra K.", sub: "U438000/GSL",
    fy25q1: 6000, fy25q2: 7000, fy25q3: 7500, fy25q4: 6500,
    fy26q1: 7000, fy26q2: 7000, fy26q3: 6000, fy26q4: 6000,
    fy27q1: 6000, fy27q2: 6000, fy27q3: 6000, fy27q4: 6000,
    fy28q1: 5000, fy28q2: 5000, fy28q3: 5000, fy28q4: 5000,
    fy29q1: 4000, fy29q2: 4000, fy29q3: 4000, fy29q4: 4000 },
];

const STUB_TRAVEL: ScratchRow[] = [
  { id: 4, label: "CERL", sub: "U435000",
    fy25q1: 3000, fy25q2: 3000, fy25q3: 4000, fy25q4: 3000,
    fy26q1: 4000, fy26q2: 4000, fy26q3: 3000, fy26q4: 3000,
    fy27q1: 3000, fy27q2: 3000, fy27q3: 3000, fy27q4: 3000,
    fy28q1: 2500, fy28q2: 2500, fy28q3: 2500, fy28q4: 2500,
    fy29q1: 2000, fy29q2: 2000, fy29q3: 2000, fy29q4: 2000 },
  { id: 5, label: "CHL", sub: "U430000",
    fy25q1: 1500, fy25q2: 1500, fy25q3: 2000, fy25q4: 1500,
    fy26q1: 2000, fy26q2: 2000, fy26q3: 1500, fy26q4: 1500,
    fy27q1: 1500, fy27q2: 1500, fy27q3: 1500, fy27q4: 1500,
    fy28q1: 1000, fy28q2: 1000, fy28q3: 1000, fy28q4: 1000,
    fy29q1: 1000, fy29q2: 1000, fy29q3: 1000, fy29q4: 1000 },
];

const STUB_CONTRACT: ScratchRow[] = [
  { id: 6, label: "Software maintenance or support", sub: "OTHER ERDC / U400000",
    fy25q1: 0, fy25q2: 15000, fy25q3: 20000, fy25q4: 20000,
    fy26q1: 18000, fy26q2: 18000, fy26q3: 17000, fy26q4: 17000,
    fy27q1: 16000, fy27q2: 16000, fy27q3: 16000, fy27q4: 16000,
    fy28q1: 15000, fy28q2: 15000, fy28q3: 15000, fy28q4: 15000,
    fy29q1: 12000, fy29q2: 12000, fy29q3: 12000, fy29q4: 12000 },
  { id: 7, label: "Private Sector contracts (OTHCONSVC)", sub: "CERL / U435000",
    fy25q1: 25000, fy25q2: 25000, fy25q3: 25000, fy25q4: 25000,
    fy26q1: 20000, fy26q2: 20000, fy26q3: 20000, fy26q4: 20000,
    fy27q1: 18000, fy27q2: 18000, fy27q3: 18000, fy27q4: 18000,
    fy28q1: 15000, fy28q2: 15000, fy28q3: 15000, fy28q4: 15000,
    fy29q1: 12000, fy29q2: 12000, fy29q3: 12000, fy29q4: 12000 },
];

const STUB_OUTSOURCING: ScratchRow[] = [
  { id: 8, label: "Corps District (MIPR)", sub: "OTHER ERDC / U400000",
    fy25q1: 10000, fy25q2: 10000, fy25q3: 10000, fy25q4: 10000,
    fy26q1: 8000, fy26q2: 8000, fy26q3: 8000, fy26q4: 8000,
    fy27q1: 7000, fy27q2: 7000, fy27q3: 7000, fy27q4: 7000,
    fy28q1: 6000, fy28q2: 6000, fy28q3: 6000, fy28q4: 6000,
    fy29q1: 5000, fy29q2: 5000, fy29q3: 5000, fy29q4: 5000 },
  { id: 9, label: "OrderTrak (SHOP/FACIL)", sub: "CERL / U435000",
    fy25q1: 5000, fy25q2: 5000, fy25q3: 5000, fy25q4: 5000,
    fy26q1: 4000, fy26q2: 4000, fy26q3: 4000, fy26q4: 4000,
    fy27q1: 3500, fy27q2: 3500, fy27q3: 3500, fy27q4: 3500,
    fy28q1: 3000, fy28q2: 3000, fy28q3: 3000, fy28q4: 3000,
    fy29q1: 2500, fy29q2: 2500, fy29q3: 2500, fy29q4: 2500 },
];

function computeInitialTargets(): Record<Category, Record<FY, number>> {
  const mk = (rows: ScratchRow[]) =>
    Object.fromEntries(FY_NUMS.map((fy) => [fy, fyTotal(rows, fy)])) as Record<FY, number>;
  return {
    Labor: mk(STUB_LABOR),
    Travel: mk(STUB_TRAVEL),
    Contract: mk(STUB_CONTRACT),
    Outsourcing: mk(STUB_OUTSOURCING),
  };
}

function computeInitialQTargets(annualTargets: Record<Category, Record<FY, number>>): QTargets {
  const cats: Category[] = ["Labor", "Travel", "Contract", "Outsourcing"];
  return Object.fromEntries(
    cats.map((cat) => [
      cat,
      Object.fromEntries(FY_NUMS.map((fy) => [fy, splitFY(annualTargets[cat][fy])])),
    ])
  ) as QTargets;
}

/* ─── FyCell — editable amber cell (top-down table) ────────────── */
function FyCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  if (editing) {
    return (
      <input autoFocus type="text" value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => { onChange(parseInt(raw) || 0); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange(parseInt(raw) || 0); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full text-right text-xs border border-amber-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-300 tabular-nums bg-white"
        style={{ minWidth: 72 }}
      />
    );
  }
  return (
    <button onClick={() => { setRaw(String(value)); setEditing(true); }}
      className="w-full text-right text-xs text-slate-800 tabular-nums hover:underline decoration-dotted underline-offset-2 focus:outline-none">
      {value === 0 ? "—" : fmt(value)}
    </button>
  );
}

/* ─── QCell — editable quarter cell ─────────────────────────────── */
function QCell({
  value, onChange, stopProp = false,
}: { value: number; onChange: (v: number) => void; stopProp?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  if (editing) {
    return (
      <input autoFocus type="text" value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => { onChange(parseInt(raw) || 0); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange(parseInt(raw) || 0); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
          if (stopProp) e.stopPropagation();
        }}
        onClick={(e) => stopProp && e.stopPropagation()}
        className="w-full text-right text-[11px] border border-amber-400 rounded px-0.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-300 tabular-nums bg-white"
        style={{ minWidth: 54 }}
      />
    );
  }
  return (
    <button
      onClick={(e) => { if (stopProp) e.stopPropagation(); setRaw(String(value)); setEditing(true); }}
      className="w-full text-right text-[11px] tabular-nums hover:underline decoration-dotted underline-offset-2 focus:outline-none text-slate-700">
      {value === 0 ? <span className="text-slate-300">—</span> : fmt(value)}
    </button>
  );
}

/* ─── DeltaBadge (navy category header) ─────────────────────────── */
function DeltaBadge({ resourceTotal, target }: { resourceTotal: number; target: number }) {
  const delta = resourceTotal - target;
  const over = delta > 0;
  const label = delta === 0 ? "On target" : `${over ? "+" : ""}${fmt(delta)}`;
  const cls = delta === 0 ? "bg-emerald-100 text-emerald-700"
    : over ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700";
  return <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

/* ─── AddRowForm ────────────────────────────────────────────────── */
function AddRowForm({ onAdd, onCancel, placeholder }: {
  onAdd: (label: string, sub: string) => void;
  onCancel: () => void;
  placeholder: string;
}) {
  const [label, setLabel] = useState("");
  const [sub, setSub] = useState("");
  const labelRef = useRef<HTMLInputElement>(null);
  useEffect(() => { labelRef.current?.focus(); }, []);
  const commit = () => { if (label.trim()) onAdd(label.trim(), sub.trim()); };
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-t border-blue-100">
      <input ref={labelRef} type="text" value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") onCancel(); }}
        placeholder={placeholder}
        className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <input type="text" value={sub}
        onChange={(e) => setSub(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") onCancel(); }}
        placeholder="Org / code (optional)"
        className="w-44 text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <button onClick={commit}
        className="text-xs font-semibold px-3 py-1.5 rounded bg-primary text-white hover:opacity-90 transition-opacity">
        Add
      </button>
      <button onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5">
        Cancel
      </button>
    </div>
  );
}

/* ─── Summary Table (top-down annual targets) ───────────────────── */
function SummaryTable({
  targets,
  setTargets,
}: {
  targets: Record<Category, Record<FY, number>>;
  setTargets: React.Dispatch<React.SetStateAction<Record<Category, Record<FY, number>>>>;
}) {
  const CATS: Category[] = ["Labor", "Travel", "Contract", "Outsourcing"];
  const setTarget = (cat: Category, fy: FY) => (v: number) =>
    setTargets((prev) => ({ ...prev, [cat]: { ...prev[cat], [fy]: v } }));
  const rowTotal = (cat: Category) => FY_NUMS.reduce((s, fy) => s + targets[cat][fy], 0);
  const colTotal = (fy: FY) => CATS.reduce((s, cat) => s + targets[cat][fy], 0);
  const grandTotal = CATS.reduce((s, cat) => s + rowTotal(cat), 0);
  const navyBg = { backgroundColor: "#1a3557" };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="px-5 py-3 flex items-center gap-3" style={navyBg}>
        <span className="text-white font-bold text-sm tracking-wide">Top-Down Budget Targets</span>
        <span className="text-blue-300 text-xs">Click any cell to edit</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: 120 }} />
            {FY_NUMS.map((fy) => <col key={fy} style={{ width: 110 }} />)}
            <col style={{ width: 110 }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">Category</th>
              {FY_NUMS.map((fy) => (
                <th key={fy} className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide"
                  style={isPastFY(fy)
                    ? { backgroundColor: BLUE_BG, color: "#1e40af", borderLeft: BLUE_BD }
                    : { backgroundColor: GOLD_BG, color: "#92400e", borderLeft: GOLD_BD }}>
                  FY{fy}
                </th>
              ))}
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide"
                style={{ backgroundColor: BLUE_BG, color: "#1e40af", borderLeft: BLUE_BD }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {CATS.map((cat, ci) => {
              const rt = rowTotal(cat);
              const rowBg = ci % 2 === 0 ? "#ffffff" : "#f8fafc";
              return (
                <tr key={cat} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td className="px-4 py-2.5 text-slate-700 font-semibold text-sm" style={{ backgroundColor: rowBg }}>{cat}</td>
                  {FY_NUMS.map((fy) => {
                    const past = isPastFY(fy);
                    return (
                      <td key={fy} className="px-3 py-2 text-right font-semibold text-slate-700 text-sm tabular-nums"
                        style={past
                          ? { backgroundColor: ci % 2 === 0 ? BLUE_BG : BLUE_BG2, borderLeft: BLUE_BD }
                          : { backgroundColor: ci % 2 === 0 ? GOLD_BG : GOLD_BG2, borderLeft: GOLD_BD }}>
                        {past ? fmt(targets[cat][fy]) : <FyCell value={targets[cat][fy]} onChange={setTarget(cat, fy)} />}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700 text-sm tabular-nums"
                    style={{ backgroundColor: ci % 2 === 0 ? BLUE_BG : BLUE_BG2, borderLeft: BLUE_BD }}>{fmt(rt)}</td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "2px solid #94a3b8" }}>
              <td className="px-4 py-2.5 text-xs text-slate-500 uppercase font-bold tracking-wide bg-slate-100">Total</td>
              {FY_NUMS.map((fy) => (
                <td key={fy} className="px-4 py-2.5 text-right font-bold text-slate-800 text-sm tabular-nums"
                  style={isPastFY(fy)
                    ? { backgroundColor: BLUE_BG2, borderLeft: BLUE_BD }
                    : { backgroundColor: GOLD_BG2, borderLeft: GOLD_BD }}>
                  {fmt(colTotal(fy))}
                </td>
              ))}
              <td className="px-4 py-2.5 text-right font-bold text-slate-800 text-sm tabular-nums"
                style={{ backgroundColor: BLUE_BG2, borderLeft: BLUE_BD }}>{fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── FY Section — single shared-colgroup table ─────────────────── */
/*
 * Column layout (7 cols, shared by the FY header row AND all resource rows):
 *   col 1  flex   — FY label / resource name
 *   col 2   96px  — Q1  (GOLD = editable)
 *   col 3   96px  — Q2  (GOLD = editable)
 *   col 4   96px  — Q3  (GOLD = editable)
 *   col 5   96px  — Q4  (GOLD = editable)
 *   col 6  120px  — Annual plan / FY total  (BLUE = non-editable)
 *   col 7   32px  — delete icon / empty
 */
function FySection({
  fy, rows, setRows, fyTarget, fyQTargets, setFyQTargets,
}: {
  fy: FY;
  rows: ScratchRow[];
  setRows: (rows: ScratchRow[]) => void;
  fyTarget: number;
  fyQTargets: FyQTargets;
  setFyQTargets: (qt: FyQTargets) => void;
}) {
  const [open, setOpen] = useState(false);
  const [fillingId, setFillingId] = useState<number | null>(null);
  const [fillVal, setFillVal] = useState("");
  const fillInputRef = useRef<HTMLInputElement>(null);
  const qs = ([1, 2, 3, 4] as const);
  const keys = qs.map((q) => `fy${fy}q${q}` as QKey);

  const updateCell = (id: number, key: QKey) => (v: number) =>
    setRows(rows.map((r) => r.id === id ? { ...r, [key]: v } : r));
  const deleteRow = (id: number) => setRows(rows.filter((r) => r.id !== id));

  const startFill = (row: ScratchRow) => {
    const editableKeys = keys.filter((_, ki) => !isPastQ(fy, qs[ki]));
    const avg = editableKeys.length
      ? Math.round(editableKeys.reduce((s, k) => s + row[k], 0) / editableKeys.length)
      : 0;
    setFillingId(row.id);
    setFillVal(String(avg));
    setTimeout(() => fillInputRef.current?.select(), 30);
  };

  const commitFill = (rowId: number) => {
    const v = Math.max(0, parseInt(fillVal.replace(/[^0-9]/g, ""), 10) || 0);
    const editableKeys = keys.filter((_, ki) => !isPastQ(fy, qs[ki]));
    setRows(rows.map((r) => {
      if (r.id !== rowId) return r;
      const patch: Partial<ScratchRow> = {};
      editableKeys.forEach((k) => { patch[k] = v; });
      return { ...r, ...patch };
    }));
    setFillingId(null);
  };

  const qTotals = keys.map((k) => qSum(rows, k));
  const resourceFyTotal = qTotals.reduce((s, v) => s + v, 0);

  const qTargetSum = fyQTargets.reduce((s, v) => s + v, 0);
  const planDelta = qTargetSum - fyTarget;
  const planOver = planDelta > 0;
  const planBalanced = planDelta === 0;

  const fyOverDelta = resourceFyTotal - fyTarget;
  const fyOver = fyOverDelta > 0;
  const fyOnPlan = fyOverDelta === 0;

  return (
    <div style={{ borderBottom: "1px solid #e2e8f0" }}>
      <table className="w-full" style={{ borderCollapse: "collapse", tableLayout: "fixed", minWidth: 680 }}>
        <colgroup>
          <col style={{ width: 160 }} />
          <col style={{ width: 96 }} />
          <col style={{ width: 96 }} />
          <col style={{ width: 96 }} />
          <col style={{ width: 96 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 32 }} />
        </colgroup>
        <tbody>
          {/* ── FY header row ── */}
          <tr className="hover:bg-amber-50 transition-colors" style={{ borderBottom: open ? "2px solid #e2e8f0" : "none" }}>
            {/* Toggle + FY label */}
            <td className="py-2.5 pl-4 pr-2">
              <button className="flex items-center gap-2 text-left" onClick={() => setOpen((o) => !o)}>
                <span className="text-slate-400 flex-shrink-0">
                  {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
                <span className="font-semibold text-slate-700 text-xs">FY{fy}</span>
              </button>
            </td>

            {/* Q1–Q4 targets — past=blue immutable, future=gold editable */}
            {qs.map((q, qi) => {
              const past = isPastQ(fy, q);
              const current = fy === CURRENT_FY && q === CURRENT_Q;
              return (
                <td key={q} className="py-2.5 px-2"
                  style={past
                    ? { backgroundColor: BLUE_BG, borderLeft: BLUE_BD }
                    : { backgroundColor: GOLD_BG, borderLeft: GOLD_BD, ...(current ? { boxShadow: "inset 0 0 0 2px #0f172a" } : {}) }}>
                  <div className={`text-[9px] font-medium text-right mb-0.5 ${past ? "text-blue-500" : current ? "text-slate-900" : "text-amber-600"}`}>
                    Q{q} {past ? "actual" : current ? "current" : "target"}
                  </div>
                  {past
                    ? <div className="text-right text-xs font-semibold text-slate-700 tabular-nums">{fmt(fyQTargets[qi])}</div>
                    : <QCell
                        value={fyQTargets[qi]}
                        onChange={(v) => {
                          const next: FyQTargets = [...fyQTargets] as FyQTargets;
                          next[qi] = v;
                          setFyQTargets(next);
                        }}
                        stopProp
                      />
                  }
                </td>
              );
            })}

            {/* Annual plan + balance status — past FYs are obligations, always "Obligated" */}
            <td className="py-2.5 px-3 text-right" style={{ backgroundColor: BLUE_BG, borderLeft: BLUE_BD }}>
              <div className="text-[9px] text-blue-500 font-medium mb-0.5">Annual plan</div>
              <div className="text-xs font-semibold text-slate-700 tabular-nums">{fmt(fyTarget)}</div>
              <div className="text-[9px] font-bold tabular-nums mt-0.5"
                style={{ color: isPastFY(fy) ? "#1e40af"
                  : planBalanced ? "#065f46" : planOver ? "#b91c1c" : "#b45309" }}>
                {isPastFY(fy) ? "Obligated"
                  : planBalanced ? "Balanced"
                  : `${planOver ? "+" : ""}${fmt(planDelta)} vs plan`}
              </div>
            </td>
            <td />
          </tr>

          {/* ── Expanded: column sub-header ── */}
          {open && (
            <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
              <td className="py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                style={{ paddingLeft: 40, paddingRight: 8 }}>Resource</td>
              {qs.map((q) => {
                const past = isPastQ(fy, q);
                return (
                  <td key={q} className="py-1.5 px-2 text-right text-[10px] font-semibold uppercase tracking-wide"
                    style={past
                      ? { backgroundColor: BLUE_BG, color: "#1e40af", borderLeft: BLUE_BD }
                      : { backgroundColor: GOLD_BG, color: "#92400e", borderLeft: GOLD_BD }}>
                    Q{q}
                  </td>
                );
              })}
              <td className="py-1.5 px-3 text-right text-[10px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: BLUE_BG, color: "#1e40af", borderLeft: BLUE_BD }}>FY Total</td>
              <td style={{ backgroundColor: "#f1f5f9" }} />
            </tr>
          )}

          {/* ── Expanded: resource rows ── */}
          {open && rows.map((row, ri) => {
            const rowBg = ri % 2 === 0 ? "#ffffff" : "#f8fafc";
            const rowFyTotal = keys.reduce((s, k) => s + row[k], 0);
            const editableKeys = keys.filter((_, ki) => !isPastQ(fy, qs[ki]));
            const isFilling = fillingId === row.id;
            return (
              <tr key={row.id} className="group" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td className="py-2 pr-2" style={{ backgroundColor: rowBg, paddingLeft: 40 }}>
                  {isFilling ? (
                    /* ── Inline spread-fill form ── */
                    <div className="flex items-center gap-1">
                      <ChevronsRight size={11} className="text-primary flex-shrink-0" />
                      <input
                        ref={fillInputRef}
                        autoFocus
                        type="text"
                        value={fillVal}
                        onChange={(e) => setFillVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); commitFill(row.id); }
                          if (e.key === "Escape") setFillingId(null);
                        }}
                        className="w-20 text-xs font-semibold border border-primary rounded px-1.5 py-0.5 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                        style={{ backgroundColor: "#eff6ff", color: "#1e3a5f" }}
                        placeholder="$/qtr"
                      />
                      <span className="text-[9px] text-slate-400 whitespace-nowrap">/ qtr</span>
                      <button onClick={() => commitFill(row.id)}
                        className="text-primary hover:text-blue-700 p-0.5 rounded flex-shrink-0">
                        <Check size={12} />
                      </button>
                      <button onClick={() => setFillingId(null)}
                        className="text-slate-300 hover:text-slate-500 p-0.5 rounded flex-shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-700 truncate">{row.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{row.sub}</div>
                      </div>
                      {editableKeys.length > 0 && (
                        <button
                          onClick={() => startFill(row)}
                          title="Spread fill editable quarters"
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1 p-0.5 rounded text-slate-300 hover:text-primary hover:bg-blue-50">
                          <ChevronsRight size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
                {keys.map((k, ki) => {
                  const past = isPastQ(fy, qs[ki]);
                  return (
                    <td key={k} className="px-2 py-2 text-right tabular-nums text-xs font-semibold"
                      style={past
                        ? { backgroundColor: ri % 2 === 0 ? BLUE_BG : BLUE_BG2, borderLeft: BLUE_BD, color: "#1e3a5f" }
                        : { backgroundColor: ri % 2 === 0 ? GOLD_BG : GOLD_BG2, borderLeft: GOLD_BD }}>
                      {past
                        ? fmt(row[k])
                        : <QCell value={row[k]} onChange={updateCell(row.id, k)} />}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right text-xs font-semibold tabular-nums text-slate-700"
                  style={{ backgroundColor: ri % 2 === 0 ? BLUE_BG : BLUE_BG2, borderLeft: BLUE_BD }}>
                  {fmt(rowFyTotal)}
                </td>
                <td className="py-2 pr-1 text-center" style={{ backgroundColor: rowBg }}>
                  {!isFilling && (
                    <button onClick={() => deleteRow(row.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 p-0.5 rounded">
                      <Trash2 size={12} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}

          {/* ── Expanded: resource totals / variance row ── */}
          {open && (
            <tr style={{ borderTop: "2px solid #cbd5e1", backgroundColor: "#f1f5f9" }}>
              <td className="py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide"
                style={{ paddingLeft: 40, paddingRight: 8 }}>Resource Total / Variance</td>
              {qs.map((q, qi) => {
                const total = qTotals[qi];
                const qTarget = fyQTargets[qi];
                const d = total - qTarget;
                const dOver = d > 0;
                const past = isPastQ(fy, q);
                return (
                  <td key={q} className="px-2 py-2 text-right tabular-nums"
                    style={{
                      borderLeft: past ? BLUE_BD : GOLD_BD,
                      backgroundColor: past ? BLUE_BG
                        : d === 0 ? "#ecfdf5" : dOver ? "#fef2f2" : "#ecfdf5",
                    }}>
                    <div className="font-semibold text-xs text-slate-700">{total === 0 ? "—" : fmt(total)}</div>
                    <div className="text-[10px] font-bold"
                      style={{ color: past ? "#1e40af"
                        : d === 0 ? "#065f46" : dOver ? "#991b1b" : "#065f46" }}>
                      {past ? "obligated"
                        : d === 0 ? "on target"
                        : `${dOver ? "+" : ""}${fmt(d)} vs Q${q}`}
                    </div>
                  </td>
                );
              })}
              <td className="px-3 py-2 text-right tabular-nums"
                style={{ backgroundColor: BLUE_BG2, borderLeft: BLUE_BD }}>
                <div className="font-bold text-xs text-slate-700">{fmt(resourceFyTotal)}</div>
                <div className="text-[10px] font-bold"
                  style={{ color: isPastFY(fy) ? "#1e40af"
                    : fyOnPlan ? "#065f46" : fyOver ? "#991b1b" : "#065f46" }}>
                  {isPastFY(fy) ? "obligated"
                    : fyOnPlan ? "on plan"
                    : `${fyOver ? "+" : ""}${fmt(fyOverDelta)} vs plan`}
                </div>
              </td>
              <td style={{ backgroundColor: "#f1f5f9" }} />
            </tr>
          )}

        </tbody>
      </table>
    </div>
  );
}

/* ─── Quarter View: one table per resource, FY-rows × Q-columns ─── */
const Q_RANGES = ["OCT–DEC", "JAN–MAR", "APR–JUN", "JUL–SEP"] as const;

function QuarterGrid({
  rows, setRows, fyQTargets,
}: {
  rows: ScratchRow[];
  setRows: (rows: ScratchRow[]) => void;
  fyQTargets: Record<FY, FyQTargets>;
}) {
  const updateCell = (id: number, key: QKey) => (v: number) =>
    setRows(rows.map((r) => r.id === id ? { ...r, [key]: v } : r));
  const deleteRow = (id: number) => setRows(rows.filter((r) => r.id !== id));
  const qs = [1, 2, 3, 4] as const;

  /* shared cell padding */
  const cp: React.CSSProperties = { paddingTop: 4, paddingBottom: 4, paddingLeft: 6, paddingRight: 6 };

  return (
    <div style={{ borderTop: "2px solid #1a6ea8", background: "linear-gradient(to bottom, #f0f4f8, #f8fafc)" }}>
      {/* sub-header bar */}
      <div style={{ background: "#1a3557", padding: "5px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Quarterly Breakdown
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: "#93c5fd", opacity: 0.7 }}>
          {rows.length} resource{rows.length !== 1 ? "s" : ""} · FY{CURRENT_FY} Q{CURRENT_Q} current
        </span>
      </div>

      {/* one table per resource, stacked */}
      <div style={{ padding: "10px 16px 12px" }}>
        {rows.length === 0 && (
          <div style={{ padding: "16px 0", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
            No resources added yet.
          </div>
        )}
        {rows.map((row, ri) => {
          const grandTotal = ALL_QKEYS.reduce((s, k) => s + row[k], 0);
          return (
            <div key={row.id} style={{ marginBottom: ri < rows.length - 1 ? 20 : 0 }}>
              {/* resource name bar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 8px",
                background: "#f1f5f9",
                borderLeft: "3px solid #1a6ea8",
                borderBottom: "1px solid #e2e8f0",
                borderRadius: "2px 2px 0 0",
              }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: "#1a3557" }}>{row.label}</span>
                {row.sub && (
                  <span style={{ fontSize: 10, color: "#64748b" }}>{row.sub}</span>
                )}
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>
                  Total: {fmt(grandTotal)}
                </span>
                <button
                  onClick={() => deleteRow(row.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors p-0.5 rounded"
                  title="Remove resource">
                  <Trash2 size={12} />
                </button>
              </div>

              {/* FY × Q table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", tableLayout: "fixed", minWidth: 480 }}>
                  <colgroup>
                    <col style={{ width: 56 }} />
                    <col style={{ width: 110 }} />
                    <col style={{ width: 110 }} />
                    <col style={{ width: 110 }} />
                    <col style={{ width: 110 }} />
                    <col style={{ width: 100 }} />
                  </colgroup>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                      <th style={{ ...cp, textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Year
                      </th>
                      {qs.map((q) => {
                        const past = q < CURRENT_Q;
                        const current = q === CURRENT_Q;
                        return (
                          <th key={q} style={{ ...cp, textAlign: "right", fontSize: 10, fontWeight: 700,
                            color: past ? "#1e40af" : current ? "#0f172a" : "#78350f",
                            textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Q{q} {current && <span style={{ fontSize: 8 }}>CURRENT</span>}
                            <span style={{ fontWeight: 500, opacity: 0.75 }}> {Q_RANGES[q - 1]}</span>
                          </th>
                        );
                      })}
                      <th style={{ ...cp, textAlign: "right", fontSize: 10, fontWeight: 700,
                        color: "#1a6ea8", textTransform: "uppercase", letterSpacing: "0.04em",
                        borderLeft: "1px solid #cbd5e1" }}>
                        FY Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FY_NUMS.map((fy, fyIdx) => {
                      const fyKeys = qs.map((q) => `fy${fy}q${q}` as QKey);
                      const rFyTotal = fyKeys.reduce((s, k) => s + row[k], 0);
                      const allPast  = isPastFY(fy);
                      const even     = fyIdx % 2 === 0;
                      const rowBg    = allPast ? (even ? BLUE_BG : BLUE_BG2) : (even ? GOLD_BG : GOLD_BG2);

                      return (
                        <tr key={fy} style={{ borderTop: "1px solid #e2e8f0" }}>
                          <td style={{ ...cp, fontWeight: 700, color: "#1a3557", fontSize: 12,
                            backgroundColor: rowBg }}>
                            FY{fy}
                          </td>
                          {qs.map((q) => {
                            const key  = `fy${fy}q${q}` as QKey;
                            const past = isPastQ(fy, q);
                            const current = fy === CURRENT_FY && q === CURRENT_Q;
                            const cellBg = past ? (even ? BLUE_BG : BLUE_BG2) : (even ? GOLD_BG : GOLD_BG2);
                            return (
                              <td key={q} style={{ ...cp, textAlign: "right",
                                backgroundColor: cellBg,
                                color: past ? "#1e3a5f" : undefined,
                                fontWeight: past ? 500 : undefined,
                                ...(current ? { boxShadow: "inset 0 0 0 2px #0f172a" } : {}) }}>
                                {past
                                  ? fmt(row[key])
                                  : <QCell value={row[key]} onChange={updateCell(row.id, key)} />}
                              </td>
                            );
                          })}
                          <td style={{ ...cp, textAlign: "right", fontWeight: 700,
                            color: allPast ? "#1e3a5f" : "#1a3557",
                            borderLeft: "1px solid #cbd5e1",
                            backgroundColor: allPast ? (even ? BLUE_BG2 : "#c7d9f8") : (even ? GOLD_BG2 : "#fde68a") }}>
                            {fmt(rFyTotal)}
                          </td>
                        </tr>
                      );
                    })}
                    {/* TOTAL row */}
                    <tr style={{ borderTop: "2px solid #94a3b8", background: "#f1f5f9" }}>
                      <td style={{ ...cp, fontWeight: 700, fontSize: 10, color: "#475569",
                        textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Total
                      </td>
                      {qs.map((q) => {
                        const colTotal = FY_NUMS.reduce((s, fy) => s + row[`fy${fy}q${q}` as QKey], 0);
                        return (
                          <td key={q} style={{ ...cp, textAlign: "right", fontWeight: 700, color: "#1a3557",
                            backgroundColor: BLUE_BG }}>
                            {fmt(colTotal)}
                          </td>
                        );
                      })}
                      <td style={{ ...cp, textAlign: "right", fontWeight: 700, color: "#1a3557",
                        borderLeft: "1px solid #cbd5e1", backgroundColor: BLUE_BG2 }}>
                        {fmt(grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Resource Table (category accordion) ───────────────────────── */
function ResourceTable({
  category, rows, setRows, fyTargets, qTargets, setQTargets, viewMode,
}: {
  category: Category;
  rows: ScratchRow[];
  setRows: (rows: ScratchRow[]) => void;
  fyTargets: Record<FY, number>;
  qTargets: Record<FY, FyQTargets>;
  setQTargets: (fy: FY, qt: FyQTargets) => void;
  viewMode: ViewMode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const navyBg = { backgroundColor: "#1a3557" };
  const grandResourceTotal = FY_NUMS.reduce((s, fy) => s + fyTotal(rows, fy), 0);
  const grandTarget = FY_NUMS.reduce((s, fy) => s + fyTargets[fy], 0);
  const addLabel = category === "Labor" ? "Person"
    : category === "Travel" ? "Org / location"
    : category === "Contract" ? "Contract item"
    : "Resource";

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Navy header: toggle on left, FY summaries + add button on right */}
      <div className="w-full flex items-center gap-3 px-5 py-3" style={navyBg}>
        <button
          className="flex items-center gap-3 flex-1 text-left min-w-0"
          onClick={() => setExpanded((e) => !e)}
        >
          <span className="text-white flex-shrink-0">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          <span className="text-white font-bold text-sm tracking-wide">{category}</span>
        </button>
        <div className="flex items-center gap-4 flex-shrink-0">
          {FY_NUMS.map((fy) => {
            const rt = fyTotal(rows, fy);
            const d = rt - fyTargets[fy];
            const over = d > 0;
            return (
              <div key={fy} className="text-right">
                <div className="text-[10px] text-blue-300 font-medium">FY{fy}</div>
                <div className="text-white font-semibold text-xs tabular-nums">{fmt(rt)}</div>
                {d !== 0 && (
                  <div className="text-[10px] tabular-nums font-medium"
                    style={{ color: over ? "#fca5a5" : "#6ee7b7" }}>
                    {over ? "+" : ""}{fmt(d)}
                  </div>
                )}
              </div>
            );
          })}
          <DeltaBadge resourceTotal={grandResourceTotal} target={grandTarget} />
          {/* Add button lives in the header */}
          <button
            onClick={(e) => { e.stopPropagation(); setAdding(true); setExpanded(true); }}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded transition-colors flex-shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.28)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"; }}
          >
            <Plus size={13} /> Add {addLabel}
          </button>
        </div>
      </div>

      {/* Inline add form — appears below header when active */}
      {adding && (
        <AddRowForm
          placeholder={addLabel}
          onCancel={() => setAdding(false)}
          onAdd={(label, sub) => { setRows([...rows, blankRow(label, sub)]); setAdding(false); }}
        />
      )}

      {expanded && (
        viewMode === "fy" ? (
          <div>
            {FY_NUMS.map((fy) => (
              <FySection
                key={fy}
                fy={fy}
                rows={rows}
                setRows={setRows}
                fyTarget={fyTargets[fy]}
                fyQTargets={qTargets[fy]}
                setFyQTargets={(qt) => setQTargets(fy, qt)}
              />
            ))}
          </div>
        ) : (
          <QuarterGrid
            rows={rows}
            setRows={setRows}
            fyQTargets={qTargets}
          />
        )
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function ScratchPlanner() {
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("fy");

  const [targets, setTargets] = useState<Record<Category, Record<FY, number>>>(computeInitialTargets);
  const [qTargets, setQTargetsState] = useState<QTargets>(() => computeInitialQTargets(computeInitialTargets()));

  const [laborRows,       setLaborRows]       = useState<ScratchRow[]>(STUB_LABOR);
  const [travelRows,      setTravelRows]      = useState<ScratchRow[]>(STUB_TRAVEL);
  const [contractRows,    setContractRows]    = useState<ScratchRow[]>(STUB_CONTRACT);
  const [outsourcingRows, setOutsourcingRows] = useState<ScratchRow[]>(STUB_OUTSOURCING);

  function setQTargets(cat: Category, fy: FY, qt: FyQTargets) {
    setQTargetsState((prev) => ({ ...prev, [cat]: { ...prev[cat], [fy]: qt } }));
  }

  return (
    <Layout title="Internal Planning Scratch Pad">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Internal Planning Scratch Pad</h2>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Not visible to sponsors. All data is in-session only and will not be saved.
            </p>
          </div>
          <button onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg shadow-sm transition-colors flex-shrink-0">
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        <SummaryTable targets={targets} setTargets={setTargets} />

        <div className="space-y-3">
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Resource Allocation — click a category to expand
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button onClick={() => setViewMode("fy")}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-all ${
                  viewMode === "fy" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}>
                <Rows3 size={13} /> FY View
              </button>
              <button onClick={() => setViewMode("quarter")}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-all ${
                  viewMode === "quarter" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}>
                <LayoutList size={13} /> Resource View
              </button>
            </div>
          </div>

          <ResourceTable category="Labor" rows={laborRows} setRows={setLaborRows}
            fyTargets={targets.Labor} qTargets={qTargets.Labor}
            setQTargets={(fy, qt) => setQTargets("Labor", fy, qt)} viewMode={viewMode} />
          <ResourceTable category="Travel" rows={travelRows} setRows={setTravelRows}
            fyTargets={targets.Travel} qTargets={qTargets.Travel}
            setQTargets={(fy, qt) => setQTargets("Travel", fy, qt)} viewMode={viewMode} />
          <ResourceTable category="Contract" rows={contractRows} setRows={setContractRows}
            fyTargets={targets.Contract} qTargets={qTargets.Contract}
            setQTargets={(fy, qt) => setQTargets("Contract", fy, qt)} viewMode={viewMode} />
          <ResourceTable category="Outsourcing" rows={outsourcingRows} setRows={setOutsourcingRows}
            fyTargets={targets.Outsourcing} qTargets={qTargets.Outsourcing}
            setQTargets={(fy, qt) => setQTargets("Outsourcing", fy, qt)} viewMode={viewMode} />
        </div>
      </div>
    </Layout>
  );
}
