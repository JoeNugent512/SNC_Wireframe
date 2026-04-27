import React, { useState, useRef } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight, ChevronDown, Settings, Plus, Trash2, X, MinusCircle } from "lucide-react";
import { MOCK_PROJECTS, Project } from "@/lib/mockData";
import Layout from "@/components/Layout";

/* ─── helpers ─────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

let _uid = 100;
const uid = () => ++_uid;

/* ─── fiscal window config (mirrors varCurrentFY / varCurrentQ / varMaxFY / varMaxQ) ──
 *  Production builds would source these from backend settings or named formulas.
 *  All QKey arrays are DERIVED from this config — not hardcoded — including the
 *  near-quarter-end auto-open rule (within NEAR_QTR_END_DAYS the next quarter opens).
 * ────────────────────────────────────────────────────────────────── */
type QKey = keyof QData;

const ALL_QKEYS: QKey[] = [
  "fy25q1","fy25q2","fy25q3","fy25q4",
  "fy26q1","fy26q2","fy26q3","fy26q4",
  // fy26q4 is normally closed but can auto-open when near FY26 Q3 quarter-end
];

interface FiscalWindowConfig {
  currentFY:          number;   // 2-digit FY, e.g. 25 = FY25
  currentQ:           number;   // 1-4
  maxFY:              number;   // last requestable FY
  maxQ:               number;   // last requestable quarter within maxFY
  nearQtrEndDays:     number;   // days threshold to auto-open next quarter
  daysUntilQtrEnd:    number;   // how many days until current quarter closes
}

// Demo snapshot: April 27 is FY25 Q3 (ends Jun 30), 64 days remain → NOT near-end
const FISCAL_CONFIG: FiscalWindowConfig = {
  currentFY:       25,
  currentQ:        3,
  maxFY:           26,
  maxQ:            3,
  nearQtrEndDays:  30,
  daysUntilQtrEnd: 64,
};

function buildQWindow(cfg: FiscalWindowConfig): { past: QKey[]; open: QKey[] } {
  const autoOpenNext = cfg.daysUntilQtrEnd <= cfg.nearQtrEndDays;
  const past: QKey[] = [];
  const open: QKey[] = [];

  for (const k of ALL_QKEYS) {
    // Parse "fy25q3" → fyNum=25, qNum=3
    const fyNum = parseInt(k.slice(2, 4), 10);
    const qNum  = parseInt(k.slice(5),    10);

    const isPast   = fyNum < cfg.currentFY || (fyNum === cfg.currentFY && qNum < cfg.currentQ);
    const maxQAdj  = cfg.maxQ + (autoOpenNext ? 1 : 0); // widen window by 1 near quarter-end
    const isOpen   = !isPast && (fyNum < cfg.maxFY || (fyNum === cfg.maxFY && qNum <= maxQAdj));

    if (isPast) past.push(k);
    else if (isOpen) open.push(k);
    // quarters beyond the open window are silently skipped (not editable, shown as "closed")
  }
  return { past, open };
}

const { past: PAST_QKEYS, open: OPEN_QKEYS } = buildQWindow(FISCAL_CONFIG);

/* ─── resource code tables ─────────────────────────────────────── */
const ORG_OPTIONS = [
  { label: "CERL",                              code: "U435310" },
  { label: "ERDC Headquarters",                 code: "U582094" },
  { label: "Cold Regions Research Lab",         code: "U601847" },
  { label: "Waterways Experiment Station",      code: "U719203" },
  { label: "Vicksburg District",                code: "U834512" },
  { label: "Nashville District",                code: "U920183" },
  { label: "USACE Chicago District",            code: "U435310" },
  { label: "USACE Omaha District",              code: "U582094" },
  { label: "USACE Kansas City District",        code: "U601847" },
  { label: "USACE Tulsa District",              code: "U719203" },
  { label: "Huntsville Center",                 code: "U223456" },
];

const CONTRACT_CODES = [
  { code: "DFC-CONTR",  name: "Direct Fund Cite Contract" },
  { code: "EQUIPMENT",  name: "Durable property" },
  { code: "INTEREST",   name: "Interest Payments and Dividends" },
  { code: "ITCONTSVS",  name: "IT Other Services (NON-GOV)" },
  { code: "ITEQUIPEXP", name: "IT Equipment (Printers, scanners, hard drives, etc)" },
  { code: "ITSFTDEVL",  name: "Software (Private Sector for software development)" },
  { code: "ITSFTMAINT", name: "Software maintenance or support" },
  { code: "ITSFTWREXP", name: "Custom/off the shelf Software licenses, updates" },
  { code: "ITSOFTLEAS", name: "ADP/telecommunication software leases" },
  { code: "O&MEQUIP",   name: "Contracts for O&M, repair, storage, parts for equipment" },
  { code: "OTHCONSVC",  name: "Private Sector contracts not otherwise classified" },
  { code: "OTHFACSVCS", name: "Private Sector Contractual Services Not Otherwise Classified" },
  { code: "OTHRENTAL",  name: "Rental of Equipment (IT equip, cylinder, equipment rental)" },
  { code: "R&D",        name: "R&D contractual services including BAAs" },
  { code: "SUPMATRL",   name: "Commodities expended within one year (supplies, fuel, parts, etc.)" },
  { code: "TRANTHNGS",  name: "Shipping" },
];

const OUTSOURCING_CODES = [
  { code: "WKBOTHCOE", name: "Corps District (MIPR)" },
  { code: "WKBOTHFED", name: "DoD or other Federal Agency (MIPR)" },
  { code: "OTHFACSVCS", name: "Editing (ITLEDITOR)" },
  { code: "OTHFACSVCS", name: "Library Purchases (Periodicals, subscriptions etc.)" },
  { code: "OTHFACSVCS", name: "Paint Tests - Billings (PAINT-TST)" },
  { code: "OTHFACSVCS", name: "Paint Tests" },
  { code: "OTHFACSVCS", name: "Civil Funded Military Officers" },
  { code: "OTHFACSVCS", name: "CQAB Chemical Tests & Analysis" },
  { code: "OTHFACSVCS", name: "SMS Facility Account" },
  { code: "OTHFACSVCS", name: "Other Facility Services (Vehicle maintenance, fuel)" },
  { code: "SHOP/FACIL", name: "OrderTrak" },
  { code: "SHOP/FACIL", name: "ERDC-CCE" },
  { code: "SHOP/FACIL", name: "Printing" },
  { code: "GSAVEH",     name: "Government Vehicle" },
  { code: "TRANTHNGS",  name: "Other Shipping (TRANTHNGS)" },
  { code: "TRANTHNGS",  name: "52E Shipping (NIGHTMAIL)" },
  { code: "GOVPURCH",   name: "TESS (unburdened)" },
  { code: "GOVPURCH",   name: "TESS-S (burdened)" },
  { code: "GOVPURCH",   name: "Other Federal Agency Purchases (ex. Fee-For-Service)" },
];

