import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight, Settings, Plus, Trash2, MinusCircle, X, Search } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";

/* ─── helpers ─────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

let _uid = 100;
const uid = () => ++_uid;

/* ─── picker option lists ──────────────────────────────────────── */
const LABOR_OPTIONS = [
  { label: "Nugent, Joseph Pat",   sub: "GS-12 · Transportation" },
  { label: "Chen, David",          sub: "GS-13 · Engineering" },
  { label: "Williams, Sandra K.",  sub: "GS-11 · Planning" },
  { label: "Torres, Miguel A.",    sub: "GS-14 · Project Mgmt" },
  { label: "Park, Jennifer",       sub: "GS-12 · Environmental" },
  { label: "U435310",              sub: "Org Code · Logistics" },
  { label: "U582094",              sub: "Org Code · Contracts" },
  { label: "U601847",              sub: "Org Code · Finance" },
  { label: "U719203",              sub: "Org Code · Engineering" },
  { label: "Harrison, Mark T.",    sub: "GS-13 · Civil Engineering" },
  { label: "Okafor, Chioma",       sub: "GS-12 · Environmental" },
  { label: "Reyes, Carlos",        sub: "GS-11 · Construction" },
];

const TRAVEL_OPTIONS = [
  { label: "Site Visits",           sub: "Field inspection & assessment" },
  { label: "Equipment Transport",   sub: "Movement of project equipment" },
  { label: "Training",              sub: "Staff training & certification" },
  { label: "Stakeholder Meetings",  sub: "Coordination with partners" },
  { label: "Conference Travel",     sub: "Professional conferences" },
  { label: "Survey Trips",          sub: "Data collection & surveys" },
  { label: "Permitting Visits",     sub: "Regulatory agency coordination" },
  { label: "Kickoff / Closeout",    sub: "Project start and end activities" },
];

const MATERIAL_OPTIONS = [
  { label: "Concrete",              sub: "Structural concrete materials" },
  { label: "Steel Rebar",           sub: "Reinforcement steel" },
  { label: "Lumber / Timber",       sub: "Wood structural members" },
  { label: "Pipe & Fittings",       sub: "Plumbing and drainage" },
  { label: "Electrical Conduit",    sub: "Wiring and conduit supplies" },
  { label: "Geotextile Fabric",     sub: "Erosion control material" },
  { label: "Asphalt",               sub: "Paving materials" },
  { label: "Gravel / Aggregate",    sub: "Base course and fill" },
  { label: "Equipment Rental",      sub: "Heavy machinery rental" },
  { label: "Consulting Services",   sub: "Professional services contract" },
];

