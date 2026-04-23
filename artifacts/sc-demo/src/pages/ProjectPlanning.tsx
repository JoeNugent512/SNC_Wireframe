import { useState } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight, Settings } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";

/* ─── helpers ─────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

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
        className="w-full text-right text-sm border border-amber-400 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-amber-300 tabular-nums bg-white"
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
  return [rows, updateAmount, updateNote] as const;
}

/* ─── single funding section table ─────────────────────────────── */
function FundingSection({
  title, columnHeader, rows, onUpdateAmount, onUpdateNote,
}: {
  title: string;
  columnHeader: string;
  rows: FundingRow[];
  onUpdateAmount: (id: number, field: "planned" | "requested", value: number) => void;
  onUpdateNote: (id: number, value: string) => void;
}) {
  const totalPlanned     = rows.reduce((s, r) => s + r.planned, 0);
  const totalRequested   = rows.reduce((s, r) => s + r.requested, 0);
  const totalCommitments = rows.reduce((s, r) => s + r.totalCommitments, 0);
  const totalOpen        = rows.reduce((s, r) => s + r.openCommitments, 0);
  const totalObligated   = rows.reduce((s, r) => s + r.obligated, 0);

  const blueHd = "px-3 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wide";
  const blueTd = "px-3 py-2.5 text-right text-sm tabular-nums text-slate-800";

  /* amber = #fffbeb | amber border = #fcd34d | blue header = #1a6ea8 | blue cell = #eff6ff */
  const amberBg = "#fffbeb";
  const amberBorder = "1px solid #fcd34d";
  const amberTotalBg = "#fef3c7";
  const blueCellBg = "#eff6ff";
  const blueBorder = "1px solid #bfdbfe";
  const blueHdBg = "#1a6ea8";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* section header */}
      <div className="px-4 py-3" style={{ backgroundColor: "#1a3557" }}>
        <span className="font-bold text-white text-sm tracking-wide">{title}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              {/* label col */}
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50" style={{ minWidth: 140 }}>
                {columnHeader}
              </th>
              {/* editable cols — amber */}
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: amberBg, color: "#92400e", borderLeft: amberBorder, width: 120 }}>
                Total Planned
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: amberBg, color: "#92400e", borderLeft: amberBorder, width: 120 }}>
                Total Requested
              </th>
              {/* read-only cols — blue */}
              <th className={blueHd} style={{ backgroundColor: blueHdBg, borderLeft: blueBorder, width: 130 }}>Total Commitments</th>
              <th className={blueHd} style={{ backgroundColor: blueHdBg, borderLeft: blueBorder, width: 130 }}>Open Commitments</th>
              <th className={blueHd} style={{ backgroundColor: blueHdBg, borderLeft: blueBorder, width: 110 }}>Obligated</th>
              {/* description + notes */}
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50" style={{ borderLeft: "1px solid #e2e8f0", minWidth: 210 }}>
                Description
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: amberBg, color: "#92400e", borderLeft: amberBorder, minWidth: 110 }}>
                Notes
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #fef9c3" }}>
                <td className="px-3 py-2.5 text-slate-700 font-medium bg-slate-50">{row.label}</td>
                {/* editable */}
                <td className="px-3 py-2.5" style={{ backgroundColor: amberBg, borderLeft: amberBorder }}>
                  <EditableAmount value={row.planned}   onChange={(v) => onUpdateAmount(row.id, "planned", v)} />
                </td>
                <td className="px-3 py-2.5" style={{ backgroundColor: amberBg, borderLeft: amberBorder }}>
                  <EditableAmount value={row.requested} onChange={(v) => onUpdateAmount(row.id, "requested", v)} />
                </td>
                {/* read-only blue */}
                <td className={blueTd} style={{ backgroundColor: blueCellBg, borderLeft: blueBorder }}>{fmt(row.totalCommitments)}</td>
                <td className={blueTd} style={{ backgroundColor: blueCellBg, borderLeft: blueBorder }}>{fmt(row.openCommitments)}</td>
                <td className={blueTd} style={{ backgroundColor: blueCellBg, borderLeft: blueBorder }}>{fmt(row.obligated)}</td>
                {/* description */}
                <td className="px-3 py-2.5 text-xs text-slate-400 font-mono bg-white truncate max-w-[220px]" style={{ borderLeft: "1px solid #e2e8f0" }} title={row.description}>
                  {row.description}
                </td>
                {/* notes — editable amber */}
                <td className="px-3 py-2.5" style={{ backgroundColor: amberBg, borderLeft: amberBorder }}>
                  <input
                    type="text" value={row.notes}
                    onChange={(e) => onUpdateNote(row.id, e.target.value)}
                    placeholder="notes"
                    className="w-full text-sm text-slate-700 border-none focus:outline-none"
                    style={{ backgroundColor: "transparent" }}
                  />
                </td>
              </tr>
            ))}
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
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ─── main funding view ────────────────────────────────────────── */
function FundingView({ budget, projectNumber }: { budget: number; projectNumber: string }) {
  const b = budget;
  const fy = projectNumber.slice(0, 2);
  const num = projectNumber;

  const [laborRows, updateLaborAmt, updateLaborNote] = useFundingRows([
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

  const [travelRows, updateTravelAmt, updateTravelNote] = useFundingRows([
    { id: 1, label: "Site Visits", planned: Math.round(b * 0.02), requested: Math.round(b * 0.02),
      totalCommitments: Math.round(b * 0.02), openCommitments: Math.round(b * 0.02 * 0.59), obligated: Math.round(b * 0.02 * 0.41),
      description: `FY${fy}/SANDC TRAVEL FOR ${num}/Site Visits/`, notes: "" },
    { id: 2, label: "Equipment Transport", planned: Math.round(b * 0.013), requested: Math.round(b * 0.013),
      totalCommitments: Math.round(b * 0.013), openCommitments: Math.round(b * 0.013 * 0.50), obligated: Math.round(b * 0.013 * 0.50),
      description: `FY${fy}/SANDC TRAVEL FOR ${num}/Equip Transport/`, notes: "" },
  ]);

  const [matRows, updateMatAmt, updateMatNote] = useFundingRows([
    { id: 1, label: "Concrete (500 units)", planned: Math.round(b * 0.031), requested: Math.round(b * 0.031),
      totalCommitments: Math.round(b * 0.031), openCommitments: Math.round(b * 0.031 * 0.53), obligated: Math.round(b * 0.031 * 0.47),
      description: `FY${fy}/SANDC MATL FOR ${num}/Concrete/500 units`, notes: "" },
    { id: 2, label: "Steel Rebar (2000 ft)", planned: Math.round(b * 0.021), requested: Math.round(b * 0.021 * 0.98),
      totalCommitments: Math.round(b * 0.021 * 0.98), openCommitments: Math.round(b * 0.021 * 0.49), obligated: Math.round(b * 0.021 * 0.49),
      description: `FY${fy}/SANDC MATL FOR ${num}/Rebar/2000 units`, notes: "" },
  ]);

  const allPlanned = [...laborRows, ...travelRows, ...matRows].reduce((s, r) => s + r.planned, 0);
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
        <div className={`rounded-2xl px-6 py-5 shadow-sm border ${leftToPlan >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${leftToPlan >= 0 ? "text-emerald-600" : "text-red-500"}`}>Left to Plan</p>
          <p className={`text-3xl font-bold tabular-nums leading-none ${leftToPlan >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmt(leftToPlan)}</p>
          <p className={`text-xs mt-1 ${leftToPlan >= 0 ? "text-emerald-500" : "text-red-400"}`}>{leftToPlan >= 0 ? "Remaining to allocate" : "Over budget"}</p>
        </div>
      </div>

      {/* tables */}
      <FundingSection title="Labor"             columnHeader="Employee / Org Code" rows={laborRows}  onUpdateAmount={updateLaborAmt}  onUpdateNote={updateLaborNote}  />
      <FundingSection title="Travel"            columnHeader="Travel Line"         rows={travelRows} onUpdateAmount={updateTravelAmt} onUpdateNote={updateTravelNote} />
      <FundingSection title="Materials & Other" columnHeader="Item"                rows={matRows}    onUpdateAmount={updateMatAmt}    onUpdateNote={updateMatNote}    />

      {/* submit */}
      <div className="flex justify-center pt-2 pb-4">
        <button className="px-12 py-2.5 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors" style={{ backgroundColor: "#1a3557" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#16304d")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1a3557")}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

/* ─── page ─────────────────────────────────────────────────────── */
export default function ProjectPlanning() {
  const params = useParams();
  const { toast } = useToast();

  const projectId = params.id;
  const project = MOCK_PROJECTS.find((p) => p.id === projectId);

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

  void toast; // kept for potential future use

  return (
    <Layout breadcrumb={breadcrumb} headerActions={headerActions}>
      <FundingView budget={project.budget} projectNumber={project.number} />
      <Toaster />
    </Layout>
  );
}