const LABOR_OPTIONS = [
  { label: "Nugent, Joseph Pat",         sub: "U435310/CERL" },
  { label: "Chen, David",                sub: "U719203/CERL" },
  { label: "Williams, Sandra K.",        sub: "U920183/CERL" },
  { label: "Torres, Miguel A.",          sub: "U582094/ERDC" },
  { label: "Park, Jennifer",             sub: "U601847/CERL" },
  { label: "Harrison, Mark T.",          sub: "U719203/CERL" },
  { label: "Okafor, Chioma",             sub: "U601847/CERL" },
  { label: "Reyes, Carlos",              sub: "U834512/CERL" },
  { label: "Placeholder — TBD",          sub: "— name/org code pending" },
];

const TRAVEL_OPTIONS = [
  { label: "CERL",                              sub: "U435310" },
  { label: "ERDC Headquarters",                 sub: "U582094" },
  { label: "Cold Regions Research Lab",         sub: "U601847" },
  { label: "Waterways Experiment Station",      sub: "U719203" },
  { label: "Vicksburg District",                sub: "U834512" },
  { label: "Nashville District",                sub: "U920183" },
  { label: "USACE Chicago District",            sub: "U435310" },
  { label: "USACE Omaha District",              sub: "U582094" },
  { label: "Huntsville Center",                 sub: "U223456" },
];

/* ─── types ────────────────────────────────────────────────────── */
type QData = {
  fy25q1: number; fy25q2: number; fy25q3: number; fy25q4: number;
  fy26q1: number; fy26q2: number; fy26q3: number; fy26q4: number;
};

type PlanRow = QData & {
  id: number;
  label: string;
  sub: string;
  openCommitment: number;
  requested: number;
};

type ContractRow = QData & {
  id: number;
  org: string;
  orgCode: string;
  contractCode: string;
  contractName: string;
  openCommitment: number;
  requested: number;
};

type OutsourcingRow = QData & {
  id: number;
  org: string;
  orgCode: string;
  resourceCode: string;
  resourceName: string;
  openCommitment: number;
  requested: number;
};

/* ─── derived field helpers ─────────────────────────────────────── */
// Total Planned = sum of ALL quarters in the request window (past + open)
const sumAll = (r: QData) =>
  PAST_QKEYS.reduce((s, k) => s + r[k], 0) + OPEN_QKEYS.reduce((s, k) => s + r[k], 0);

// Obligated = sum of PAST quarters only (already paid, locked)
const obligatedQ = (r: QData) => PAST_QKEYS.reduce((s, k) => s + r[k], 0);

// Planned Remaining = Total Planned - Obligated = sum of OPEN quarters
const plannedRem = (r: QData) => OPEN_QKEYS.reduce((s, k) => s + r[k], 0);

// Open Window Max = max amount that can be requested = sum of OPEN quarters only
// (past/obligated quarters are excluded from the request ceiling)
const openWindowMax = plannedRem;

// Clamp requested to [obligated, openWindowMax].
// Lower bound = obligated: cannot request less than already-paid quarters.
// Upper bound = openWindowMax: cannot request beyond the open quarter window.
function clampRequested(requested: number, obligated: number, max: number): number {
  const lo = Math.min(obligated, max); // guard: if max < obligated (edge case), lock to max
  return Math.max(lo, Math.min(requested, max));
}

/* ─── empty row factories ───────────────────────────────────────── */
const emptyQ = (): QData => ({ fy25q1: 0, fy25q2: 0, fy25q3: 0, fy25q4: 0, fy26q1: 0, fy26q2: 0, fy26q3: 0, fy26q4: 0 });

/* ─── color tokens ──────────────────────────────────────────────── */
const AMBER_BG     = "#fffbeb";
const AMBER_BORDER = "1px solid #fcd34d";
const AMBER_INNER  = "1px solid #e9a825";
const AMBER_TOTAL  = "#fef3c7";
const BLUE_BG      = "#eff6ff";
const BLUE_BORDER  = "1px solid #bfdbfe";
const BLUE_HD_BG   = "#1a6ea8";
const BLUE_TOTAL   = "#dbeafe";

/* ─── simple amount input ───────────────────────────────────────── */
function AmtInput({
  value, onChange, min, max, gold,
}: { value: number; onChange: (v: number) => void; min?: number; max?: number; gold?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        type="text"
        value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => {
          let v = parseInt(raw) || 0;
          if (min !== undefined) v = Math.max(min, v);
          if (max !== undefined) v = Math.min(max, v);
          onChange(v);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") inputRef.current?.blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full text-right text-sm border rounded px-1 py-0.5 focus:outline-none tabular-nums"
        style={{ borderColor: gold ? "#fbbf24" : "#93c5fd", backgroundColor: "#fff" }}
      />
    );
  }
  return (
    <button
      onClick={() => { setRaw(String(value)); setEditing(true); }}
      className="w-full text-right text-sm tabular-nums hover:underline decoration-dotted underline-offset-2 focus:outline-none"
      style={{ color: value === 0 ? "#94a3b8" : "#1e293b" }}
    >
      {value === 0 ? "—" : fmt(value)}
    </button>
  );
}

/* ─── read-only amount cell ─────────────────────────────────────── */
function AmtDisplay({ value, bold }: { value: number; bold?: boolean }) {
  return (
    <span
      className="block w-full text-right tabular-nums text-sm"
      style={{ color: value === 0 ? "#94a3b8" : "#1e293b", fontWeight: bold ? 700 : 400 }}
    >
      {value === 0 ? "—" : fmt(value)}
    </span>
  );
}

/* ─── quarterly panel meta + window-driven rendering ────────────── */
// Each QKey maps to FY label and quarter number for rendering
const Q_META: Record<QKey, { fy: string; q: number; range: string }> = {
  fy25q1: { fy: "FY25", q: 1, range: "Oct–Dec" },
  fy25q2: { fy: "FY25", q: 2, range: "Jan–Mar" },
  fy25q3: { fy: "FY25", q: 3, range: "Apr–Jun" },
  fy25q4: { fy: "FY25", q: 4, range: "Jul–Sep" },
  fy26q1: { fy: "FY26", q: 1, range: "Oct–Dec" },
  fy26q2: { fy: "FY26", q: 2, range: "Jan–Mar" },
  fy26q3: { fy: "FY26", q: 3, range: "Apr–Jun" },
  fy26q4: { fy: "FY26", q: 4, range: "Jul–Sep" },
};

