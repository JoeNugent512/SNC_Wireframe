import React, { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight, ChevronDown, Settings, Plus, Trash2, MinusCircle, X, Search, Check } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";

/* ─── helpers ─────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

let _uid = 100;
const uid = () => ++_uid;

/* ─── option data ──────────────────────────────────────────────── */
const LABOR_OPTIONS = [
  { label: "Nugent, Joseph Pat",       sub: "U435310" },
  { label: "Chen, David",              sub: "U719203" },
  { label: "Williams, Sandra K.",      sub: "U920183" },
  { label: "Torres, Miguel A.",        sub: "U582094" },
  { label: "Park, Jennifer",           sub: "U601847" },
  { label: "Harrison, Mark T.",        sub: "U719203" },
  { label: "Okafor, Chioma",           sub: "U601847" },
  { label: "Reyes, Carlos",            sub: "U834512" },
  { label: "USACE Chicago District",   sub: "U435310" },
  { label: "USACE Omaha District",     sub: "U582094" },
  { label: "USACE Kansas City District", sub: "U601847" },
  { label: "USACE Tulsa District",     sub: "U719203" },
  { label: "USACE Little Rock District", sub: "U834512" },
  { label: "USACE Memphis District",   sub: "U920183" },
];

const TRAVEL_OPTIONS = [
  { label: "CERL",                              sub: "U435310" },
  { label: "ERDC Headquarters",                 sub: "U582094" },
  { label: "Cold Regions Research Lab",         sub: "U601847" },
  { label: "Waterways Experiment Station",      sub: "U719203" },
  { label: "Vicksburg District",                sub: "U834512" },
  { label: "Nashville District",                sub: "U920183" },
  { label: "Fort Worth District",               sub: "U110234" },
  { label: "Huntsville Center",                 sub: "U223456" },
  { label: "Pacific Ocean Division",            sub: "U334567" },
  { label: "South Atlantic Division",           sub: "U445678" },
  { label: "Great Lakes & Ohio River Division", sub: "U556789" },
  { label: "Fort Campbell",                     sub: "U667890" },
  { label: "Fort Bragg",                        sub: "U778901" },
  { label: "Aberdeen Proving Ground",           sub: "U889012" },
];

const MATERIAL_OPTIONS = [
  { label: "Concrete",             sub: "Structural concrete materials" },
  { label: "Steel Rebar",          sub: "Reinforcement steel" },
  { label: "Lumber / Timber",      sub: "Wood structural members" },
  { label: "Pipe & Fittings",      sub: "Plumbing and drainage" },
  { label: "Electrical Conduit",   sub: "Wiring and conduit supplies" },
  { label: "Geotextile Fabric",    sub: "Erosion control material" },
  { label: "Asphalt",              sub: "Paving materials" },
  { label: "Gravel / Aggregate",   sub: "Base course and fill" },
  { label: "Equipment Rental",     sub: "Heavy machinery rental" },
  { label: "Consulting Services",  sub: "Professional services contract" },
];