/* ─── picker modal ─────────────────────────────────────────────── */
function PickerModal({
  title,
  options,
  onPick,
  onClose,
}: {
  title: string;
  options: { label: string; sub: string }[];
  onPick: (label: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.sub.toLowerCase().includes(q)
    );
  }, [query, options]);

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(15,23,42,0.45)" }}
      onClick={onClose}
    >
      {/* card — compact */}
      <div
        className="bg-white rounded-xl shadow-2xl overflow-hidden"
        style={{ width: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: "#1a3557" }}>
          <span className="text-white font-semibold text-xs tracking-wide uppercase">{title}</span>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* search */}
        <div className="px-3 pt-3 pb-1.5">
          <div className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="text-sm w-full focus:outline-none text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>

        {/* list */}
        <ul className="overflow-y-auto" style={{ maxHeight: 240 }}>
          {filtered.length === 0 && (
            <li className="px-4 py-4 text-center text-xs text-slate-400">No matches</li>
          )}
          {filtered.map((opt) => (
            <li key={opt.label}>
              <button
                onClick={() => { onPick(opt.label); onClose(); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none"
              >
                <p className="text-sm font-medium text-slate-800 leading-tight">{opt.label}</p>
                <p className="text-xs text-slate-400">{opt.sub}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── types ────────────────────────────────────────────────────── */
type FundingRow = {
  id: number;
  label: string;
  planned: number;
  requested: number;
  totalCommitments: number;
  openCommitments: number;
  obligated: number;
  description: string;
  notes: string;
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

/* ─── row state hook ───────────────────────────────────────────── */
function useFundingRows(initial: FundingRow[]) {
  const [rows, setRows] = useState(initial);

  const updateAmount = (id: number, field: "planned" | "requested", value: number) =>
    setRows((r) => r.map((row) => row.id === id ? { ...row, [field]: value } : row));

  const updateNote = (id: number, value: string) =>
    setRows((r) => r.map((row) => row.id === id ? { ...row, notes: value } : row));

  const deleteRow = (id: number) =>
    setRows((r) => r.filter((row) => row.id !== id));

  const zeroOutRow = (id: number) =>
    setRows((r) => r.map((row) => row.id === id ? { ...row, planned: 0, requested: 0 } : row));

  const addRow = (label: string, description: string) =>
    setRows((r) => [...r, {
      id: uid(), label, planned: 0, requested: 0,
      totalCommitments: 0, openCommitments: 0, obligated: 0,
      description, notes: "",
    }]);

  return { rows, updateAmount, updateNote, deleteRow, zeroOutRow, addRow };
}

/* ─── single funding section table ─────────────────────────────── */
function FundingSection({
  title, columnHeader, addButtonLabel, pickerTitle, pickerOptions, descTemplate, rows,
  onUpdateAmount, onUpdateNote, onDelete, onZeroOut, onAdd,
}: {
  title: string;
  columnHeader: string;
  addButtonLabel: string;
  pickerTitle: string;
  pickerOptions: { label: string; sub: string }[];
  descTemplate: string;
  rows: FundingRow[];
  onUpdateAmount: (id: number, field: "planned" | "requested", value: number) => void;
  onUpdateNote: (id: number, value: string) => void;
  onDelete: (id: number) => void;
  onZeroOut: (id: number) => void;
  onAdd: (label: string, desc: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const totalPlanned     = rows.reduce((s, r) => s + r.planned, 0);
  const totalRequested   = rows.reduce((s, r) => s + r.requested, 0);
  const totalCommitments = rows.reduce((s, r) => s + r.totalCommitments, 0);
  const totalOpen        = rows.reduce((s, r) => s + r.openCommitments, 0);
  const totalObligated   = rows.reduce((s, r) => s + r.obligated, 0);

  const blueHd = "px-3 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wide";
  const blueTd = "px-3 py-2.5 text-right text-sm tabular-nums text-slate-800";

  const amberBg      = "#fffbeb";
  const amberBorder  = "1px solid #fcd34d";
  const amberTotalBg = "#fef3c7";
  const blueCellBg   = "#eff6ff";
  const blueBorder   = "1px solid #bfdbfe";
  const blueHdBg     = "#1a6ea8";

  const handlePick = (label: string) => {
    onAdd(label, descTemplate);
  };

  return (
    <>
      {showPicker && (
        <PickerModal
          title={pickerTitle}
          options={pickerOptions}
          onPick={handlePick}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* ── section header ── */}
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 1150 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #cbd5e1", borderTop: "1px solid #e2e8f0" }}>
                <th className="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap" style={{ backgroundColor: "#f1f5f9", minWidth: 160 }}>
                  {columnHeader}
                </th>
                <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ backgroundColor: "#fef3c7", color: "#78350f", borderLeft: amberBorder, width: 115 }}>
                  Total Planned
                </th>
                <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ backgroundColor: "#fef3c7", color: "#78350f", borderLeft: amberBorder, width: 115 }}>
                  Total Requested
                </th>
                <th className={blueHd} style={{ backgroundColor: blueHdBg, borderLeft: blueBorder, width: 125 }}>Total Commitments</th>
                <th className={blueHd} style={{ backgroundColor: blueHdBg, borderLeft: blueBorder, width: 125 }}>Open Commitments</th>
                <th className={blueHd} style={{ backgroundColor: blueHdBg, borderLeft: blueBorder, width: 105 }}>Obligated</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap" style={{ backgroundColor: "#f1f5f9", borderLeft: "1px solid #e2e8f0", minWidth: 320 }}>
                  Description
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ backgroundColor: "#fef3c7", color: "#78350f", borderLeft: amberBorder, minWidth: 100 }}>
                  Notes
                </th>
                <th className="px-3 py-2 bg-slate-100" style={{ borderLeft: "1px solid #e2e8f0", width: 52 }} />
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const hasObligations = row.obligated > 0;
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid #fef9c3" }}>
                    <td className="px-3 py-2.5 text-slate-700 font-medium bg-slate-50">{row.label}</td>
                    <td className="px-3 py-2.5" style={{ backgroundColor: amberBg, borderLeft: amberBorder }}>
                      <EditableAmount value={row.planned}   onChange={(v) => onUpdateAmount(row.id, "planned", v)} />
                    </td>
                    <td className="px-3 py-2.5" style={{ backgroundColor: amberBg, borderLeft: amberBorder }}>
                      <EditableAmount value={row.requested} onChange={(v) => onUpdateAmount(row.id, "requested", v)} />
                    </td>
                    <td className={blueTd} style={{ backgroundColor: blueCellBg, borderLeft: blueBorder }}>{fmt(row.totalCommitments)}</td>
                    <td className={blueTd} style={{ backgroundColor: blueCellBg, borderLeft: blueBorder }}>{fmt(row.openCommitments)}</td>
                    <td className={blueTd} style={{ backgroundColor: blueCellBg, borderLeft: blueBorder }}>{fmt(row.obligated)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 font-mono bg-white" style={{ borderLeft: "1px solid #e2e8f0", minWidth: 320 }}>
                      {row.description}
                    </td>
                    <td className="px-3 py-2.5" style={{ backgroundColor: amberBg, borderLeft: amberBorder }}>
                      <input
                        type="text" value={row.notes}
                        onChange={(e) => onUpdateNote(row.id, e.target.value)}
                        placeholder="notes"
                        className="w-full text-sm text-slate-700 border-none focus:outline-none"
                        style={{ backgroundColor: "transparent" }}
                      />
                    </td>
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
                );
              })}
            </tbody>

            <tfoot>
              <tr style={{ borderTop: "2px solid #94a3b8" }}>
                <td className="px-3 py-2.5 text-xs text-slate-500 uppercase tracking-wide font-bold bg-slate-100">Total</td>
                <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums font-bold" style={{ backgroundColor: amberTotalBg, borderLeft: amberBorder }}>{fmt(totalPlanned)}</td>
                <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums font-bold" style={{ backgroundColor: amberTotalBg, borderLeft: amberBorder }}>{fmt(totalRequested)}</td>
                <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums font-bold bg-blue-100" style={{ borderLeft: blueBorder }}>{fmt(totalCommitments)}</td>
                <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums font-bold bg-blue-100" style={{ borderLeft: blueBorder }}>{fmt(totalOpen)}</td>
                <td className="px-3 py-2.5 text-right text-sm text-slate-800 tabular-nums font-bold bg-blue-100" style={{ borderLeft: blueBorder }}>{fmt(totalObligated)}</td>
                <td className="bg-white" style={{ borderLeft: "1px solid #e2e8f0" }} />
                <td style={{ backgroundColor: amberTotalBg, borderLeft: amberBorder }} />
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
  const b   = budget;
  const fy  = projectNumber.slice(0, 2);
  const num = projectNumber;

  const labor = useFundingRows([
    { id: 1, label: "Nugent, Joseph Pat", planned: Math.round(b * 0.09), requested: Math.round(b * 0.09 * 0.05),
      totalCommitments: Math.round(b * 0.09 * 0.05), openCommitments: Math.round(b * 0.09 * 0.03), obligated: Math.round(b * 0.09 * 0.02),
      description: `FY${fy}/SANDC LABOR FUNDS FOR ${num}/CEFMS/`, notes: "notes" },
    { id: 2, label: "U435310", planned: Math.round(b * 0.05), requested: Math.round(b * 0.05 * 0.95),
      totalCommitments: Math.round(b * 0.05 * 0.95), openCommitments: Math.round(b * 0.05 * 0.50), obligated: Math.round(b * 0.05 * 0.45),
      description: `FY${fy}/SANDC LABOR FUNDS FOR ${num}/org code/`, notes: "notes" },
    { id: 3, label: "Chen, David", planned: Math.round(b * 0.035), requested: Math.round(b * 0.035),
      totalCommitments: Math.round(b * 0.035 * 0.60), openCommitments: Math.round(b * 0.035 * 0.30), obligated: Math.round(b * 0.035 * 0.30),
      description: `FY${fy}/SANDC LABOR FUNDS FOR ${num}/Chen D/`, notes: "" },
  ]);

  const travel = useFundingRows([
    { id: 10, label: "Site Visits", planned: Math.round(b * 0.02), requested: Math.round(b * 0.02),
      totalCommitments: Math.round(b * 0.02), openCommitments: Math.round(b * 0.02 * 0.59), obligated: Math.round(b * 0.02 * 0.41),
      description: `FY${fy}/SANDC TRAVEL FOR ${num}/Site Visits/`, notes: "" },
    { id: 11, label: "Equipment Transport", planned: Math.round(b * 0.013), requested: Math.round(b * 0.013),
      totalCommitments: Math.round(b * 0.013), openCommitments: Math.round(b * 0.013 * 0.50), obligated: 0,
      description: `FY${fy}/SANDC TRAVEL FOR ${num}/Equip Transport/`, notes: "" },
  ]);

  const mats = useFundingRows([
    { id: 20, label: "Concrete (500 units)", planned: Math.round(b * 0.031), requested: Math.round(b * 0.031),
      totalCommitments: Math.round(b * 0.031), openCommitments: Math.round(b * 0.031 * 0.53), obligated: Math.round(b * 0.031 * 0.47),
      description: `FY${fy}/SANDC MATL FOR ${num}/Concrete/500 units`, notes: "" },
    { id: 21, label: "Steel Rebar (2000 ft)", planned: Math.round(b * 0.021), requested: Math.round(b * 0.021 * 0.98),
      totalCommitments: Math.round(b * 0.021 * 0.98), openCommitments: Math.round(b * 0.021 * 0.49), obligated: 0,
      description: `FY${fy}/SANDC MATL FOR ${num}/Rebar/2000 units`, notes: "" },
  ]);

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

      {/* tables */}
      <FundingSection
        title="Labor" columnHeader="Employee / Org Code"
        addButtonLabel="Add Person" pickerTitle="Select Employee or Org Code" pickerOptions={LABOR_OPTIONS}
        descTemplate={`FY${fy}/SANDC LABOR FUNDS FOR ${num}//`}
        rows={labor.rows}
        onUpdateAmount={labor.updateAmount} onUpdateNote={labor.updateNote}
        onDelete={labor.deleteRow} onZeroOut={labor.zeroOutRow} onAdd={labor.addRow}
      />
      <FundingSection
        title="Travel" columnHeader="Travel Line"
        addButtonLabel="Add Travel Line" pickerTitle="Select Travel Line" pickerOptions={TRAVEL_OPTIONS}
        descTemplate={`FY${fy}/SANDC TRAVEL FOR ${num}//`}
        rows={travel.rows}
        onUpdateAmount={travel.updateAmount} onUpdateNote={travel.updateNote}
        onDelete={travel.deleteRow} onZeroOut={travel.zeroOutRow} onAdd={travel.addRow}
      />
      <FundingSection
        title="Materials & Other" columnHeader="Item"
        addButtonLabel="Add Item" pickerTitle="Select Item or Service" pickerOptions={MATERIAL_OPTIONS}
        descTemplate={`FY${fy}/SANDC MATL FOR ${num}//`}
        rows={mats.rows}
        onUpdateAmount={mats.updateAmount} onUpdateNote={mats.updateNote}
        onDelete={mats.deleteRow} onZeroOut={mats.zeroOutRow} onAdd={mats.addRow}
      />

      {/* submit */}
      <div className="flex flex-col items-center gap-1.5 pt-2 pb-4">
        <button
          disabled={leftToPlan < 0 || leftToPlan > 50}
          className="px-12 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:cursor-not-allowed"
          style={
            leftToPlan >= 0 && leftToPlan <= 50
              ? { backgroundColor: "#1a3557", color: "#fff" }
              : { backgroundColor: "#e2e8f0", color: "#94a3b8" }
          }
          onMouseEnter={(e) => {
            if (leftToPlan >= 0 && leftToPlan <= 50) e.currentTarget.style.backgroundColor = "#16304d";
          }}
          onMouseLeave={(e) => {
            if (leftToPlan >= 0 && leftToPlan <= 50) e.currentTarget.style.backgroundColor = "#1a3557";
          }}
        >
          Submit Plan
        </button>
        {(leftToPlan < 0 || leftToPlan > 50) && (
          <p className="text-xs text-slate-400">
            {leftToPlan < 0
              ? "Plan exceeds budget — reduce planned amounts before submitting"
              : "Allocate remaining funds before submitting"}
          </p>
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