// Group ALL_QKEYS by FY for table rendering (order preserved)
const FY_GROUPS = ALL_QKEYS.reduce<Record<string, QKey[]>>((acc, k) => {
  const fy = Q_META[k].fy;
  if (!acc[fy]) acc[fy] = [];
  acc[fy].push(k);
  return acc;
}, {});
const FY_LABELS = Object.keys(FY_GROUPS); // ["FY25", "FY26"]
const QUARTER_NUMS = [1, 2, 3, 4];
const Q_RANGES = ["Oct–Dec", "Jan–Mar", "Apr–Jun", "Jul–Sep"];

// Stable lookups derived from PAST/OPEN arrays (re-computed once at module level)
const PAST_SET = new Set<string>(PAST_QKEYS);
const OPEN_SET = new Set<string>(OPEN_QKEYS);
const qStatus = (k: string): "past" | "open" | "closed" =>
  PAST_SET.has(k) ? "past" : OPEN_SET.has(k) ? "open" : "closed";

function QuarterlyPanel({
  row, onUpdateQ,
}: {
  row: QData & { id: number };
  onUpdateQ: (id: number, field: keyof QData, val: number) => void;
}) {
  const pastStyle: React.CSSProperties = { backgroundColor: BLUE_BG, color: "#1e40af", fontWeight: 500 };
  const openStyle: React.CSSProperties = { backgroundColor: AMBER_BG };
  const closedStyle: React.CSSProperties = {
    backgroundColor: "#f8fafc", color: "#cbd5e1", cursor: "not-allowed",
    textAlign: "right", fontSize: 12, paddingTop: 3, paddingBottom: 3, paddingRight: 6, borderRadius: 3,
  };

  // Describe the open window in the subtitle
  const openDesc = OPEN_QKEYS.length > 0
    ? `Open: ${Q_META[OPEN_QKEYS[0]].fy} Q${Q_META[OPEN_QKEYS[0]].q}–${Q_META[OPEN_QKEYS[OPEN_QKEYS.length - 1]].fy} Q${Q_META[OPEN_QKEYS[OPEN_QKEYS.length - 1]].q}`
    : "No open quarters";

  return (
    <div style={{ borderTop: "2px solid #1a6ea8", background: "linear-gradient(to bottom, #f0f4f8, #f8fafc)", padding: "0 0 12px 0" }}>
      <div style={{ background: "#1a3557", padding: "5px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Quarterly Breakdown
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: "#93c5fd", opacity: 0.7 }}>
          {PAST_QKEYS.length} past quarter{PAST_QKEYS.length !== 1 ? "s" : ""} obligated &amp; locked
          &nbsp;·&nbsp; {openDesc}
        </span>
      </div>
      <div style={{ padding: "10px 16px 0" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ width: 60, textAlign: "left", color: "#475569", fontWeight: 700, paddingBottom: 6, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em" }}>
                Year
              </th>
              {QUARTER_NUMS.map((qn) => {
                // Use FY25 representative key to determine column-level status label
                const repKey = `fy25q${qn}` as QKey;
                const st = qStatus(repKey);
                const labelColor = st === "past" ? "#1e40af" : st === "open" ? "#78350f" : "#94a3b8";
                const subColor   = st === "past" ? "#64748b" : st === "open" ? "#92400e" : "#94a3b8";
                return (
                  <th key={qn} style={{ textAlign: "right", paddingBottom: 6, paddingRight: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: labelColor, textTransform: "uppercase" }}>
                      Q{qn} {Q_RANGES[qn - 1]}
                    </span>
                    <br />
                    <span style={{ fontSize: 9, color: subColor, fontWeight: 400 }}>
                      {st}
                    </span>
                  </th>
                );
              })}
              <th style={{ width: 90, textAlign: "right", paddingBottom: 6, borderLeft: "1px solid #cbd5e1", paddingLeft: 8, paddingRight: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1a6ea8", textTransform: "uppercase" }}>FY Total</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {FY_LABELS.map((fy, fyIdx) => {
              const fyKeys = FY_GROUPS[fy];
              const fyTotal = fyKeys.reduce((s, k) => s + row[k], 0);
              return (
                <tr key={fy} style={{ borderTop: "1px solid #e2e8f0", background: fyIdx % 2 === 1 ? "rgba(255,255,255,0.55)" : undefined }}>
                  <td style={{ paddingTop: 4, paddingBottom: 4, fontWeight: 700, color: "#1a3557", fontSize: 12 }}>{fy}</td>
                  {QUARTER_NUMS.map((qn) => {
                    const key = `${fy.toLowerCase()}q${qn}` as QKey;
                    const st  = qStatus(key);
                    const cellPad = { paddingTop: 3, paddingBottom: 3, paddingRight: 6, borderRadius: 3 };
                    if (st === "past") {
                      return (
                        <td key={qn} style={{ ...pastStyle, ...cellPad }}>
                          <AmtDisplay value={row[key]} />
                        </td>
                      );
                    }
                    if (st === "open") {
                      return (
                        <td key={qn} style={{ ...openStyle, ...cellPad }}>
                          <AmtInput value={row[key]} onChange={(v) => onUpdateQ(row.id, key, v)} gold />
                        </td>
                      );
                    }
                    return (
                      <td key={qn} style={closedStyle}>
                        — <span style={{ fontSize: 9 }}>closed</span>
                      </td>
                    );
                  })}
                  <td style={{ paddingTop: 3, paddingBottom: 3, borderLeft: "1px solid #cbd5e1", paddingLeft: 8, paddingRight: 6, textAlign: "right", fontWeight: 700, color: fyTotal === 0 ? "#94a3b8" : "#1a3557", fontSize: 12 }} className="tabular-nums">
                    {fyTotal === 0 ? "—" : fmt(fyTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── column header row (shared by all sections) ────────────────── */
function ColHeaders({ nameHeader }: { nameHeader: string }) {
  const hd = "px-3 py-2.5 text-xs font-bold uppercase tracking-wide leading-snug text-right align-bottom";
  return (
    <tr style={{ borderBottom: "2px solid #cbd5e1", borderTop: "1px solid #e2e8f0" }}>
      <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider align-bottom" style={{ backgroundColor: "#f1f5f9", width: 220 }}>
        {nameHeader}
      </th>
      <th className={hd} style={{ backgroundColor: AMBER_TOTAL, color: "#78350f", borderLeft: AMBER_BORDER, width: 120 }}>
        Total<br />Planned
      </th>
      <th className={hd} style={{ backgroundColor: BLUE_BG, color: "#1e40af", borderLeft: "2px solid #475569", width: 115 }}>
        Obligated
      </th>
      <th className={hd} style={{ backgroundColor: BLUE_BG, color: "#1e40af", borderLeft: BLUE_BORDER, width: 130 }}>
        Planned<br />Remaining
      </th>
      <th className={hd} style={{ backgroundColor: BLUE_BG, color: "#1e40af", borderLeft: BLUE_BORDER, width: 115 }}>
        Open<br />Commitment
      </th>
      <th className={hd} style={{ backgroundColor: AMBER_TOTAL, color: "#78350f", borderLeft: AMBER_BORDER }}>
        Request / Max
      </th>
      <th style={{ width: 38, backgroundColor: "#f1f5f9", borderLeft: "1px solid #e2e8f0" }} />
    </tr>
  );
}

/* ─── single data row (Labor / Travel) ─────────────────────────── */
function PlanDataRow({
  row, expanded, onToggle, onUpdateQ, onUpdateRequested, onDelete,
}: {
  row: PlanRow;
  expanded: boolean;
  onToggle: () => void;
  onUpdateQ: (id: number, field: keyof QData, val: number) => void;
  onUpdateRequested: (id: number, val: number) => void;
  onDelete: (id: number) => void;
}) {
  const planned   = sumAll(row);
  const obligated = obligatedQ(row);
  const remaining = plannedRem(row);   // = open-window quarters sum
  const maxReq    = openWindowMax(row); // ceiling for the request field
  const canDelete = obligated === 0;

  const td = "px-3 py-2.5 text-right tabular-nums text-sm text-slate-800";

  return (
    <React.Fragment>
      <tr style={{ borderBottom: expanded ? "none" : "1px solid #f1f5f9" }}>
        <td className="px-2 py-2 bg-white">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggle}
              className="flex-shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={expanded ? "Collapse quarterly plan" : "Expand quarterly plan"}
            >
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 leading-snug truncate">{row.label}</p>
              {row.sub && <p className="text-xs text-slate-400 leading-snug truncate mt-0.5">{row.sub}</p>}
            </div>
          </div>
        </td>
        {/* Total Planned — gold, spread-fill editable (distributes delta across OPEN_QKEYS) */}
        <td className="px-3 py-2" style={{ backgroundColor: AMBER_BG, borderLeft: AMBER_BORDER }}>
          <AmtInput
            value={planned}
            gold
            onChange={(newTotal) => {
              const delta = newTotal - obligated;
              const perQ = delta > 0 ? Math.floor(delta / OPEN_QKEYS.length) : 0;
              const rem  = delta > 0 ? delta - perQ * OPEN_QKEYS.length : 0;
              OPEN_QKEYS.forEach((q, i) => onUpdateQ(row.id, q, perQ + (i === 0 ? rem : 0)));
            }}
          />
        </td>
        {/* Obligated — blue, read-only (PAST quarters sum) */}
        <td className={td} style={{ backgroundColor: BLUE_BG, borderLeft: "2px solid #475569" }}>
          <AmtDisplay value={obligated} />
        </td>
        {/* Planned Remaining — blue, read-only (OPEN quarters sum) */}
        <td className={td} style={{ backgroundColor: BLUE_BG, borderLeft: BLUE_BORDER }}>
          <AmtDisplay value={remaining} />
        </td>
        {/* Open Commitment — blue, read-only */}
        <td className={td} style={{ backgroundColor: BLUE_BG, borderLeft: BLUE_BORDER }}>
          <AmtDisplay value={row.openCommitment} />
        </td>
        {/* Request / Max — gold, editable; clamped to [obligated, openWindowMax] */}
        <td className="px-2 py-2" style={{ backgroundColor: AMBER_BG, borderLeft: AMBER_BORDER }}>
          <div className="flex items-center gap-1">
            <div style={{ flex: "0 0 100px" }}>
              <AmtInput
                value={row.requested}
                min={obligated}
                max={maxReq}
                gold
                onChange={(v) => onUpdateRequested(row.id, clampRequested(v, obligated, maxReq))}
              />
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums">/ {maxReq === 0 ? "—" : fmt(maxReq)}</span>
          </div>
        </td>
        <td style={{ padding: 0, textAlign: "center", verticalAlign: "middle", borderLeft: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
          {canDelete ? (
            <button
              onClick={() => onDelete(row.id)}
              title="Remove row"
              className="rounded transition-colors text-slate-300 hover:text-red-400 hover:bg-red-50"
              style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              <Trash2 size={14} />
            </button>
          ) : (
            <button
              onClick={() => {}}
              title="Row has obligations — cannot be deleted"
              className="rounded text-slate-300 cursor-not-allowed"
              style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              <MinusCircle size={14} />
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
          <td colSpan={7} style={{ padding: 0 }}>
            <QuarterlyPanel row={row} onUpdateQ={onUpdateQ} />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

/* ─── contract / outsourcing data row ──────────────────────────── */
function ResourceDataRow<T extends QData & { id: number; org: string; orgCode: string; openCommitment: number; requested: number }>({
  row, line2, expanded, onToggle, onUpdateQ, onUpdateRequested, onDelete,
  orgOptions, codeOptions, currentCode, onUpdateOrg, onUpdateCode,
}: {
  row: T;
  line2: string;
  expanded: boolean;
  onToggle: () => void;
  onUpdateQ: (id: number, field: keyof QData, val: number) => void;
  onUpdateRequested: (id: number, val: number) => void;
  onDelete: (id: number) => void;
  orgOptions?:    { label: string; code: string }[];
  codeOptions?:   { code: string; name: string }[];
  currentCode?:   string;
  onUpdateOrg?:   (id: number, org: string, orgCode: string) => void;
  onUpdateCode?:  (id: number, code: string, name: string) => void;
}) {
  const planned   = sumAll(row);
  const obligated = obligatedQ(row);
  const remaining = plannedRem(row);
  const maxReq    = openWindowMax(row);
  const canDelete = obligated === 0;
  const td = "px-3 py-2.5 text-right tabular-nums text-sm text-slate-800";
  const selStyle: React.CSSProperties = {
    fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 4, padding: "1px 3px",
    background: "white", color: "#1e293b", width: "100%", cursor: "pointer",
  };

  return (
    <React.Fragment>
      <tr style={{ borderBottom: expanded ? "none" : "1px solid #f1f5f9" }}>
        <td className="px-2 py-2 bg-white">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggle}
              className="flex-shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            <div className="min-w-0 flex-1">
              {orgOptions ? (
                <select
                  value={row.orgCode}
                  style={selStyle}
                  onChange={(e) => {
                    const opt = orgOptions.find((o) => o.code === e.target.value);
                    if (opt) onUpdateOrg?.(row.id, opt.label, opt.code);
                  }}
                >
                  {orgOptions.map((o) => (
                    <option key={`${o.label}|${o.code}`} value={o.code}>{o.label} ({o.code})</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-semibold text-slate-800 leading-snug truncate">{row.org}</p>
              )}
              {codeOptions ? (
                <select
                  value={currentCode ?? ""}
                  style={{ ...selStyle, marginTop: 2, color: "#475569" }}
                  onChange={(e) => {
                    // use name as unique select value (codes can repeat in some lists)
                    const opt = codeOptions.find((o) => o.name === e.target.value);
                    if (opt) onUpdateCode?.(row.id, opt.code, opt.name);
                  }}
                >
                  {codeOptions.map((o) => (
                    <option key={`${o.code}|${o.name}`} value={o.name}>{o.code} — {o.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-slate-400 leading-snug truncate mt-0.5" title={line2}>{line2}</p>
              )}
            </div>
          </div>
        </td>
        {/* Total Planned — gold, spread-fill editable (distributes delta across OPEN_QKEYS) */}
        <td className="px-3 py-2" style={{ backgroundColor: AMBER_BG, borderLeft: AMBER_BORDER }}>
          <AmtInput
            value={planned}
            gold
            onChange={(newTotal) => {
              const delta = newTotal - obligated;
              const perQ = delta > 0 ? Math.floor(delta / OPEN_QKEYS.length) : 0;
              const rem  = delta > 0 ? delta - perQ * OPEN_QKEYS.length : 0;
              OPEN_QKEYS.forEach((q, i) => onUpdateQ(row.id, q, perQ + (i === 0 ? rem : 0)));
            }}
          />
        </td>
        <td className={td} style={{ backgroundColor: BLUE_BG, borderLeft: "2px solid #475569" }}>
          <AmtDisplay value={obligated} />
        </td>
        <td className={td} style={{ backgroundColor: BLUE_BG, borderLeft: BLUE_BORDER }}>
          <AmtDisplay value={remaining} />
        </td>
        <td className={td} style={{ backgroundColor: BLUE_BG, borderLeft: BLUE_BORDER }}>
          <AmtDisplay value={row.openCommitment} />
        </td>
        {/* Request / Max — clamped to [0, openWindowMax (OPEN quarters only)] */}
        <td className="px-2 py-2" style={{ backgroundColor: AMBER_BG, borderLeft: AMBER_BORDER }}>
          <div className="flex items-center gap-1">
            <div style={{ flex: "0 0 100px" }}>
              <AmtInput
                value={row.requested}
                min={obligated}
                max={maxReq}
                gold
                onChange={(v) => onUpdateRequested(row.id, clampRequested(v, obligated, maxReq))}
              />
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums">/ {maxReq === 0 ? "—" : fmt(maxReq)}</span>
          </div>
        </td>
        <td style={{ padding: 0, textAlign: "center", verticalAlign: "middle", borderLeft: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
          {canDelete ? (
            <button onClick={() => onDelete(row.id)} title="Remove row"
              className="rounded transition-colors text-slate-300 hover:text-red-400 hover:bg-red-50"
              style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={14} />
            </button>
          ) : (
            <button title="Has obligations — cannot delete"
              className="rounded text-slate-300 cursor-not-allowed"
              style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <MinusCircle size={14} />
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
          <td colSpan={7} style={{ padding: 0 }}>
            <QuarterlyPanel row={row} onUpdateQ={onUpdateQ} />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

/* ─── section footer totals row ─────────────────────────────────── */
function TotalsRow({ rows }: { rows: (QData & { openCommitment: number; requested: number })[] }) {
  const totalPlanned   = rows.reduce((s, r) => s + sumAll(r), 0);
  const totalObligated = rows.reduce((s, r) => s + obligatedQ(r), 0);
  const totalRemaining = rows.reduce((s, r) => s + plannedRem(r), 0);
  const totalOpen      = rows.reduce((s, r) => s + r.openCommitment, 0);
  const totalRequested = rows.reduce((s, r) => s + r.requested, 0);
  const td = "px-3 py-2 text-right text-sm font-bold tabular-nums";
  return (
    <tr style={{ borderTop: "2px solid #94a3b8" }}>
      <td className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wide font-bold" style={{ backgroundColor: "#f1f5f9" }}>Total</td>
      <td className={td} style={{ backgroundColor: AMBER_TOTAL, borderLeft: AMBER_BORDER }}>{fmt(totalPlanned)}</td>
      <td className={td} style={{ backgroundColor: BLUE_TOTAL, borderLeft: "2px solid #475569" }}>{fmt(totalObligated)}</td>
      <td className={td} style={{ backgroundColor: BLUE_TOTAL, borderLeft: BLUE_BORDER }}>{fmt(totalRemaining)}</td>
      <td className={td} style={{ backgroundColor: BLUE_TOTAL, borderLeft: BLUE_BORDER }}>{fmt(totalOpen)}</td>
      <td className={td} style={{ backgroundColor: AMBER_TOTAL, borderLeft: AMBER_BORDER }}>{fmt(totalRequested)}</td>
      <td style={{ backgroundColor: "#f1f5f9", borderLeft: "1px solid #e2e8f0" }} />
    </tr>
  );
}

/* ─── add-row picker (Labor / Travel) ───────────────────────────── */
function AddRowModal({
  title, options, existingLabels, onAdd, onClose,
}: {
  title: string;
  options: { label: string; sub: string }[];
  existingLabels: Set<string>;
  onAdd: (items: { label: string; sub: string }[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const avail = options.filter((o) => !existingLabels.has(o.label));
  const toggle = (label: string) =>
    setSelected((prev) => { const next = new Set(prev); next.has(label) ? next.delete(label) : next.add(label); return next; });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(15,23,42,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ width: 340, maxHeight: "70vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: "#1a3557" }}>
          <span className="text-white font-semibold text-xs tracking-wide uppercase">{title}</span>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X size={15} /></button>
        </div>
        <ul className="overflow-y-auto" style={{ maxHeight: 280 }}>
          {avail.map((opt) => (
            <li key={opt.label}>
              <button
                onClick={() => toggle(opt.label)}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-shrink-0 rounded flex items-center justify-center"
                  style={{ width: 16, height: 16, backgroundColor: selected.has(opt.label) ? "#1a3557" : "#fff", border: `2px solid ${selected.has(opt.label) ? "#1a3557" : "#cbd5e1"}` }}>
                  {selected.has(opt.label) && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900 }}>✓</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{opt.label}</p>
                  <p className="text-xs text-slate-400">{opt.sub}</p>
                </div>
              </button>
            </li>
          ))}
          {avail.length === 0 && <li className="px-4 py-6 text-center text-xs text-slate-400">All options already added</li>}
        </ul>
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <span className="text-xs text-slate-500">{selected.size === 0 ? "Select items above" : `${selected.size} selected`}</span>
          <button
            onClick={() => { if (selected.size > 0) onAdd(avail.filter((o) => selected.has(o.label))); onClose(); }}
            disabled={selected.size === 0}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
            style={selected.size > 0 ? { backgroundColor: "#1a3557", color: "#fff" } : { backgroundColor: "#e2e8f0", color: "#94a3b8" }}
          >
            Add to Plan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── two-step add modal (Contracting / Outsourcing) ────────────── */
function TwoStepAddModal({
  title, codes, onAdd, onClose,
}: {
  title: string;
  codes: { code: string; name: string }[];
  onAdd: (org: string, orgCode: string, code: string, name: string) => void;
  onClose: () => void;
}) {
  const [selectedOrg, setSelectedOrg]   = useState("");
  const [selectedCode, setSelectedCode] = useState("");

  const org  = ORG_OPTIONS.find((o) => o.label === selectedOrg);
  const code = codes.find((c) => `${c.code}|${c.name}` === selectedCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(15,23,42,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ width: 420, maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: "#1a3557" }}>
          <span className="text-white font-semibold text-xs tracking-wide uppercase">{title}</span>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X size={15} /></button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Step 1: Org */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">1. Select Org / Lab / District</label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">— Select org —</option>
              {ORG_OPTIONS.map((o) => (
                <option key={o.label} value={o.label}>{o.label} ({o.code})</option>
              ))}
            </select>
          </div>

          {/* Step 2: Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">2. Select Resource Code</label>
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              disabled={!selectedOrg}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">— Select resource code —</option>
              {codes.map((c) => (
                <option key={`${c.code}|${c.name}`} value={`${c.code}|${c.name}`}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          {org && code && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <span className="font-semibold">{org.label}</span>
              <span className="text-blue-400"> · {org.code}</span>
              <br />
              <span className="text-blue-600">{code.code}</span>
              <span className="text-blue-400"> — {code.name}</span>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
          <button
            onClick={() => {
              if (org && code) { onAdd(org.label, org.code, code.code, code.name); onClose(); }
            }}
            disabled={!org || !code}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
            style={org && code ? { backgroundColor: "#1a3557", color: "#fff" } : { backgroundColor: "#e2e8f0", color: "#94a3b8" }}
          >
            Add to Plan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── section wrapper ───────────────────────────────────────────── */
function SectionWrapper({ title, dotColor, children }: { title: string; dotColor: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "#1a3557" }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
        <span className="font-bold text-white text-sm tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ─── initial data ──────────────────────────────────────────────── */
// requested = sum of OPEN quarters only (FY25 Q3+Q4 + FY26 Q1-Q3)
const INITIAL_LABOR: PlanRow[] = [
  { id: 1, label: "Nugent, Joseph Pat", sub: "U435310/CERL",
    fy25q1: 10000, fy25q2: 12000, fy25q3: 13000, fy25q4: 10000,
    fy26q1: 12000, fy26q2: 12000, fy26q3: 11000, fy26q4: 0,
    openCommitment: 3500, requested: 58000 },
  { id: 2, label: "Chen, David", sub: "U719203/CERL",
    fy25q1: 8000, fy25q2: 8000, fy25q3: 8000, fy25q4: 8000,
    fy26q1: 9000, fy26q2: 9000, fy26q3: 9000, fy26q4: 0,
    openCommitment: 2000, requested: 43000 },
  { id: 3, label: "Williams, Sandra K.", sub: "U920183/CERL",
    fy25q1: 6000, fy25q2: 7000, fy25q3: 7500, fy25q4: 6500,
    fy26q1: 7000, fy26q2: 7000, fy26q3: 6000, fy26q4: 0,
    openCommitment: 2500, requested: 34000 },
];

const INITIAL_TRAVEL: PlanRow[] = [
  { id: 4, label: "CERL", sub: "U435310",
    fy25q1: 3000, fy25q2: 3000, fy25q3: 4000, fy25q4: 3000,
    fy26q1: 4000, fy26q2: 4000, fy26q3: 3000, fy26q4: 0,
    openCommitment: 800, requested: 18000 },
  { id: 5, label: "ERDC Headquarters", sub: "U582094",
    fy25q1: 1500, fy25q2: 1500, fy25q3: 2000, fy25q4: 1500,
    fy26q1: 2000, fy26q2: 2000, fy26q3: 1500, fy26q4: 0,
    openCommitment: 400, requested: 9000 },
];

const INITIAL_CONTRACT: ContractRow[] = [
  { id: 6, org: "ERDC", orgCode: "U582094",
    contractCode: "ITSFTMAINT", contractName: "Software maintenance or support",
    fy25q1: 0, fy25q2: 15000, fy25q3: 20000, fy25q4: 20000,
    fy26q1: 18000, fy26q2: 18000, fy26q3: 17000, fy26q4: 0,
    openCommitment: 3000, requested: 93000 },
  { id: 7, org: "CERL", orgCode: "U435310",
    contractCode: "OTHCONSVC", contractName: "Private Sector contracts not otherwise classified",
    fy25q1: 25000, fy25q2: 25000, fy25q3: 25000, fy25q4: 25000,
    fy26q1: 20000, fy26q2: 20000, fy26q3: 20000, fy26q4: 0,
    openCommitment: 5000, requested: 110000 },
];

const INITIAL_OUTSOURCING: OutsourcingRow[] = [
  { id: 8, org: "ERDC", orgCode: "U582094",
    resourceCode: "WKBOTHCOE", resourceName: "Corps District (MIPR)",
    fy25q1: 10000, fy25q2: 10000, fy25q3: 10000, fy25q4: 10000,
    fy26q1: 8000, fy26q2: 8000, fy26q3: 8000, fy26q4: 0,
    openCommitment: 1500, requested: 44000 },
  { id: 9, org: "CERL", orgCode: "U435310",
    resourceCode: "SHOP/FACIL", resourceName: "OrderTrak",
    fy25q1: 5000, fy25q2: 5000, fy25q3: 5000, fy25q4: 5000,
    fy26q1: 4000, fy26q2: 4000, fy26q3: 4000, fy26q4: 0,
    openCommitment: 800, requested: 22000 },
];

/* ─── main page ─────────────────────────────────────────────────── */
export default function ProjectPlanning() {
  const { id } = useParams<{ id: string }>();
  const project = MOCK_PROJECTS.find((p) => p.id === id) ?? MOCK_PROJECTS[0];

  const [laborRows,      setLaborRows]      = useState<PlanRow[]>(INITIAL_LABOR);
  const [travelRows,     setTravelRows]     = useState<PlanRow[]>(INITIAL_TRAVEL);
  const [contractRows,   setContractRows]   = useState<ContractRow[]>(INITIAL_CONTRACT);
  const [outsourcingRows, setOutsourcingRows] = useState<OutsourcingRow[]>(INITIAL_OUTSOURCING);

  const [expandedLabor,      setExpandedLabor]      = useState<Set<number>>(new Set());
  const [expandedTravel,     setExpandedTravel]     = useState<Set<number>>(new Set());
  const [expandedContract,   setExpandedContract]   = useState<Set<number>>(new Set());
  const [expandedOutsourcing, setExpandedOutsourcing] = useState<Set<number>>(new Set());

  const [showLaborPicker,      setShowLaborPicker]      = useState(false);
  const [showTravelPicker,     setShowTravelPicker]     = useState(false);
  const [showContractPicker,   setShowContractPicker]   = useState(false);
  const [showOutsourcingPicker, setShowOutsourcingPicker] = useState(false);

  const toggleSet = (set: Set<number>, id: number): Set<number> => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  /* generic Q updater for PlanRow */
  function updatePlanQ(setRows: React.Dispatch<React.SetStateAction<PlanRow[]>>, id: number, field: keyof QData, val: number) {
    setRows((rows) => rows.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: val };
      // Re-clamp requested to [obligated, openWindowMax] since quarters may have changed
      return { ...updated, requested: clampRequested(r.requested, obligatedQ(updated), openWindowMax(updated)) };
    }));
  }

  /* generic Q updater for ContractRow / OutsourcingRow */
  function updateResourceQ<T extends QData & { id: number; requested: number }>(
    setRows: React.Dispatch<React.SetStateAction<T[]>>, id: number, field: keyof QData, val: number
  ) {
    setRows((rows) => rows.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: val };
      return { ...updated, requested: clampRequested(r.requested, obligatedQ(updated), openWindowMax(updated)) };
    }));
  }

  function updatePlanRequested(setRows: React.Dispatch<React.SetStateAction<PlanRow[]>>, id: number, val: number) {
    setRows((rows) => rows.map((r) => r.id === id ? { ...r, requested: val } : r));
  }

  function updateResourceRequested<T extends { id: number; requested: number }>(
    setRows: React.Dispatch<React.SetStateAction<T[]>>, id: number, val: number
  ) {
    setRows((rows) => rows.map((r) => r.id === id ? { ...r, requested: val } : r));
  }

  /* in-row org / code updaters for Contracting section */
  function updateContractOrg(id: number, org: string, orgCode: string) {
    setContractRows((rows) => rows.map((r) => r.id === id ? { ...r, org, orgCode } : r));
  }
  function updateContractCode(id: number, contractCode: string, contractName: string) {
    setContractRows((rows) => rows.map((r) => r.id === id ? { ...r, contractCode, contractName } : r));
  }

  /* in-row org / code updaters for Outsourcing section */
  function updateOutsourcingOrg(id: number, org: string, orgCode: string) {
    setOutsourcingRows((rows) => rows.map((r) => r.id === id ? { ...r, org, orgCode } : r));
  }
  function updateOutsourcingCode(id: number, resourceCode: string, resourceName: string) {
    setOutsourcingRows((rows) => rows.map((r) => r.id === id ? { ...r, resourceCode, resourceName } : r));
  }

  const addSectionHeader = (title: string, dotColor: string, onAdd: () => void, addLabel: string) => (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200" style={{ backgroundColor: "#1a3557" }}>
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
      <span className="font-bold text-white text-sm tracking-wide flex-1">{title}</span>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded transition-colors"
        style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.28)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)")}
        title={addLabel}
      >
        <Plus size={13} />
        {addLabel}
      </button>
    </div>
  );

  const tableWrap = (children: React.ReactNode) => (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%", minWidth: 780, fontSize: 13 }}>
        <colgroup>
          <col style={{ width: 220 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 115 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 115 }} />
          <col />
          <col style={{ width: 38 }} />
        </colgroup>
        {children}
      </table>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
        {/* breadcrumb bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight size={13} className="text-slate-300" />
            <Link href="/projects" className="hover:text-blue-600 transition-colors">Projects</Link>
            <ChevronRight size={13} className="text-slate-300" />
            <Link href={`/projects/${project.id}`} className="hover:text-blue-600 transition-colors">{project.number}</Link>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="font-semibold text-slate-700">Planning</span>
          </div>
          <Link href={`/projects/${project.id}/settings`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
            <Settings size={13} />
            Settings
          </Link>
        </div>

        {/* project info bar */}
        <div className="px-6 py-3 flex items-center gap-4" style={{ backgroundColor: "#1a3557" }}>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{project.number}</p>
            <p className="font-bold text-white truncate">{project.name}</p>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>Total TOA</p>
              <p className="font-bold text-base" style={{ color: "#fbbf24" }}>{fmt(project.budget)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>Plan Window</p>
              <p className="font-semibold text-sm text-white">FY25 + FY26 Q1-Q3</p>
            </div>
            <div className="text-right px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: "rgba(167,243,208,0.2)", color: "#6ee7b7", border: "1px solid rgba(167,243,208,0.3)" }}>
              FY25 Q3 — Plan Open
            </div>
          </div>
        </div>

        {/* column legend */}
        <div className="px-6 py-2 flex items-center gap-4 border-b border-slate-200 bg-white text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: AMBER_BG, border: "1px solid #fcd34d" }} />
            <span>Editable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: BLUE_BG, border: "1px solid #bfdbfe" }} />
            <span>Read-only (system data)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: "#64748b" }}>Request cannot be less than Obligated</span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* ── LABOR ── */}
          {showLaborPicker && (
            <AddRowModal
              title="Add Labor Resource"
              options={LABOR_OPTIONS}
              existingLabels={new Set(laborRows.map((r) => r.label))}
              onAdd={(items) => setLaborRows((rows) => [...rows, ...items.map(({ label, sub }) => ({
                id: uid(), label, sub: sub ?? "", ...emptyQ(), openCommitment: 0, requested: 0,
              }))])}
              onClose={() => setShowLaborPicker(false)}
            />
          )}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {addSectionHeader("LABOR", "#60a5fa", () => setShowLaborPicker(true), "+ Add Labor")}
            {tableWrap(
              <>
                <thead>
                  <ColHeaders nameHeader="Employee / Org Code" />
                </thead>
                <tbody>
                  {laborRows.map((row) => (
                    <PlanDataRow
                      key={row.id} row={row}
                      expanded={expandedLabor.has(row.id)}
                      onToggle={() => setExpandedLabor((s) => toggleSet(s, row.id))}
                      onUpdateQ={(id, f, v) => updatePlanQ(setLaborRows, id, f, v)}
                      onUpdateRequested={(id, v) => updatePlanRequested(setLaborRows, id, v)}
                      onDelete={(id) => setLaborRows((rows) => rows.filter((r) => r.id !== id))}
                    />
                  ))}
                  {laborRows.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400 italic">No labor resources added yet.</td></tr>
                  )}
                </tbody>
                <tfoot><TotalsRow rows={laborRows} /></tfoot>
              </>
            )}
          </div>

          {/* ── TRAVEL ── */}
          {showTravelPicker && (
            <AddRowModal
              title="Add Travel Resource"
              options={TRAVEL_OPTIONS}
              existingLabels={new Set(travelRows.map((r) => r.label))}
              onAdd={(items) => setTravelRows((rows) => [...rows, ...items.map(({ label, sub }) => ({
                id: uid(), label, sub: sub ?? "", ...emptyQ(), openCommitment: 0, requested: 0,
              }))])}
              onClose={() => setShowTravelPicker(false)}
            />
          )}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {addSectionHeader("TRAVEL", "#a78bfa", () => setShowTravelPicker(true), "+ Add Travel")}
            {tableWrap(
              <>
                <thead><ColHeaders nameHeader="Organization" /></thead>
                <tbody>
                  {travelRows.map((row) => (
                    <PlanDataRow
                      key={row.id} row={row}
                      expanded={expandedTravel.has(row.id)}
                      onToggle={() => setExpandedTravel((s) => toggleSet(s, row.id))}
                      onUpdateQ={(id, f, v) => updatePlanQ(setTravelRows, id, f, v)}
                      onUpdateRequested={(id, v) => updatePlanRequested(setTravelRows, id, v)}
                      onDelete={(id) => setTravelRows((rows) => rows.filter((r) => r.id !== id))}
                    />
                  ))}
                  {travelRows.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400 italic">No travel resources added yet.</td></tr>
                  )}
                </tbody>
                <tfoot><TotalsRow rows={travelRows} /></tfoot>
              </>
            )}
          </div>

          {/* ── CONTRACTING ── */}
          {showContractPicker && (
            <TwoStepAddModal
              title="Add Contracting Resource"
              codes={CONTRACT_CODES}
              onAdd={(org, orgCode, contractCode, contractName) =>
                setContractRows((rows) => [...rows, {
                  id: uid(), org, orgCode, contractCode, contractName,
                  ...emptyQ(), openCommitment: 0, requested: 0,
                }])
              }
              onClose={() => setShowContractPicker(false)}
            />
          )}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {addSectionHeader("CONTRACTING", "#34d399", () => setShowContractPicker(true), "+ Add Contract")}
            {tableWrap(
              <>
                <thead><ColHeaders nameHeader="Org / Contract Code" /></thead>
                <tbody>
                  {contractRows.map((row) => (
                    <ResourceDataRow
                      key={row.id} row={row}
                      line2={`${row.contractCode} — ${row.contractName}`}
                      expanded={expandedContract.has(row.id)}
                      onToggle={() => setExpandedContract((s) => toggleSet(s, row.id))}
                      onUpdateQ={(id, f, v) => updateResourceQ(setContractRows, id, f, v)}
                      onUpdateRequested={(id, v) => updateResourceRequested(setContractRows, id, v)}
                      onDelete={(id) => setContractRows((rows) => rows.filter((r) => r.id !== id))}
                      orgOptions={ORG_OPTIONS}
                      codeOptions={CONTRACT_CODES}
                      currentCode={row.contractName}
                      onUpdateOrg={updateContractOrg}
                      onUpdateCode={updateContractCode}
                    />
                  ))}
                  {contractRows.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400 italic">No contracting resources added yet.</td></tr>
                  )}
                </tbody>
                <tfoot><TotalsRow rows={contractRows} /></tfoot>
              </>
            )}
          </div>

          {/* ── OUTSOURCING & OTHER ── */}
          {showOutsourcingPicker && (
            <TwoStepAddModal
              title="Add Outsourcing & Other Resource"
              codes={OUTSOURCING_CODES}
              onAdd={(org, orgCode, resourceCode, resourceName) =>
                setOutsourcingRows((rows) => [...rows, {
                  id: uid(), org, orgCode, resourceCode, resourceName,
                  ...emptyQ(), openCommitment: 0, requested: 0,
                }])
              }
              onClose={() => setShowOutsourcingPicker(false)}
            />
          )}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {addSectionHeader("OUTSOURCING & OTHER", "#f59e0b", () => setShowOutsourcingPicker(true), "+ Add Resource")}
            {tableWrap(
              <>
                <thead><ColHeaders nameHeader="Org / Resource Code" /></thead>
                <tbody>
                  {outsourcingRows.map((row) => (
                    <ResourceDataRow
                      key={row.id} row={row}
                      line2={`${row.resourceCode} — ${row.resourceName}`}
                      expanded={expandedOutsourcing.has(row.id)}
                      onToggle={() => setExpandedOutsourcing((s) => toggleSet(s, row.id))}
                      onUpdateQ={(id, f, v) => updateResourceQ(setOutsourcingRows, id, f, v)}
                      onUpdateRequested={(id, v) => updateResourceRequested(setOutsourcingRows, id, v)}
                      onDelete={(id) => setOutsourcingRows((rows) => rows.filter((r) => r.id !== id))}
                      orgOptions={ORG_OPTIONS}
                      codeOptions={OUTSOURCING_CODES}
                      currentCode={row.resourceName}
                      onUpdateOrg={updateOutsourcingOrg}
                      onUpdateCode={updateOutsourcingCode}
                    />
                  ))}
                  {outsourcingRows.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400 italic">No outsourcing resources added yet.</td></tr>
                  )}
                </tbody>
                <tfoot><TotalsRow rows={outsourcingRows} /></tfoot>
              </>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