/* ─── multi-select checkbox list panel ─────────────────────────── */
function CheckList({
  options,
  selected,
  onToggle,
  placeholder,
}: {
  options: { label: string; sub: string }[];
  selected: Set<string>;
  onToggle: (label: string) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.sub.toLowerCase().includes(q));
  }, [query, options]);

  return (
    <div className="flex flex-col" style={{ minWidth: 0 }}>
      {/* search */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 bg-white">
          <Search size={13} className="text-slate-400 flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="text-sm w-full focus:outline-none text-slate-700 placeholder-slate-400 bg-transparent"
          />
        </div>
      </div>
      {/* list */}
      <ul className="overflow-y-auto flex-1" style={{ maxHeight: 220 }}>
        {filtered.length === 0 && (
          <li className="px-4 py-3 text-center text-xs text-slate-400">No matches</li>
        )}
        {filtered.map((opt) => {
          const checked = selected.has(opt.label);
          return (
            <li key={opt.label}>
              <button
                onClick={() => onToggle(opt.label)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none flex items-center gap-2.5"
              >
                <div
                  className="flex-shrink-0 rounded flex items-center justify-center transition-colors"
                  style={{
                    width: 16, height: 16,
                    backgroundColor: checked ? "#1a3557" : "#fff",
                    border: checked ? "2px solid #1a3557" : "2px solid #cbd5e1",
                  }}
                >
                  {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-tight truncate">{opt.label}</p>
                  <p className="text-xs text-slate-400 leading-tight">{opt.sub}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─── picker modal ──────────────────────────────────────────────── */
function MultiPickerModal({
  title,
  options,
  existingLabels,
  placeholder,
  onAdd,
  onClose,
}: {
  title: string;
  options: { label: string; sub: string }[];
  existingLabels: Set<string>;
  placeholder: string;
  onAdd: (items: { label: string; sub: string }[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const avail = useMemo(() => options.filter((o) => !existingLabels.has(o.label)), [options, existingLabels]);

  const toggle = (label: string) =>
    setSelected((prev) => { const next = new Set(prev); next.has(label) ? next.delete(label) : next.add(label); return next; });

  const handleAdd = () => {
    if (selected.size > 0) onAdd(avail.filter((o) => selected.has(o.label)));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(15,23,42,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width: 340, maxHeight: "70vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ backgroundColor: "#1a3557" }}>
          <span className="text-white font-semibold text-xs tracking-wide uppercase">{title}</span>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <CheckList options={avail} selected={selected} onToggle={toggle} placeholder={placeholder} />
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-slate-50">
          <p className="text-xs text-slate-500">
            {selected.size === 0 ? "Select items above" : `${selected.size} selected`}
          </p>
          <button
            onClick={handleAdd}
            disabled={selected.size === 0}
            className="px-5 py-2 text-sm font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
            style={
              selected.size > 0
                ? { backgroundColor: "#1a3557", color: "#fff" }
                : { backgroundColor: "#e2e8f0", color: "#94a3b8" }
            }
          >
            Add to Plan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── types ────────────────────────────────────────────────────── */
type YearQuarters = { fy: string; q1: number; q2: number; q3: number; q4: number };

type FundingRow = {
  id: number;
  label: string;
  sub?: string;
  planned: number;
  requested: number;
  totalCommitments: number;
  openCommitments: number;
  obligated: number;
  description: string;
  notes: string;
  quarters: YearQuarters[];
};

/* ─── editable amount cell ─────────────────────────────────────── */
function EditableAmount({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  if (editing) {
    return (
      <input
        autoFocus type="text" value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => { onChange(parseInt(raw) || 0); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange(parseInt(raw) || 0); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full text-right text-sm border border-amber-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-300 tabular-nums bg-white"
      />
    );
  }
  return (
    <button
      onClick={() => { setRaw(String(value)); setEditing(true); }}
      className="w-full text-right text-sm text-slate-800 tabular-nums hover:underline decoration-dotted underline-offset-2 focus:outline-none"
    >
      {value === 0 ? "—" : fmt(value)}
    </button>
  );
}

/* ─── spread-fill total cell ──────────────────────────────────── */
function SpreadFillTotal({
  total, onSpread, allYears,
}: {
  total: number;
  onSpread: (q1: number, q2: number, q3: number, q4: number) => void;
  allYears?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const commit = () => {
    const v = parseInt(raw) || 0;
    if (allYears) {
      onSpread(v, 0, 0, 0);
    } else {
      const base = Math.floor(v / 4);
      const rem = v - base * 4;
      onSpread(base + rem, base, base, base);
    }
    setEditing(false);
  };
  if (editing) {
    return (
      <input
        autoFocus type="text" value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="w-full text-right text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-200 tabular-nums bg-white"
      />
    );
  }
  return (
    <button
      onClick={() => { setRaw(String(total)); setEditing(true); }}
      title={allYears ? "Enter a total to spread evenly across all fiscal years" : "Enter a total to spread evenly across Q1–Q4"}
      className="w-full text-right text-sm font-semibold tabular-nums hover:underline decoration-dotted underline-offset-2 focus:outline-none"
      style={{ color: total === 0 ? "#94a3b8" : "#1a3557" }}
    >
      {total === 0 ? "—" : fmt(total)}
    </button>
  );
}

/* ─── row state hook ───────────────────────────────────────────── */
function makeFiveYears(baseFYNum: number): YearQuarters[] {
  return Array.from({ length: 5 }, (_, i) => ({
    fy: `FY${String(baseFYNum + i).padStart(2, "0")}`,
    q1: 0, q2: 0, q3: 0, q4: 0,
  }));
}

function useFundingRows(initial: FundingRow[], defaultFYNum: number) {
  const [rows, setRows] = useState(initial);

  const updateAmount = (id: number, field: "planned" | "requested", value: number) =>
    setRows((r) => r.map((row) => {
      if (row.id !== id) return row;
      if (field === "planned" && row.quarters.some((q) => q.q1 + q.q2 + q.q3 + q.q4 > 0)) return row;
      return { ...row, [field]: value };
    }));

  const updateNote = (id: number, value: string) =>
    setRows((r) => r.map((row) => row.id === id ? { ...row, notes: value } : row));

  const deleteRow = (id: number) =>
    setRows((r) => r.filter((row) => row.id !== id));

  const zeroOutRow = (id: number) =>
    setRows((r) => r.map((row) =>
      row.id === id
        ? { ...row, planned: 0, requested: 0, quarters: row.quarters.map((q) => ({ ...q, q1: 0, q2: 0, q3: 0, q4: 0 })) }
        : row
    ));

  const addRow = (label: string, description: string) =>
    setRows((r) => [...r, {
      id: uid(), label, planned: 0, requested: 0,
      totalCommitments: 0, openCommitments: 0, obligated: 0,
      description, notes: "", quarters: makeFiveYears(defaultFYNum),
    }]);

  const addMany = (items: { label: string; sub?: string }[], descTemplate: string) =>
    setRows((r) => [
      ...r,
      ...items.map(({ label, sub }) => ({
        id: uid(), label, sub, planned: 0, requested: 0,
        totalCommitments: 0, openCommitments: 0, obligated: 0,
        description: descTemplate, notes: "", quarters: makeFiveYears(defaultFYNum),
      })),
    ]);

  const updateQuarter = (id: number, fy: string, qKey: keyof Omit<YearQuarters, "fy">, value: number) =>
    setRows((r) => r.map((row) => {
      if (row.id !== id) return row;
      const quarters = row.quarters.map((q) => q.fy === fy ? { ...q, [qKey]: value } : q);
      const planned = quarters.reduce((s, q) => s + q.q1 + q.q2 + q.q3 + q.q4, 0);
      return { ...row, quarters, planned };
    }));

  const spreadFiscalYear = (id: number, fy: string, q1: number, q2: number, q3: number, q4: number) =>
    setRows((r) => r.map((row) => {
      if (row.id !== id) return row;
      const quarters = row.quarters.map((q) => q.fy === fy ? { ...q, q1, q2, q3, q4 } : q);
      const planned = quarters.reduce((s, q) => s + q.q1 + q.q2 + q.q3 + q.q4, 0);
      return { ...row, quarters, planned };
    }));

  const addFiscalYear = (id: number, fy: string) =>
    setRows((r) => r.map((row) => {
      if (row.id !== id || row.quarters.some((q) => q.fy === fy)) return row;
      return { ...row, quarters: [...row.quarters, { fy, q1: 0, q2: 0, q3: 0, q4: 0 }] };
    }));

  const removeFiscalYear = (id: number, fy: string) =>
    setRows((r) => r.map((row) => {
      if (row.id !== id) return row;
      const quarters = row.quarters.filter((q) => q.fy !== fy);
      const planned = quarters.reduce((s, q) => s + q.q1 + q.q2 + q.q3 + q.q4, 0);
      return { ...row, quarters, planned };
    }));

  const zeroFiscalYear = (id: number, fy: string) =>
    setRows((r) => r.map((row) => {
      if (row.id !== id) return row;
      const quarters = row.quarters.map((q) => q.fy === fy ? { ...q, q1: 0, q2: 0, q3: 0, q4: 0 } : q);
      const planned = quarters.reduce((s, q) => s + q.q1 + q.q2 + q.q3 + q.q4, 0);
      return { ...row, quarters, planned };
    }));

  const spreadAllYears = (id: number, total: number) =>
    setRows((r) => r.map((row) => {
      if (row.id !== id || row.quarters.length === 0) return row;
      const n = row.quarters.length;
      const perFY = Math.floor(total / n);
      const fyRem = total - perFY * n;
      const quarters = row.quarters.map((q, fi) => {
        const fyTotal = perFY + (fi === 0 ? fyRem : 0);
        const base = Math.floor(fyTotal / 4);
        const rem = fyTotal - base * 4;
        return { ...q, q1: base + rem, q2: base, q3: base, q4: base };
      });
      return { ...row, quarters, planned: total };
    }));

  return { rows, updateAmount, updateNote, deleteRow, zeroOutRow, addRow, addMany, updateQuarter, spreadFiscalYear, zeroFiscalYear, spreadAllYears, addFiscalYear, removeFiscalYear };
}

/* ─── single funding section table ─────────────────────────────── */
function FundingSection({
  title, columnHeader, addButtonLabel, descTemplate, rows,
  onUpdateAmount, onUpdateNote, onDelete, onZeroOut, onAddMany,
  pickerMode, existingLabels,
  pickerTitle, pickerOptions, pickerPlaceholder,
  showDetails, defaultFY,
  onUpdateQuarter, onSpreadFiscalYear, onSpreadAllYears, onAddFiscalYear, onRemoveFiscalYear,
}: {
  title: string;
  columnHeader: string;
  addButtonLabel: string;
  descTemplate: string;
  rows: FundingRow[];
  onUpdateAmount: (id: number, field: "planned" | "requested", value: number) => void;
  onUpdateNote: (id: number, value: string) => void;
  onDelete: (id: number) => void;
  onZeroOut: (id: number) => void;
  onAddMany: (items: { label: string; sub?: string }[]) => void;
  pickerMode: "multi";
  existingLabels: Set<string>;
  pickerTitle?: string;
  pickerOptions?: { label: string; sub: string }[];
  pickerPlaceholder?: string;
  showDetails: boolean;
  defaultFY: string;
  onUpdateQuarter: (id: number, fy: string, qKey: keyof Omit<YearQuarters, "fy">, value: number) => void;
  onSpreadFiscalYear: (id: number, fy: string, q1: number, q2: number, q3: number, q4: number) => void;
  onSpreadAllYears: (id: number, total: number) => void;
  onAddFiscalYear: (id: number, fy: string) => void;
  onRemoveFiscalYear: (id: number, fy: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const toggleExpand = (id: number) =>
    setExpandedRows((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const getNextFY = (quarters: YearQuarters[]): string => {
    if (quarters.length === 0) return defaultFY;
    const nums = quarters.map((q) => parseInt(q.fy.replace("FY", "")));
    return `FY${Math.max(...nums) + 1}`;
  };
  const numCols = showDetails ? 9 : 7;

  const totalPlanned     = rows.reduce((s, r) => s + r.planned, 0);
  const totalRequested   = rows.reduce((s, r) => s + r.requested, 0);
  const totalCommitments = rows.reduce((s, r) => s + r.totalCommitments, 0);
  const totalOpen        = rows.reduce((s, r) => s + r.openCommitments, 0);
  const totalObligated   = rows.reduce((s, r) => s + r.obligated, 0);

  const blueHd = "px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide leading-snug";
  const blueTd = "px-3 py-2.5 text-right tabular-nums text-slate-800";

  const amberBg        = "#fffbeb";
  const amberBorder    = "1px solid #fcd34d";   /* outer left edge of amber zone */
  const amberInner     = "1px solid #e9a825";   /* inner divider between amber cols */
  const amberTotalBg   = "#fef3c7";
  const blueCellBg     = "#eff6ff";
  const blueBorder     = "1px solid #bfdbfe";
  const blueHdBg       = "#1a6ea8";

  return (
    <>
      {showPicker && pickerOptions && (
        <MultiPickerModal
          title={pickerTitle ?? ""}
          options={pickerOptions}
          existingLabels={existingLabels}
          placeholder={pickerPlaceholder ?? "Search…"}
          onAdd={(items) => onAddMany(items)}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* section header */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: "#1a3557" }}>
          <span className="font-bold text-white text-sm tracking-wide">{title}</span>
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)")}
          >
            <Plus size={13} />
            {addButtonLabel}
          </button>
        </div>

        {/* table with horizontal scroll for narrow viewports */}
        <div style={{ overflowX: "auto" }}>
        <table className="w-full" style={{ borderCollapse: "collapse", tableLayout: "fixed", minWidth: showDetails ? 860 : 660, fontSize: 13 }}>
          <colgroup>
            <col style={{ width: 180 }} />
            <col style={{ width: 108 }} />
            <col style={{ width: 108 }} />
            <col style={{ width: 108 }} />
            <col style={{ width: 108 }} />
            <col style={{ width: 98 }} />
            {showDetails && <col />}
            {showDetails && <col style={{ width: 95 }} />}
            <col style={{ width: 44 }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: "2px solid #cbd5e1", borderTop: "1px solid #e2e8f0" }}>
              <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap align-bottom" style={{ backgroundColor: "#f1f5f9" }}>
                {columnHeader}
              </th>
              <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide leading-snug align-bottom" style={{ backgroundColor: "#fef3c7", color: "#78350f", borderLeft: amberBorder }}>
                Total<br />Planned
              </th>
              <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide leading-snug align-bottom" style={{ backgroundColor: "#fef3c7", color: "#78350f", borderLeft: amberInner }}>
                Total<br />Requested
              </th>
              <th className={blueHd + " align-bottom"} style={{ backgroundColor: blueHdBg, borderLeft: "2px solid #475569" }}>Total<br />Commitments</th>
              <th className={blueHd + " align-bottom"} style={{ backgroundColor: blueHdBg, borderLeft: blueBorder }}>Open<br />Commitments</th>
              <th className={blueHd + " align-bottom"} style={{ backgroundColor: blueHdBg, borderLeft: blueBorder }}>Obligated</th>
              {showDetails && (
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider align-bottom" style={{ backgroundColor: "#f1f5f9", borderLeft: "1px solid #e2e8f0" }}>
                  Description
                </th>
              )}
              {showDetails && (
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap align-bottom" style={{ backgroundColor: "#fef3c7", color: "#78350f", borderLeft: amberBorder }}>
                  Notes
                </th>
              )}
              <th className="py-3 bg-slate-100" style={{ borderLeft: "1px solid #e2e8f0" }} />
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const hasObligations = row.obligated > 0;
              const isExpanded = expandedRows.has(row.id);
              const hasQuarters = row.quarters.length > 0;
              return (
                <React.Fragment key={row.id}>
                  <tr style={{ borderBottom: isExpanded ? "none" : "1px solid #fef9c3" }}>
                    <td className="px-3 py-2 bg-slate-50">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleExpand(row.id)}
                          className="flex-shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                          title={isExpanded ? "Collapse year/quarter plan" : "Expand year/quarter plan"}
                        >
                          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 leading-snug truncate" title={row.label}>{row.label}</p>
                          {row.sub && <p className="text-xs text-slate-400 leading-snug truncate mt-0.5" title={row.sub}>{row.sub}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5" style={{ backgroundColor: amberBg, borderLeft: amberBorder }}>
                      {hasQuarters ? (
                        <SpreadFillTotal
                          total={row.planned}
                          onSpread={(total) => onSpreadAllYears(row.id, total)}
                          allYears
                        />
                      ) : (
                        <EditableAmount value={row.planned} onChange={(v) => onUpdateAmount(row.id, "planned", v)} />
                      )}
                    </td>
                    <td className="px-3 py-2.5" style={{ backgroundColor: amberBg, borderLeft: amberInner }}>
                      <EditableAmount value={row.requested} onChange={(v) => onUpdateAmount(row.id, "requested", v)} />
                    </td>
                    <td className={blueTd} style={{ backgroundColor: blueCellBg, borderLeft: "2px solid #64748b" }}>{fmt(row.totalCommitments)}</td>
                    <td className={blueTd} style={{ backgroundColor: blueCellBg, borderLeft: blueBorder }}>{fmt(row.openCommitments)}</td>
                    <td className={blueTd} style={{ backgroundColor: blueCellBg, borderLeft: blueBorder }}>{fmt(row.obligated)}</td>
                    {showDetails && (
                      <td className="px-3 py-2.5 text-xs text-slate-500 font-mono bg-white truncate" style={{ borderLeft: "1px solid #e2e8f0" }} title={row.description}>
                        {row.description}
                      </td>
                    )}
                    {showDetails && (
                      <td className="px-3 py-2.5" style={{ backgroundColor: amberBg, borderLeft: amberBorder }}>
                        <input
                          type="text" value={row.notes}
                          onChange={(e) => onUpdateNote(row.id, e.target.value)}
                          placeholder="notes"
                          className="w-full text-sm text-slate-700 border-none focus:outline-none"
                          style={{ backgroundColor: "transparent" }}
                        />
                      </td>
                    )}
                    <td className="px-2 py-2.5 text-center bg-slate-50" style={{ borderLeft: "1px solid #e2e8f0" }}>
                      {hasObligations ? (
                        <button
                          onClick={() => onZeroOut(row.id)}
                          title="Zero out planned amounts (has obligations — cannot be deleted)"
                          className="p-1.5 rounded transition-colors text-amber-600 hover:bg-amber-100"
                        >
                          <MinusCircle size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onDelete(row.id)}
                          title="Delete row"
                          className="p-1.5 rounded transition-colors text-red-500 hover:bg-red-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* ── expanded quarterly breakdown ── */}
                  {isExpanded && (
                    <tr key={`${row.id}-qtr`} style={{ borderBottom: "1px solid #fef9c3" }}>
                      <td colSpan={numCols} style={{ padding: 0 }}>
                        <div style={{ background: "linear-gradient(to bottom, #f0f4f8, #f8fafc)", borderTop: "2px solid #1a6ea8", borderBottom: "1px solid #dde3ea", padding: "0 0 14px 0" }}>
                          {/* inner header bar */}
                          <div style={{ background: "#1a3557", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.08em" }}>Quarterly Breakdown</span>
                            <span style={{ flex: 1 }} />
                            <span style={{ fontSize: 10, color: "#93c5fd", opacity: 0.7 }}>Click any amount to edit &nbsp;·&nbsp; Click FY Total to spread evenly</span>
                          </div>

                          <div style={{ padding: "10px 16px 0 16px" }}>
                          {/* quarter table */}
                          <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
                            <thead>
                              <tr>
                                <th style={{ width: 56, textAlign: "left", color: "#475569", fontWeight: 700, paddingBottom: 6, paddingRight: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10 }}>Year</th>
                                {(["Q1 Oct–Dec", "Q2 Jan–Mar", "Q3 Apr–Jun", "Q4 Jul–Sep"] as const).map((label) => (
                                  <th key={label} style={{ width: 114, textAlign: "right", color: "#1a3557", fontWeight: 700, paddingBottom: 6, paddingRight: 8, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10 }}>{label}</th>
                                ))}
                                <th style={{ width: 104, textAlign: "right", color: "#1a6ea8", fontWeight: 700, paddingBottom: 6, paddingRight: 8, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10, borderLeft: "1px solid #cbd5e1", paddingLeft: 8 }}>FY Total</th>
                                <th style={{ width: 28 }} />
                              </tr>
                            </thead>
                            <tbody>
                              {row.quarters.map((yr, idx) => {
                                const fyTotal = yr.q1 + yr.q2 + yr.q3 + yr.q4;
                                return (
                                  <tr key={yr.fy} style={{ borderTop: "1px solid #e2e8f0", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.55)" }}>
                                    <td style={{ paddingTop: 5, paddingBottom: 5, paddingRight: 12, fontWeight: 700, color: "#1a3557", fontSize: 12 }}>{yr.fy}</td>
                                    {(["q1", "q2", "q3", "q4"] as const).map((qk) => (
                                      <td key={qk} style={{ paddingTop: 3, paddingBottom: 3, paddingRight: 8 }}>
                                        <EditableAmount value={yr[qk]} onChange={(v) => onUpdateQuarter(row.id, yr.fy, qk, v)} />
                                      </td>
                                    ))}
                                    <td style={{ paddingTop: 3, paddingBottom: 3, paddingRight: 8, borderLeft: "1px solid #cbd5e1", paddingLeft: 8 }}>
                                      <SpreadFillTotal
                                        total={fyTotal}
                                        onSpread={(q1, q2, q3, q4) => onSpreadFiscalYear(row.id, yr.fy, q1, q2, q3, q4)}
                                      />
                                    </td>
                                    <td style={{ paddingLeft: 4 }}>
                                      <button
                                        onClick={() => onSpreadFiscalYear(row.id, yr.fy, 0, 0, 0, 0)}
                                        className="p-1 rounded transition-colors"
                                        style={{ color: "#cbd5e1", fontSize: 14, fontWeight: 600, fontFamily: "inherit", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
                                        title={`Zero out ${yr.fy}`}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "#e2e8f0"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = "#cbd5e1"; e.currentTarget.style.background = "transparent"; }}
                                      >
                                        0
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {row.quarters.length === 0 && (
                                <tr>
                                  <td colSpan={7} style={{ paddingTop: 10, paddingBottom: 6, color: "#94a3b8", fontStyle: "italic" }}>
                                    No fiscal years added yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          <tfoot>
            <tr style={{ borderTop: "2px solid #94a3b8" }}>
              <td className="px-3 py-2.5 text-xs text-slate-500 uppercase tracking-wide font-bold bg-slate-100">Total</td>
              <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums font-bold" style={{ backgroundColor: amberTotalBg, borderLeft: amberBorder }}>{fmt(totalPlanned)}</td>
              <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums font-bold" style={{ backgroundColor: amberTotalBg, borderLeft: amberInner }}>{fmt(totalRequested)}</td>
              <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums font-bold bg-blue-100" style={{ borderLeft: "2px solid #64748b" }}>{fmt(totalCommitments)}</td>
              <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums font-bold bg-blue-100" style={{ borderLeft: blueBorder }}>{fmt(totalOpen)}</td>
              <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums font-bold bg-blue-100" style={{ borderLeft: blueBorder }}>{fmt(totalObligated)}</td>
              {showDetails && <td className="bg-white" style={{ borderLeft: "1px solid #e2e8f0" }} />}
              {showDetails && <td style={{ backgroundColor: amberTotalBg, borderLeft: amberBorder }} />}
              <td className="bg-slate-100" style={{ borderLeft: "1px solid #e2e8f0" }} />
            </tr>
          </tfoot>
        </table>
        </div>
      </div>
    </>
  );
}

/* ─── main funding view ────────────────────────────────────────── */
function FundingView({ budget, projectNumber }: { budget: number; projectNumber: string }) {
  const b      = budget;
  const fy     = projectNumber.slice(0, 2);
  const fyNum  = parseInt(fy);
  const num    = projectNumber;
  const [showDetails, setShowDetails] = useState(false);

  const labor = useFundingRows([
    { id: 1, label: "Nugent, Joseph Pat", sub: "U435310",
      planned: Math.round(b * 0.09), requested: Math.round(b * 0.09 * 0.05),
      totalCommitments: Math.round(b * 0.09 * 0.05), openCommitments: Math.round(b * 0.09 * 0.03), obligated: Math.round(b * 0.09 * 0.02),
      description: `FY${fy}/SANDC LABOR FUNDS FOR ${num}/CEFMS/`, notes: "notes",
      quarters: makeFiveYears(fyNum).map((q, i) => i === 0
        ? { ...q, q1: Math.round(b * 0.09 * 0.26), q2: Math.round(b * 0.09 * 0.27), q3: Math.round(b * 0.09 * 0.25), q4: Math.round(b * 0.09 * 0.22) }
        : q) },
    { id: 2, label: "USACE Chicago District", sub: "U435310",
      planned: Math.round(b * 0.05), requested: Math.round(b * 0.05 * 0.95),
      totalCommitments: Math.round(b * 0.05 * 0.95), openCommitments: Math.round(b * 0.05 * 0.50), obligated: Math.round(b * 0.05 * 0.45),
      description: `FY${fy}/SANDC LABOR FUNDS FOR ${num}/U435310/`, notes: "notes",
      quarters: makeFiveYears(fyNum) },
    { id: 3, label: "Chen, David", sub: "U719203",
      planned: Math.round(b * 0.035), requested: Math.round(b * 0.035),
      totalCommitments: Math.round(b * 0.035 * 0.60), openCommitments: Math.round(b * 0.035 * 0.30), obligated: Math.round(b * 0.035 * 0.30),
      description: `FY${fy}/SANDC LABOR FUNDS FOR ${num}/Chen D/`, notes: "",
      quarters: makeFiveYears(fyNum) },
  ], fyNum);

  const travel = useFundingRows([
    { id: 10, label: "CERL", sub: "U435310",
      planned: Math.round(b * 0.02), requested: Math.round(b * 0.02),
      totalCommitments: Math.round(b * 0.02), openCommitments: Math.round(b * 0.02 * 0.59), obligated: Math.round(b * 0.02 * 0.41),
      description: `FY${fy}/SANDC TRAVEL FOR ${num}/CERL/`, notes: "",
      quarters: makeFiveYears(fyNum).map((q, i) => i === 0
        ? { ...q, q1: Math.round(b * 0.02 * 0.30), q2: Math.round(b * 0.02 * 0.30), q3: Math.round(b * 0.02 * 0.25), q4: Math.round(b * 0.02 * 0.15) }
        : q) },
    { id: 11, label: "Vicksburg District", sub: "U834512",
      planned: Math.round(b * 0.013), requested: Math.round(b * 0.013),
      totalCommitments: Math.round(b * 0.013), openCommitments: Math.round(b * 0.013 * 0.50), obligated: 0,
      description: `FY${fy}/SANDC TRAVEL FOR ${num}/Vicksburg District/`, notes: "",
      quarters: makeFiveYears(fyNum) },
  ], fyNum);

  const mats = useFundingRows([
    { id: 20, label: "Concrete (500 units)", planned: Math.round(b * 0.031), requested: Math.round(b * 0.031),
      totalCommitments: Math.round(b * 0.031), openCommitments: Math.round(b * 0.031 * 0.53), obligated: Math.round(b * 0.031 * 0.47),
      description: `FY${fy}/SANDC MATL FOR ${num}/Concrete/500 units`, notes: "",
      quarters: makeFiveYears(fyNum) },
    { id: 21, label: "Steel Rebar (2000 ft)", planned: Math.round(b * 0.021), requested: Math.round(b * 0.021 * 0.98),
      totalCommitments: Math.round(b * 0.021 * 0.98), openCommitments: Math.round(b * 0.021 * 0.49), obligated: 0,
      description: `FY${fy}/SANDC MATL FOR ${num}/Rebar/2000 units`, notes: "",
      quarters: makeFiveYears(fyNum) },
  ], fyNum);

  const laborDescTemplate  = `FY${fy}/SANDC LABOR FUNDS FOR ${num}//`;
  const travelDescTemplate = `FY${fy}/SANDC TRAVEL FOR ${num}//`;
  const matlDescTemplate   = `FY${fy}/SANDC MATL FOR ${num}//`;

  const laborExisting  = useMemo(() => new Set(labor.rows.map((r) => r.label)),  [labor.rows]);
  const travelExisting = useMemo(() => new Set(travel.rows.map((r) => r.label)), [travel.rows]);
  const matsExisting   = useMemo(() => new Set(mats.rows.map((r) => r.label)),   [mats.rows]);

  const allPlanned = [...labor.rows, ...travel.rows, ...mats.rows].reduce((s, r) => s + r.planned, 0);
  const leftToPlan = budget - allPlanned;

  return (
    <div className="space-y-5">
      {/* summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl px-6 py-5 shadow-md" style={{ backgroundColor: "#1a3557" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#93c5fd" }}>TOA</p>
          <p className="text-3xl font-bold text-white tabular-nums leading-none">{fmt(budget)}</p>
          <p className="text-xs mt-1" style={{ color: "#93c5fd" }}>Total Obligating Authority</p>
        </div>
        <div className="rounded-2xl px-6 py-5 shadow-sm border border-slate-200 bg-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Planned</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{fmt(allPlanned)}</p>
          <p className="text-xs text-slate-400 mt-1">Amount currently planned</p>
        </div>
        <div className={`rounded-2xl px-6 py-5 shadow-sm border ${
          leftToPlan < 0
            ? "bg-red-50 border-red-200"
            : leftToPlan <= 50
              ? "bg-emerald-50 border-emerald-200"
              : "bg-amber-50 border-amber-300"
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${
            leftToPlan < 0 ? "text-red-500" : leftToPlan <= 50 ? "text-emerald-600" : "text-amber-600"
          }`}>Left to Plan</p>
          <p className={`text-3xl font-bold tabular-nums leading-none ${
            leftToPlan < 0 ? "text-red-600" : leftToPlan <= 50 ? "text-emerald-700" : "text-amber-700"
          }`}>{fmt(leftToPlan)}</p>
          <p className={`text-xs mt-1 ${
            leftToPlan < 0 ? "text-red-400" : leftToPlan <= 50 ? "text-emerald-500" : "text-amber-500"
          }`}>
            {leftToPlan < 0 ? "Over budget" : leftToPlan <= 50 ? "Remaining to allocate" : "Unallocated funds remaining"}
          </p>
        </div>
      </div>

      {/* table toolbar */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
          style={
            showDetails
              ? { backgroundColor: "#1a3557", color: "#fff", borderColor: "#1a3557" }
              : { backgroundColor: "#fff", color: "#475569", borderColor: "#cbd5e1" }
          }
        >
          <span
            className="inline-flex items-center justify-center rounded-full transition-colors"
            style={{
              width: 28, height: 16, flexShrink: 0,
              backgroundColor: showDetails ? "rgba(255,255,255,0.25)" : "#e2e8f0",
              position: "relative",
            }}
          >
            <span
              style={{
                width: 12, height: 12, borderRadius: "50%", backgroundColor: "#fff",
                position: "absolute",
                left: showDetails ? "calc(100% - 14px)" : 2,
                transition: "left 0.15s",
                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }}
            />
          </span>
          Description &amp; Notes
        </button>
      </div>

      {/* tables */}
      <FundingSection
        title="Labor" columnHeader="Employee / Org Code"
        addButtonLabel="Add Labor"
        descTemplate={laborDescTemplate}
        rows={labor.rows}
        onUpdateAmount={labor.updateAmount} onUpdateNote={labor.updateNote}
        onDelete={labor.deleteRow} onZeroOut={labor.zeroOutRow}
        onAddMany={(items) => labor.addMany(items, laborDescTemplate)}
        pickerMode="multi"
        existingLabels={laborExisting}
        pickerTitle="Add Labor"
        pickerOptions={LABOR_OPTIONS}
        pickerPlaceholder="Search by name, org code, or department…"
        showDetails={showDetails}
        defaultFY={`FY${fy}`}
        onUpdateQuarter={labor.updateQuarter}
        onSpreadFiscalYear={labor.spreadFiscalYear}
        onSpreadAllYears={labor.spreadAllYears}
        onAddFiscalYear={labor.addFiscalYear}
        onRemoveFiscalYear={labor.removeFiscalYear}
      />
      <FundingSection
        title="Travel" columnHeader="Organization"
        addButtonLabel="Add Travel"
        descTemplate={travelDescTemplate}
        rows={travel.rows}
        onUpdateAmount={travel.updateAmount} onUpdateNote={travel.updateNote}
        onDelete={travel.deleteRow} onZeroOut={travel.zeroOutRow}
        onAddMany={(items) => travel.addMany(items, travelDescTemplate)}
        pickerMode="multi"
        existingLabels={travelExisting}
        pickerTitle="Add Travel"
        pickerOptions={TRAVEL_OPTIONS}
        pickerPlaceholder="Search by name or org code…"
        showDetails={showDetails}
        defaultFY={`FY${fy}`}
        onUpdateQuarter={travel.updateQuarter}
        onSpreadFiscalYear={travel.spreadFiscalYear}
        onSpreadAllYears={travel.spreadAllYears}
        onAddFiscalYear={travel.addFiscalYear}
        onRemoveFiscalYear={travel.removeFiscalYear}
      />
      <FundingSection
        title="Materials & Other" columnHeader="Item"
        addButtonLabel="Add Item"
        descTemplate={matlDescTemplate}
        rows={mats.rows}
        onUpdateAmount={mats.updateAmount} onUpdateNote={mats.updateNote}
        onDelete={mats.deleteRow} onZeroOut={mats.zeroOutRow}
        onAddMany={(items) => mats.addMany(items, matlDescTemplate)}
        pickerMode="multi"
        existingLabels={matsExisting}
        pickerTitle="Add Items"
        pickerOptions={MATERIAL_OPTIONS}
        pickerPlaceholder="Search items…"
        showDetails={showDetails}
        defaultFY={`FY${fy}`}
        onUpdateQuarter={mats.updateQuarter}
        onSpreadFiscalYear={mats.spreadFiscalYear}
        onSpreadAllYears={mats.spreadAllYears}
        onAddFiscalYear={mats.addFiscalYear}
        onRemoveFiscalYear={mats.removeFiscalYear}
      />

      {/* submit */}
      <div className="flex flex-col items-center gap-1.5 pt-2 pb-4">
        <button
          disabled={leftToPlan < 0}
          className="px-12 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:cursor-not-allowed"
          style={
            leftToPlan >= 0
              ? { backgroundColor: "#1a3557", color: "#fff" }
              : { backgroundColor: "#e2e8f0", color: "#94a3b8" }
          }
          onMouseEnter={(e) => {
            if (leftToPlan >= 0) e.currentTarget.style.backgroundColor = "#16304d";
          }}
          onMouseLeave={(e) => {
            if (leftToPlan >= 0) e.currentTarget.style.backgroundColor = "#1a3557";
          }}
          onClick={() => { if (leftToPlan >= 0) alert("Plan submitted successfully!"); }}
        >
          Submit Plan
        </button>
        {leftToPlan < 0 && (
          <p className="text-xs text-slate-400">Plan exceeds budget — reduce planned amounts before submitting</p>
        )}
      </div>
    </div>
  );
}

/* ─── page ─────────────────────────────────────────────────────── */
export default function ProjectPlanning() {
  const params    = useParams();
  const projectId = params.id;
  const project   = MOCK_PROJECTS.find((p) => p.id === projectId);

  if (!project) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24 text-slate-500">Project not found.</div>
      </Layout>
    );
  }

  const breadcrumb = (
    <>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <Link href="/projects" className="text-slate-400 hover:text-slate-700 transition-colors">Project List</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <span className="font-semibold text-slate-800">{project.number}</span>
    </>
  );

  const headerActions = (
    <Link href={`/projects/${project.id}/settings`} data-testid="nav-settings-header">
      <button className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
        <Settings size={17} />
      </button>
    </Link>
  );

  return (
    <Layout breadcrumb={breadcrumb} headerActions={headerActions}>
      <FundingView budget={project.budget} projectNumber={project.number} />
      <Toaster />
    </Layout>
  );
}
