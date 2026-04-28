import React, { useState, useRef } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight, ChevronDown, Settings, Plus, Trash2, X, MinusCircle, CalendarRange, Copy, Check, Info } from "lucide-react";
import { MOCK_PROJECTS, Project } from "@/lib/mockData";
import Layout from "@/components/Layout";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";

/* ─── helpers ─────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

let _uid = 100;
const uid = () => ++_uid;

/* ─── fiscal window config ──────────────────────────────────────────
 *  planHorizonFY  = full planning span (all FYs shown in quarterly grid)
 *  requestMaxFY/Q = the open FUNDING REQUEST window (request math only)
 *  Editability in the quarterly grid spans the FULL plan horizon.
 *  Request Max is limited to the open request window only.
 * ─────────────────────────────────────────────────────────────────── */
type QKey = keyof QData;

const ALL_QKEYS: QKey[] = [
  "fy25q1","fy25q2","fy25q3","fy25q4",
  "fy26q1","fy26q2","fy26q3","fy26q4",
  "fy27q1","fy27q2","fy27q3","fy27q4",
  "fy28q1","fy28q2","fy28q3","fy28q4",
  "fy29q1","fy29q2","fy29q3","fy29q4",
];

interface FiscalWindowConfig {
  currentFY:        number; // 2-digit FY, e.g. 25 = FY25
  currentQ:         number; // 1-4
  requestMaxFY:     number; // last FY in the open FUNDING REQUEST window
  requestMaxQ:      number; // last quarter in the open request window
  planHorizonFY:    number; // last FY in the planning grid (full project span)
  nearQtrEndDays:   number; // threshold to auto-open next request quarter
  daysUntilQtrEnd:  number; // days until current quarter closes
}

// Demo snapshot: FY26 Q3 is current; past = FY25 Q1–Q4 + FY26 Q1–Q2 (6 quarters)
// Request window = FY26 Q3 – FY28 Q2 (8 quarters, ~80k ceiling for Nugent)
const FISCAL_CONFIG: FiscalWindowConfig = {
  currentFY:       26,
  currentQ:        3,
  requestMaxFY:    28,
  requestMaxQ:     2,
  planHorizonFY:   29,
  nearQtrEndDays:  30,
  daysUntilQtrEnd: 64,
};

function buildQWindow(cfg: FiscalWindowConfig): { past: QKey[]; requestWindow: QKey[] } {
  const autoOpenNext = cfg.daysUntilQtrEnd <= cfg.nearQtrEndDays;
  const past: QKey[] = [];
  const requestWindow: QKey[] = [];

  for (const k of ALL_QKEYS) {
    const fyNum = parseInt(k.slice(2, 4), 10);
    const qNum  = parseInt(k.slice(5),    10);

    const isPast = fyNum < cfg.currentFY || (fyNum === cfg.currentFY && qNum < cfg.currentQ);
    const maxQAdj = cfg.requestMaxQ + (autoOpenNext ? 1 : 0);
    const inRequest = !isPast && (
      fyNum < cfg.requestMaxFY || (fyNum === cfg.requestMaxFY && qNum <= maxQAdj)
    );

    if (isPast) past.push(k);
    else if (inRequest) requestWindow.push(k);
  }
  return { past, requestWindow };
}

const { past: PAST_QKEYS, requestWindow: REQUEST_WINDOW_KEYS } = buildQWindow(FISCAL_CONFIG);

// All non-past quarters are editable for planning (full project horizon)
const EDITABLE_QKEYS: QKey[] = ALL_QKEYS.filter((k) => !PAST_QKEYS.includes(k));

// Derived banner labels
const { currentFY: CFY, currentQ: CQ, requestMaxFY: RFY, requestMaxQ: RQ, planHorizonFY: PHY } = FISCAL_CONFIG;
const PLAN_WINDOW_LABEL = `FY${CFY}–FY${PHY}`;
const PLAN_STATUS_LABEL = `FY${CFY} Q${CQ} — Plan Open`;

/* ─── resource code tables ─────────────────────────────────────── */
// ERDC Labs — sourced from labRates reference table
const ERDC_LABS = [
  { label: "GRL",         code: "U439000" }, // Geospatial Research Laboratory
  { label: "CHL",         code: "U430000" }, // Coastal & Hydraulics Lab
  { label: "EL",          code: "U433000" }, // Environmental Laboratory
  { label: "CERL",        code: "U435000" }, // Construction Eng Research Lab
  { label: "GSL",         code: "U438000" }, // Geotechnical & Structures Lab
  { label: "ITL",         code: "U43400"  }, // Information Technology Lab
  { label: "CTS",         code: "U4P0000" }, // Contracting Office
  { label: "CRRL",        code: "U437000" }, // Cold Regions Research Eng Lab
  { label: "OTHER ERDC",  code: "U400000" }, // USA Engineer Research Dev Ctr
  { label: "HPC",         code: "U440000" }, // High Processing Computer
];

// USACE Districts — for MIPRs and cross-district work
const DISTRICT_OPTIONS = [
  { label: "HQ USACE",                        code: "W0100ER" },
  { label: "Institute for Water Resources",    code: "W4110ER" },
  { label: "Buffalo District",                 code: "W073ER0" },
  { label: "Chicago District",                 code: "W074ER0" },
  { label: "Detroit District",                 code: "W075ER0" },
  { label: "Memphis District",                 code: "W060ER0" },
  { label: "New Orleans District",             code: "W912ER0" },
  { label: "Baltimore District",               code: "W912B00" },
  { label: "Philadelphia District",            code: "W912BU0" },
  { label: "Kansas City District",             code: "W912DQ0" },
  { label: "Alaska District",                  code: "W911KB0" },
  { label: "Sacramento District",              code: "W912PP0" },
  { label: "Jacksonville District",            code: "W912EP0" },
  { label: "South Pacific Division",           code: "W912P20" },
  { label: "Los Angeles District",             code: "W912PL0" },
  { label: "Fort Worth District",              code: "W912EQ0" },
  { label: "Galveston District",               code: "W912GV0" },
  { label: "Transatlantic Division",           code: "W912TA0" },
];

// Combined flat list (used for lookups)
const ORG_OPTIONS = [...ERDC_LABS, ...DISTRICT_OPTIONS];

/* ─── ERDC overhead / Flex-4 tables ───────────────────────────── */
// ADD_ON_RATE per lab (from labRates screenshot): used for OH split in Create Request modal
const ERDC_OH_RATES: Record<string, number> = {
  "U439000": 0.25, // GRL
  "U430000": 0.28, // CHL
  "U433000": 0.28, // EL
  "U435000": 0.28, // CERL
  "U438000": 0.28, // GSL
  "U43400":  0.29, // ITL
  "U4P0000": 0.00, // CTS
  "U437000": 0.39, // CRRL (note: labRates shows CRREL — same code)
  "U400000": 0.00, // OTHER ERDC
  "U440000": 0.43, // HPC
};

// True only for ERDC org codes (districts are W-prefix — no OH breakout)
const isErdcCode = (code: string) => code in ERDC_OH_RATES;

// Flex-4 = 3% off the top; OH split on remaining 97%
// All internal math in INTEGER CENTS to avoid floating-point drift; output converted back to dollars
const _f4Cents   = (reqCents: number) => Math.round(reqCents * 0.03);
const _lbCents   = (remCents: number, ohRate: number) => Math.floor(remCents / (1 + ohRate));
const _ohCents   = (remCents: number, ohRate: number) => Math.floor(_lbCents(remCents, ohRate) * ohRate);
const _frbCents  = (remCents: number, ohRate: number) => remCents - _lbCents(remCents, ohRate) - _ohCents(remCents, ohRate);

const flex4Amount    = (req: number) => _f4Cents(Math.round(req * 100)) / 100;
const flex4Remaining = (req: number) => req - flex4Amount(req);
const labBase        = (rem: number, ohRate: number) => _lbCents(Math.round(rem * 100), ohRate) / 100;
const ohAmount       = (rem: number, ohRate: number) => _ohCents(Math.round(rem * 100), ohRate) / 100;
const frb            = (rem: number, ohRate: number) => _frbCents(Math.round(rem * 100), ohRate) / 100;

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
  // ERDC employees
  { label: "Nugent, Joseph Pat",   sub: "U435000/CERL" },
  { label: "Chen, David",          sub: "U435000/CERL" },
  { label: "Williams, Sandra K.",  sub: "U438000/GSL"  },
  { label: "Torres, Miguel A.",    sub: "U430000/CHL"  },
  { label: "Park, Jennifer",       sub: "U433000/EL"   },
  { label: "Harrison, Mark T.",    sub: "U439000/GRL"  },
  { label: "Okafor, Chioma",       sub: "U437000/CRRL" },
  { label: "Reyes, Carlos",        sub: "U43400/ITL"   },
  { label: "Placeholder — TBD",    sub: "— name/org code pending" },
  // District personnel (name TBD — one slot per district)
  { label: "HQ USACE Personnel — TBD",                      sub: "W0100ER/HQ USACE"   },
  { label: "Inst. for Water Resources Personnel — TBD",      sub: "W4110ER/IWR"        },
  { label: "Buffalo District Personnel — TBD",               sub: "W073ER0/Buffalo"    },
  { label: "Chicago District Personnel — TBD",               sub: "W074ER0/Chicago"    },
  { label: "Detroit District Personnel — TBD",               sub: "W075ER0/Detroit"    },
  { label: "Memphis District Personnel — TBD",               sub: "W060ER0/Memphis"    },
  { label: "New Orleans District Personnel — TBD",           sub: "W912ER0/New Orleans"},
  { label: "Baltimore District Personnel — TBD",             sub: "W912B00/Baltimore"  },
  { label: "Philadelphia District Personnel — TBD",          sub: "W912BU0/Philadelphia"},
  { label: "Kansas City District Personnel — TBD",           sub: "W912DQ0/Kansas City"},
  { label: "Alaska District Personnel — TBD",                sub: "W911KB0/Alaska"     },
  { label: "Sacramento District Personnel — TBD",            sub: "W912PP0/Sacramento" },
  { label: "Jacksonville District Personnel — TBD",          sub: "W912EP0/Jacksonville"},
  { label: "South Pacific Division Personnel — TBD",         sub: "W912P20/South Pacific"},
  { label: "Los Angeles District Personnel — TBD",           sub: "W912PL0/Los Angeles"},
  { label: "Fort Worth District Personnel — TBD",            sub: "W912EQ0/Fort Worth" },
  { label: "Galveston District Personnel — TBD",             sub: "W912GV0/Galveston"  },
  { label: "Transatlantic Division Personnel — TBD",         sub: "W912TA0/Transatlantic"},
];

const TRAVEL_OPTIONS = [
  // ERDC labs
  { label: "CERL",        sub: "U435000" },
  { label: "CHL",         sub: "U430000" },
  { label: "EL",          sub: "U433000" },
  { label: "GSL",         sub: "U438000" },
  { label: "GRL",         sub: "U439000" },
  { label: "ITL",         sub: "U43400"  },
  { label: "CRRL",        sub: "U437000" },
  { label: "OTHER ERDC",  sub: "U400000" },
  { label: "HPC",         sub: "U440000" },
  // Districts
  { label: "HQ USACE",                     sub: "W0100ER" },
  { label: "Institute for Water Resources", sub: "W4110ER" },
  { label: "Buffalo District",              sub: "W073ER0" },
  { label: "Chicago District",              sub: "W074ER0" },
  { label: "Detroit District",              sub: "W075ER0" },
  { label: "Memphis District",              sub: "W060ER0" },
  { label: "New Orleans District",          sub: "W912ER0" },
  { label: "Baltimore District",            sub: "W912B00" },
  { label: "Philadelphia District",         sub: "W912BU0" },
  { label: "Kansas City District",          sub: "W912DQ0" },
  { label: "Alaska District",               sub: "W911KB0" },
  { label: "Sacramento District",           sub: "W912PP0" },
  { label: "Jacksonville District",         sub: "W912EP0" },
  { label: "South Pacific Division",        sub: "W912P20" },
  { label: "Los Angeles District",          sub: "W912PL0" },
  { label: "Fort Worth District",           sub: "W912EQ0" },
  { label: "Galveston District",            sub: "W912GV0" },
  { label: "Transatlantic Division",        sub: "W912TA0" },
];

/* ─── types ────────────────────────────────────────────────────── */
type QData = {
  fy25q1: number; fy25q2: number; fy25q3: number; fy25q4: number;
  fy26q1: number; fy26q2: number; fy26q3: number; fy26q4: number;
  fy27q1: number; fy27q2: number; fy27q3: number; fy27q4: number;
  fy28q1: number; fy28q2: number; fy28q3: number; fy28q4: number;
  fy29q1: number; fy29q2: number; fy29q3: number; fy29q4: number;
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
// Total Planned = sum of ALL quarters across full 5-FY planning horizon
const sumAll = (r: QData) => ALL_QKEYS.reduce((s, k) => s + r[k], 0);

// Obligated = sum of PAST quarters only (already paid, locked)
const obligatedQ = (r: QData) => PAST_QKEYS.reduce((s, k) => s + r[k], 0);

// Planned Remaining = sum of all EDITABLE (non-past) quarters = full project remainder
const plannedRem = (r: QData) => EDITABLE_QKEYS.reduce((s, k) => s + r[k], 0);

// Current quarter key — the single open quarter driving the request ceiling
const CURRENT_Q_KEY: QKey = `fy${CFY}q${CQ}` as QKey;

// Request Max = obligated (past quarters) + current quarter planned amount
// e.g. Nugent: $69k obligated + $11k FY26 Q3 = $80k max
const openWindowMax = (r: QData) => obligatedQ(r) + r[CURRENT_Q_KEY];

// Clamp requested to [obligated, openWindowMax].
// Lower bound = obligated: cannot request less than already-paid quarters.
// Upper bound = openWindowMax: cannot request beyond the open quarter window.
function clampRequested(requested: number, obligated: number, max: number): number {
  const lo = Math.min(obligated, max); // guard: if max < obligated (edge case), lock to max
  return Math.max(lo, Math.min(requested, max));
}

/* ─── empty row factories ───────────────────────────────────────── */
const emptyQ = (): QData => ({
  fy25q1: 0, fy25q2: 0, fy25q3: 0, fy25q4: 0,
  fy26q1: 0, fy26q2: 0, fy26q3: 0, fy26q4: 0,
  fy27q1: 0, fy27q2: 0, fy27q3: 0, fy27q4: 0,
  fy28q1: 0, fy28q2: 0, fy28q3: 0, fy28q4: 0,
  fy29q1: 0, fy29q2: 0, fy29q3: 0, fy29q4: 0,
});

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
const Q_META: Record<QKey, { fy: string; q: number; range: string }> = {
  fy25q1: { fy: "FY25", q: 1, range: "Oct–Dec" },
  fy25q2: { fy: "FY25", q: 2, range: "Jan–Mar" },
  fy25q3: { fy: "FY25", q: 3, range: "Apr–Jun" },
  fy25q4: { fy: "FY25", q: 4, range: "Jul–Sep" },
  fy26q1: { fy: "FY26", q: 1, range: "Oct–Dec" },
  fy26q2: { fy: "FY26", q: 2, range: "Jan–Mar" },
  fy26q3: { fy: "FY26", q: 3, range: "Apr–Jun" },
  fy26q4: { fy: "FY26", q: 4, range: "Jul–Sep" },
  fy27q1: { fy: "FY27", q: 1, range: "Oct–Dec" },
  fy27q2: { fy: "FY27", q: 2, range: "Jan–Mar" },
  fy27q3: { fy: "FY27", q: 3, range: "Apr–Jun" },
  fy27q4: { fy: "FY27", q: 4, range: "Jul–Sep" },
  fy28q1: { fy: "FY28", q: 1, range: "Oct–Dec" },
  fy28q2: { fy: "FY28", q: 2, range: "Jan–Mar" },
  fy28q3: { fy: "FY28", q: 3, range: "Apr–Jun" },
  fy28q4: { fy: "FY28", q: 4, range: "Jul–Sep" },
  fy29q1: { fy: "FY29", q: 1, range: "Oct–Dec" },
  fy29q2: { fy: "FY29", q: 2, range: "Jan–Mar" },
  fy29q3: { fy: "FY29", q: 3, range: "Apr–Jun" },
  fy29q4: { fy: "FY29", q: 4, range: "Jul–Sep" },
};

const FY_GROUPS = ALL_QKEYS.reduce<Record<string, QKey[]>>((acc, k) => {
  const fy = Q_META[k].fy;
  if (!acc[fy]) acc[fy] = [];
  acc[fy].push(k);
  return acc;
}, {});
const FY_LABELS = Object.keys(FY_GROUPS);
const QUARTER_NUMS = [1, 2, 3, 4];
const Q_RANGES = ["Oct–Dec", "Jan–Mar", "Apr–Jun", "Jul–Sep"];

// "past" = obligated/locked (blue); "editable" = plannable (gold)
const PAST_SET = new Set<string>(PAST_QKEYS);
const qStatus = (k: string): "past" | "editable" => PAST_SET.has(k) ? "past" : "editable";

function QuarterlyPanel({
  row, onUpdateQ,
}: {
  row: QData & { id: number };
  onUpdateQ: (id: number, field: keyof QData, val: number) => void;
}) {
  const pastStyle: React.CSSProperties = { backgroundColor: BLUE_BG, color: "#1e40af", fontWeight: 500 };
  const editStyle: React.CSSProperties = { backgroundColor: AMBER_BG };
  const cellPad: React.CSSProperties   = { paddingTop: 3, paddingBottom: 3, paddingRight: 6, borderRadius: 3 };

  return (
    <div style={{ borderTop: "2px solid #1a6ea8", background: "linear-gradient(to bottom, #f0f4f8, #f8fafc)", padding: "0 0 12px 0" }}>
      <div style={{ background: "#1a3557", padding: "5px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Quarterly Breakdown
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: "#93c5fd", opacity: 0.7 }}>
          {PAST_QKEYS.length} quarters obligated · Request window FY{CFY} Q{CQ}–FY{RFY} Q{RQ}
        </span>
      </div>
      <div style={{ padding: "10px 16px 0", overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", tableLayout: "fixed", minWidth: 520 }}>
          <thead>
            <tr>
              <th style={{ width: 60, textAlign: "left", color: "#475569", fontWeight: 700, paddingBottom: 6, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em" }}>
                Year
              </th>
              {QUARTER_NUMS.map((qn) => {
                const repKey = `fy25q${qn}` as QKey;
                const st = qStatus(repKey);
                const labelColor = st === "past" ? "#1e40af" : "#78350f";
                return (
                  <th key={qn} style={{ textAlign: "right", paddingBottom: 6, paddingRight: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: labelColor, textTransform: "uppercase" }}>
                      Q{qn} {Q_RANGES[qn - 1]}
                    </span>
                  </th>
                );
              })}
              <th style={{ width: 90, textAlign: "right", paddingBottom: 6, borderLeft: "1px solid #cbd5e1", paddingLeft: 8, paddingRight: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1a6ea8", textTransform: "uppercase" }}>FY Total</span>
              </th>
              <th style={{ width: 24 }} />
            </tr>
          </thead>
          <tbody>
            {FY_LABELS.map((fy, fyIdx) => {
              const fyKeys = FY_GROUPS[fy];
              const fyTotal = fyKeys.reduce((s, k) => s + row[k], 0);
              const hasEditable = fyKeys.some((k) => qStatus(k) === "editable");
              const editableInFY = fyKeys.filter((k) => qStatus(k) === "editable");
              return (
                <tr key={fy} style={{ borderTop: "1px solid #e2e8f0", background: fyIdx % 2 === 1 ? "rgba(255,255,255,0.55)" : undefined }}>
                  <td style={{ paddingTop: 4, paddingBottom: 4, fontWeight: 700, color: "#1a3557", fontSize: 12 }}>{fy}</td>
                  {QUARTER_NUMS.map((qn) => {
                    const key = `${fy.toLowerCase()}q${qn}` as QKey;
                    const st  = qStatus(key);
                    if (st === "past") {
                      return (
                        <td key={qn} style={{ ...pastStyle, ...cellPad }}>
                          <AmtDisplay value={row[key]} />
                        </td>
                      );
                    }
                    return (
                      <td key={qn} style={{ ...editStyle, ...cellPad }}>
                        <AmtInput value={row[key]} onChange={(v) => onUpdateQ(row.id, key, v)} gold />
                      </td>
                    );
                  })}
                  {/* FY Total — editable if year has any editable quarters; spread-fills across them */}
                  <td style={{ paddingTop: 2, paddingBottom: 2, borderLeft: "1px solid #cbd5e1", paddingLeft: 6, paddingRight: 6, backgroundColor: hasEditable ? AMBER_TOTAL : BLUE_TOTAL }}>
                    {hasEditable ? (
                      <AmtInput
                        value={fyTotal}
                        gold
                        onChange={(newTotal) => {
                          const obligatedInFY = fyKeys
                            .filter((k) => qStatus(k) === "past")
                            .reduce((s, k) => s + row[k], 0);
                          const remaining = Math.max(0, newTotal - obligatedInFY);
                          const perQ = Math.floor(remaining / editableInFY.length);
                          const rem  = remaining - perQ * editableInFY.length;
                          editableInFY.forEach((k, i) => onUpdateQ(row.id, k, perQ + (i === 0 ? rem : 0)));
                        }}
                      />
                    ) : (
                      <AmtDisplay value={fyTotal} bold />
                    )}
                  </td>
                  {/* Clear-year button — zeros editable quarters in this FY only */}
                  <td style={{ paddingTop: 0, paddingBottom: 0, paddingLeft: 2, paddingRight: 0, verticalAlign: "middle" }}>
                    {hasEditable ? (
                      <button
                        onClick={() => editableInFY.forEach((k) => onUpdateQ(row.id, k, 0))}
                        title={`Clear ${fy} — zero editable quarters only`}
                        className="rounded transition-colors text-slate-300 hover:text-slate-500 hover:bg-slate-100"
                        style={{ width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, lineHeight: 1 }}
                      >
                        /
                      </button>
                    ) : (
                      <span style={{ width: 20, display: "inline-block" }} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* TOTAL row — per-quarter column sums + editable grand total with full spread-fill */}
          <tfoot>
            <tr style={{ borderTop: "2px solid #94a3b8" }}>
              <td style={{ paddingTop: 4, paddingBottom: 4, fontWeight: 700, color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</td>
              {QUARTER_NUMS.map((qn) => {
                const qSum = FY_LABELS.reduce((s, fy) => {
                  const key = `${fy.toLowerCase()}q${qn}` as QKey;
                  return s + row[key];
                }, 0);
                return (
                  <td key={qn} style={{ paddingTop: 3, paddingBottom: 3, paddingRight: 6, textAlign: "right", fontWeight: 700, fontSize: 12, color: "#1a3557" }} className="tabular-nums">
                    {fmt(qSum)}
                  </td>
                );
              })}
              {/* Grand total — editable; spread-fills (newTotal - obligated) across EDITABLE_QKEYS */}
              <td style={{ paddingTop: 2, paddingBottom: 2, borderLeft: "1px solid #94a3b8", paddingLeft: 6, paddingRight: 6, backgroundColor: AMBER_TOTAL }}>
                <AmtInput
                  value={sumAll(row)}
                  gold
                  onChange={(newTotal) => {
                    const obligatedTotal = PAST_QKEYS.reduce((s, k) => s + row[k], 0);
                    const remaining = Math.max(0, newTotal - obligatedTotal);
                    const perQ = Math.floor(remaining / EDITABLE_QKEYS.length);
                    const rem  = remaining - perQ * EDITABLE_QKEYS.length;
                    EDITABLE_QKEYS.forEach((k, i) => onUpdateQ(row.id, k, perQ + (i === 0 ? rem : 0)));
                  }}
                />
              </td>
              <td />
            </tr>
          </tfoot>
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
      <th className={hd} style={{ backgroundColor: AMBER_TOTAL, color: "#78350f", borderLeft: AMBER_BORDER, width: 260 }}
        title="The editable request amount for this line, alongside the maximum allowed (Obligated + current quarter). Requests may not exceed the maximum.">
        Request / Max
      </th>
      <th style={{ width: 38, backgroundColor: "#f1f5f9", borderLeft: "1px solid #e2e8f0" }} />
    </tr>
  );
}

/* ─── single data row (Labor / Travel) ─────────────────────────── */
function PlanDataRow({
  row, isEven, expanded, onToggle, onUpdateQ, onUpdateRequested, onDelete,
}: {
  row: PlanRow;
  isEven?: boolean;
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
        <td className="px-2 py-2" style={{ backgroundColor: isEven ? "#f8fafc" : "#ffffff" }}>
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
        {/* Total Planned — gold, spread-fill editable (distributes delta across EDITABLE_QKEYS) */}
        <td className="px-3 py-2" style={{ backgroundColor: AMBER_BG, borderLeft: AMBER_BORDER }}>
          <AmtInput
            value={planned}
            gold
            onChange={(newTotal) => {
              const delta = newTotal - obligated;
              const perQ = delta > 0 ? Math.floor(delta / EDITABLE_QKEYS.length) : 0;
              const rem  = delta > 0 ? delta - perQ * EDITABLE_QKEYS.length : 0;
              EDITABLE_QKEYS.forEach((q, i) => onUpdateQ(row.id, q, perQ + (i === 0 ? rem : 0)));
            }}
          />
        </td>
        {/* Obligated — blue, read-only (PAST quarters sum) */}
        <td className={td} style={{ backgroundColor: BLUE_BG, borderLeft: "2px solid #475569" }}>
          <AmtDisplay value={obligated} />
        </td>
        {/* Planned Remaining — blue, read-only (all EDITABLE quarters sum) */}
        <td className={td} style={{ backgroundColor: BLUE_BG, borderLeft: BLUE_BORDER }}>
          <AmtDisplay value={remaining} />
        </td>
        {/* Open Commitment — blue, read-only */}
        <td className={td} style={{ backgroundColor: BLUE_BG, borderLeft: BLUE_BORDER }}>
          <AmtDisplay value={row.openCommitment} />
        </td>
        {/* Request / Max — gold, editable; clamped to [obligated, openWindowMax] */}
        <td className="px-3 py-2" style={{ backgroundColor: AMBER_BG, borderLeft: AMBER_BORDER }}>
          <div className="flex items-center gap-2" style={{ justifyContent: "flex-end" }}>
            <div style={{ flex: "0 0 130px" }}>
              <AmtInput
                value={row.requested}
                min={obligated}
                max={maxReq}
                gold
                onChange={(v) => onUpdateRequested(row.id, clampRequested(v, obligated, maxReq))}
              />
            </div>
            <span className="text-sm font-semibold tabular-nums whitespace-nowrap" style={{ color: "#92400e", minWidth: 90, textAlign: "right" }}>
              / {maxReq === 0 ? "—" : fmt(maxReq)}
            </span>
          </div>
        </td>
        <td style={{ padding: 0, textAlign: "center", verticalAlign: "middle", borderLeft: "1px solid #e2e8f0", backgroundColor: isEven ? "#f1f5f9" : "#f8fafc" }}>
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
              onClick={() => {
                EDITABLE_QKEYS.forEach((q) => onUpdateQ(row.id, q, 0));
                onUpdateRequested(row.id, obligated);
              }}
              title="Reset — set planned and request back to obligated amount"
              className="rounded transition-colors text-slate-300 hover:text-amber-500 hover:bg-amber-50"
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
  row, line2, subCode, isEven, expanded, onToggle, onUpdateQ, onUpdateRequested, onDelete,
  orgOptions, codeOptions, currentCode, onUpdateOrg, onUpdateCode,
}: {
  row: T;
  line2: string;
  subCode?: string;
  isEven?: boolean;
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

  return (
    <React.Fragment>
      <tr style={{ borderBottom: expanded ? "none" : "1px solid #f1f5f9" }}>
        <td className="px-2 py-2" style={{ backgroundColor: isEven ? "#f8fafc" : "#ffffff" }}>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggle}
              className="flex-shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 leading-snug truncate" title={line2}>{line2}</p>
              <p className="text-xs text-slate-400 leading-snug truncate mt-0.5">
                {row.orgCode}{subCode ? <span className="font-mono ml-1">· {subCode}</span> : null}
              </p>
            </div>
          </div>
        </td>
        {/* Total Planned — gold, spread-fill editable (distributes delta across EDITABLE_QKEYS) */}
        <td className="px-3 py-2" style={{ backgroundColor: AMBER_BG, borderLeft: AMBER_BORDER }}>
          <AmtInput
            value={planned}
            gold
            onChange={(newTotal) => {
              const delta = newTotal - obligated;
              const perQ = delta > 0 ? Math.floor(delta / EDITABLE_QKEYS.length) : 0;
              const rem  = delta > 0 ? delta - perQ * EDITABLE_QKEYS.length : 0;
              EDITABLE_QKEYS.forEach((q, i) => onUpdateQ(row.id, q, perQ + (i === 0 ? rem : 0)));
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
        {/* Request / Max — clamped to [obligated, openWindowMax (request window)] */}
        <td className="px-3 py-2" style={{ backgroundColor: AMBER_BG, borderLeft: AMBER_BORDER }}>
          <div className="flex items-center gap-2" style={{ justifyContent: "flex-end" }}>
            <div style={{ flex: "0 0 130px" }}>
              <AmtInput
                value={row.requested}
                min={obligated}
                max={maxReq}
                gold
                onChange={(v) => onUpdateRequested(row.id, clampRequested(v, obligated, maxReq))}
              />
            </div>
            <span className="text-sm font-semibold tabular-nums whitespace-nowrap" style={{ color: "#92400e", minWidth: 90, textAlign: "right" }}>
              / {maxReq === 0 ? "—" : fmt(maxReq)}
            </span>
          </div>
        </td>
        <td style={{ padding: 0, textAlign: "center", verticalAlign: "middle", borderLeft: "1px solid #e2e8f0", backgroundColor: isEven ? "#f1f5f9" : "#f8fafc" }}>
          {canDelete ? (
            <button onClick={() => onDelete(row.id)} title="Remove row"
              className="rounded transition-colors text-slate-300 hover:text-red-400 hover:bg-red-50"
              style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={14} />
            </button>
          ) : (
            <button
              onClick={() => {
                EDITABLE_QKEYS.forEach((q) => onUpdateQ(row.id, q, 0));
                onUpdateRequested(row.id, obligated);
              }}
              title="Reset — set planned and request back to obligated amount"
              className="rounded transition-colors text-slate-300 hover:text-amber-500 hover:bg-amber-50"
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
  title, options, sections, existingLabels, onAdd, onClose,
}: {
  title: string;
  options?: { label: string; sub: string }[];
  sections?: { heading: string; items: { label: string; sub: string }[] }[];
  existingLabels: Set<string>;
  onAdd: (items: { label: string; sub: string }[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allItems: { label: string; sub: string }[] = sections
    ? sections.flatMap((s) => s.items)
    : (options ?? []);
  const avail = allItems.filter((o) => !existingLabels.has(o.label));
  const availSet = new Set(avail.map((o) => o.label));

  const toggle = (label: string) =>
    setSelected((prev) => { const next = new Set(prev); next.has(label) ? next.delete(label) : next.add(label); return next; });

  const renderItem = (opt: { label: string; sub: string }) => (
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
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(15,23,42,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ width: 460, maxHeight: "70vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: "#1a3557" }}>
          <span className="text-white font-semibold text-xs tracking-wide uppercase">{title}</span>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X size={15} /></button>
        </div>
        <ul className="overflow-y-auto" style={{ maxHeight: 340 }}>
          {sections ? (
            sections.map((sec) => {
              const secAvail = sec.items.filter((o) => availSet.has(o.label));
              if (secAvail.length === 0) return null;
              return (
                <li key={sec.heading}>
                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-b border-slate-200"
                    style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                    {sec.heading}
                  </div>
                  <ul>{secAvail.map(renderItem)}</ul>
                </li>
              );
            })
          ) : (
            avail.map(renderItem)
          )}
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
              <optgroup label="ERDC Labs">
                {ERDC_LABS.map((o) => (
                  <option key={o.label} value={o.label}>{o.label} ({o.code})</option>
                ))}
              </optgroup>
              <optgroup label="Districts">
                {DISTRICT_OPTIONS.map((o) => (
                  <option key={o.label} value={o.label}>{o.label} ({o.code})</option>
                ))}
              </optgroup>
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

/* ─── initial data (FY25–FY29 full planning horizon) ───────────── */
// requested = initial request within REQUEST_WINDOW_KEYS (FY26 Q3 – FY28 Q2)
const INITIAL_LABOR: PlanRow[] = [
  { id: 1, label: "Nugent, Joseph Pat", sub: "U435000/CERL",
    fy25q1: 10000, fy25q2: 12000, fy25q3: 13000, fy25q4: 10000,
    fy26q1: 12000, fy26q2: 12000, fy26q3: 11000, fy26q4: 10000,
    fy27q1: 11000, fy27q2: 11000, fy27q3: 11000, fy27q4: 11000,
    fy28q1: 10000, fy28q2: 10000, fy28q3: 10000, fy28q4: 10000,
    fy29q1:  8000, fy29q2:  8000, fy29q3:  8000, fy29q4:  8000,
    openCommitment: 4200, requested: 80000 },
  { id: 2, label: "Chen, David", sub: "U435000/CERL",
    fy25q1: 8000, fy25q2: 8000, fy25q3: 8000, fy25q4: 8000,
    fy26q1: 9000, fy26q2: 9000, fy26q3: 9000, fy26q4: 8000,
    fy27q1: 9000, fy27q2: 9000, fy27q3: 9000, fy27q4: 9000,
    fy28q1: 8000, fy28q2: 8000, fy28q3: 8000, fy28q4: 8000,
    fy29q1: 7000, fy29q2: 7000, fy29q3: 7000, fy29q4: 7000,
    openCommitment: 3100, requested: 35000 },
  { id: 3, label: "Williams, Sandra K.", sub: "U438000/GSL",
    fy25q1: 6000, fy25q2: 7000, fy25q3: 7500, fy25q4: 6500,
    fy26q1: 7000, fy26q2: 7000, fy26q3: 6000, fy26q4: 6000,
    fy27q1: 6000, fy27q2: 6000, fy27q3: 6000, fy27q4: 6000,
    fy28q1: 5000, fy28q2: 5000, fy28q3: 5000, fy28q4: 5000,
    fy29q1: 4000, fy29q2: 4000, fy29q3: 4000, fy29q4: 4000,
    openCommitment: 2200, requested: 24000 },
];

const INITIAL_TRAVEL: PlanRow[] = [
  { id: 4, label: "CERL", sub: "U435000",
    fy25q1: 3000, fy25q2: 3000, fy25q3: 4000, fy25q4: 3000,
    fy26q1: 4000, fy26q2: 4000, fy26q3: 3000, fy26q4: 3000,
    fy27q1: 3000, fy27q2: 3000, fy27q3: 3000, fy27q4: 3000,
    fy28q1: 2500, fy28q2: 2500, fy28q3: 2500, fy28q4: 2500,
    fy29q1: 2000, fy29q2: 2000, fy29q3: 2000, fy29q4: 2000,
    openCommitment: 900, requested: 12000 },
  { id: 5, label: "CHL", sub: "U430000",
    fy25q1: 1500, fy25q2: 1500, fy25q3: 2000, fy25q4: 1500,
    fy26q1: 2000, fy26q2: 2000, fy26q3: 1500, fy26q4: 1500,
    fy27q1: 1500, fy27q2: 1500, fy27q3: 1500, fy27q4: 1500,
    fy28q1: 1000, fy28q2: 1000, fy28q3: 1000, fy28q4: 1000,
    fy29q1: 1000, fy29q2: 1000, fy29q3: 1000, fy29q4: 1000,
    openCommitment: 450, requested: 6000 },
];

const INITIAL_CONTRACT: ContractRow[] = [
  { id: 6, org: "OTHER ERDC", orgCode: "U400000",
    contractCode: "ITSFTMAINT", contractName: "Software maintenance or support",
    fy25q1: 0, fy25q2: 15000, fy25q3: 20000, fy25q4: 20000,
    fy26q1: 18000, fy26q2: 18000, fy26q3: 17000, fy26q4: 17000,
    fy27q1: 16000, fy27q2: 16000, fy27q3: 16000, fy27q4: 16000,
    fy28q1: 15000, fy28q2: 15000, fy28q3: 15000, fy28q4: 15000,
    fy29q1: 12000, fy29q2: 12000, fy29q3: 12000, fy29q4: 12000,
    openCommitment: 8500, requested: 66000 },
  { id: 7, org: "CERL", orgCode: "U435000",
    contractCode: "OTHCONSVC", contractName: "Private Sector contracts not otherwise classified",
    fy25q1: 25000, fy25q2: 25000, fy25q3: 25000, fy25q4: 25000,
    fy26q1: 20000, fy26q2: 20000, fy26q3: 20000, fy26q4: 20000,
    fy27q1: 18000, fy27q2: 18000, fy27q3: 18000, fy27q4: 18000,
    fy28q1: 15000, fy28q2: 15000, fy28q3: 15000, fy28q4: 15000,
    fy29q1: 12000, fy29q2: 12000, fy29q3: 12000, fy29q4: 12000,
    openCommitment: 11000, requested: 76000 },
];

const INITIAL_OUTSOURCING: OutsourcingRow[] = [
  { id: 8, org: "OTHER ERDC", orgCode: "U400000",
    resourceCode: "WKBOTHCOE", resourceName: "Corps District (MIPR)",
    fy25q1: 10000, fy25q2: 10000, fy25q3: 10000, fy25q4: 10000,
    fy26q1: 8000, fy26q2: 8000, fy26q3: 8000, fy26q4: 8000,
    fy27q1: 7000, fy27q2: 7000, fy27q3: 7000, fy27q4: 7000,
    fy28q1: 6000, fy28q2: 6000, fy28q3: 6000, fy28q4: 6000,
    fy29q1: 5000, fy29q2: 5000, fy29q3: 5000, fy29q4: 5000,
    openCommitment: 3200, requested: 30000 },
  { id: 9, org: "CERL", orgCode: "U435000",
    resourceCode: "SHOP/FACIL", resourceName: "OrderTrak",
    fy25q1: 5000, fy25q2: 5000, fy25q3: 5000, fy25q4: 5000,
    fy26q1: 4000, fy26q2: 4000, fy26q3: 4000, fy26q4: 4000,
    fy27q1: 3500, fy27q2: 3500, fy27q3: 3500, fy27q4: 3500,
    fy28q1: 3000, fy28q2: 3000, fy28q3: 3000, fy28q4: 3000,
    fy29q1: 2500, fy29q2: 2500, fy29q3: 2500, fy29q4: 2500,
    openCommitment: 1400, requested: 15000 },
];

/* ─── Create Request Modal ──────────────────────────────────────── */
type CREntry = {
  rowId:       number;
  orgCode:     string;
  orgLabel:    string;
  type:        "Labor" | "Travel" | "Contracting" | "Outsourcing";
  displayName: string;
  committed:   number; // obligatedQ
  change:      number; // requested - obligated (uncommitted delta)
  requested:   number;
  isErdc:      boolean;
};
type TravelForm   = { poc: string; travelers: string; pop: string; dates: string; purpose: string };
type ResourceForm = { pop: string; poc: string; people: string; purpose: string };

function Flex4Breakdown({ requested, orgCode }: { requested: number; orgCode: string }) {
  const ohRate = ERDC_OH_RATES[orgCode] ?? 0;
  const f4  = flex4Amount(requested);
  const rem = flex4Remaining(requested);
  const lb  = labBase(rem, ohRate);
  const oh  = ohAmount(rem, ohRate);
  const frbVal = frb(rem, ohRate);
  return (
    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs" onClick={(e) => e.stopPropagation()}>
      <p className="font-bold text-blue-800 uppercase tracking-wide mb-2" style={{ fontSize: 10 }}>OH Rate / Flex-4 Breakdown</p>
      <div className="grid gap-y-1" style={{ gridTemplateColumns: "1fr auto" }}>
        <span className="text-blue-700">OH Rate</span>
        <span className="text-right font-mono font-bold text-blue-800">{(ohRate * 100).toFixed(0)}%</span>
        <span className="text-blue-700">Flex-4 (3% off top)</span>
        <span className="text-right font-mono font-semibold text-blue-800">{fmt(f4)}</span>
        <span className="text-slate-500">Remaining (97%)</span>
        <span className="text-right font-mono text-slate-600">{fmt(rem)}</span>
        <span className="pl-4 text-blue-700">Lab Base</span>
        <span className="text-right font-mono font-semibold text-blue-800">{fmt(lb)}</span>
        <span className="pl-4 text-blue-700">OH ({(ohRate * 100).toFixed(0)}%)</span>
        <span className="text-right font-mono font-semibold text-blue-800">{fmt(oh)}</span>
        <span className="pl-4 text-slate-400">FRB (rounding)</span>
        <span className="text-right font-mono text-slate-400">{fmt(frbVal)}</span>
      </div>
    </div>
  );
}

/* ─── POP date-range picker ─────────────────────────────────── */
type DateRangeVal = { from?: Date; to?: Date };

const FIELD_CLS = "w-full border border-slate-200 rounded px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300";

function formatDateRange(r: DateRangeVal): string {
  if (!r.from) return "";
  const start = format(r.from, "dd MMM yyyy");
  const end   = r.to ? format(r.to, "dd MMM yyyy") : "…";
  return `${start} – ${end}`;
}

function PopDateRangePicker({
  value, onChange,
}: {
  value: DateRangeVal;
  onChange: (range: DateRangeVal, formatted: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const display = formatDateRange(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`${FIELD_CLS} flex items-center gap-2 text-left cursor-pointer`}
          style={!display ? { color: "#94a3b8" } : {}}
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarRange size={13} className="flex-shrink-0 text-slate-400" />
          <span className="truncate">{display || "e.g. 01 Oct 2026 – 30 Sep 2027"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" style={{ zIndex: 9999 }} onClick={(e) => e.stopPropagation()}>
        <Calendar
          mode="range"
          selected={value as { from: Date; to?: Date }}
          onSelect={(range) => {
            const r: DateRangeVal = range ?? {};
            onChange(r, formatDateRange(r));
            if (r.from && r.to) setOpen(false);
          }}
          numberOfMonths={2}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}

// ── CreateRequestModal helpers ────────────────────────────────────────────────

function crTypeSectionColor(type: string) {
  if (type === "Labor")       return { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", dot: "#3b82f6" };
  if (type === "Travel")      return { bg: "#f5f3ff", border: "#ddd6fe", text: "#5b21b6", dot: "#7c3aed" };
  if (type === "Contracting") return { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", dot: "#16a34a" };
  return                        { bg: "#fff7ed", border: "#fed7aa", text: "#92400e", dot: "#f59e0b" };
}

function buildCRNote(
  entry: { type: string; displayName: string; orgLabel: string },
  projectNumber: string,
  tf: TravelForm,
  rf: ResourceForm,
): string {
  const fy = `FY${CFY}`;
  const typePart = entry.type.toUpperCase();
  let resource = entry.displayName.split("—")[0]?.trim().toUpperCase() ?? entry.displayName.toUpperCase();
  if (entry.type === "Travel") resource = entry.orgLabel.toUpperCase();
  const base = `${fy}/SANDC ${typePart} FUNDS FOR ${projectNumber}/${resource}/`;
  if (entry.type === "Travel") {
    const lines = [base];
    if (tf.poc.trim())       lines.push(`POC: ${tf.poc.trim()}`);
    if (tf.travelers.trim()) lines.push(`TRAVELERS: ${tf.travelers.trim()}`);
    if (tf.pop.trim())       lines.push(`POP: ${tf.pop.trim()}`);
    if (tf.dates.trim())     lines.push(`DATES: ${tf.dates.trim()}`);
    if (tf.purpose.trim())   lines.push(`PURPOSE: ${tf.purpose.trim()}`);
    return lines.join("\n");
  }
  if (entry.type === "Contracting" || entry.type === "Outsourcing") {
    const lines = [base];
    if (rf.poc.trim())     lines.push(`POC: ${rf.poc.trim()}`);
    if (rf.people.trim())  lines.push(`PEOPLE: ${rf.people.trim()}`);
    if (rf.pop.trim())     lines.push(`POP: ${rf.pop.trim()}`);
    if (rf.purpose.trim()) lines.push(`PURPOSE: ${rf.purpose.trim()}`);
    return lines.join("\n");
  }
  return base;
}

function CRNoteCell({ noteText }: { noteText: string }) {
  const [text, setText] = useState(noteText);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => { setText(noteText); }, [noteText]);

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const rows = Math.max(2, text.split("\n").length);

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={rows}
        className="w-full text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-200 leading-relaxed"
      />
      <button
        onClick={copy}
        className="self-start flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
      >
        {copied
          ? <><Check size={11} className="text-emerald-500" /> Copied</>
          : <><Copy size={11} /> Copy</>}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function CreateRequestModal({
  project, laborRows, travelRows, contractRows, outsourcingRows, totalPlanned, onClose,
}: {
  project: Project;
  laborRows: PlanRow[];
  travelRows: PlanRow[];
  contractRows: ContractRow[];
  outsourcingRows: OutsourcingRow[];
  totalPlanned: number;
  onClose: () => void;
}) {
  const [travelForms,   setTravelForms]   = useState<Record<number, TravelForm>>({});
  const [resourceForms, setResourceForms] = useState<Record<number, ResourceForm>>({});
  const [popRanges,     setPopRanges]     = useState<Record<number, DateRangeVal>>({});

  const getTF = (id: number): TravelForm   => travelForms[id]  ?? { poc: "", travelers: "", pop: "", dates: "", purpose: "" };
  const getRF = (id: number): ResourceForm => resourceForms[id] ?? { pop: "", poc: "", people: "", purpose: "" };

  // Build a flat unified entry list
  const entries: CREntry[] = [
    ...laborRows.map((r) => {
      const parts = r.sub.split("/");
      const orgCode = parts[0] ?? r.sub;
      return { rowId: r.id, orgCode, orgLabel: parts[1] ?? orgCode, type: "Labor" as const,
        displayName: r.label, committed: obligatedQ(r), change: r.requested - obligatedQ(r), requested: r.requested, isErdc: isErdcCode(orgCode) };
    }),
    ...travelRows.map((r) => ({
      rowId: r.id, orgCode: r.sub, orgLabel: r.label, type: "Travel" as const,
      displayName: r.label, committed: obligatedQ(r), change: r.requested - obligatedQ(r), requested: r.requested, isErdc: isErdcCode(r.sub),
    })),
    ...contractRows.map((r) => ({
      rowId: r.id, orgCode: r.orgCode, orgLabel: r.org, type: "Contracting" as const,
      displayName: `${r.contractCode} — ${r.contractName}`, committed: obligatedQ(r), change: r.requested - obligatedQ(r), requested: r.requested, isErdc: isErdcCode(r.orgCode),
    })),
    ...outsourcingRows.map((r) => ({
      rowId: r.id, orgCode: r.orgCode, orgLabel: r.org, type: "Outsourcing" as const,
      displayName: `${r.resourceCode} — ${r.resourceName}`, committed: obligatedQ(r), change: r.requested - obligatedQ(r), requested: r.requested, isErdc: isErdcCode(r.orgCode),
    })),
  ];

  // Required-field completion tracking
  // Travel: poc, travelers, pop, dates, purpose (5 each)
  // Contracting/Outsourcing: pop, poc, people, purpose (4 each)
  const travelEntries    = entries.filter((e) => e.type === "Travel");
  const resourceEntries  = entries.filter((e) => e.type === "Contracting" || e.type === "Outsourcing");
  const totalRequired    = travelEntries.length * 5 + resourceEntries.length * 4;
  const filledCount = (() => {
    let n = 0;
    for (const e of travelEntries) {
      const f = getTF(e.rowId);
      if (f.poc.trim())       n++;
      if (f.travelers.trim()) n++;
      if (f.pop.trim())       n++;
      if (f.dates.trim())     n++;
      if (f.purpose.trim())   n++;
    }
    for (const e of resourceEntries) {
      const f = getRF(e.rowId);
      if (f.pop.trim())     n++;
      if (f.poc.trim())     n++;
      if (f.people.trim())  n++;
      if (f.purpose.trim()) n++;
    }
    return n;
  })();
  const remaining  = totalRequired - filledCount;
  const canSubmit  = remaining === 0;

  // Group by orgCode preserving insertion order
  const orgOrder: string[] = [];
  const byOrg: Record<string, CREntry[]> = {};
  for (const e of entries) {
    if (!byOrg[e.orgCode]) { byOrg[e.orgCode] = []; orgOrder.push(e.orgCode); }
    byOrg[e.orgCode].push(e);
  }

  const TYPE_ORDER: CREntry["type"][] = ["Labor", "Travel", "Contracting", "Outsourcing"];
  const TYPE_DOT: Record<string, string> = {
    Labor: "#60a5fa", Travel: "#a78bfa", Contracting: "#34d399", Outsourcing: "#f59e0b",
  };
  const freeBalance = project.budget - totalPlanned;
  const fieldCls = "w-full border border-slate-200 rounded px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300";
  const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1";

  /* Required-field label with tooltip info icon + filled/unfilled badge */
  const ReqLabel = ({ label, filled, tooltip }: { label: string; filled: boolean; tooltip: string }) => (
    <div className="flex items-center gap-1.5 mb-1">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: filled ? "#64748b" : "#b45309" }}>
        {label}
      </span>
      <span title={tooltip} className="cursor-help" style={{ color: "#94a3b8", lineHeight: 1 }}>
        <Info size={11} />
      </span>
      {filled
        ? <Check size={12} className="text-emerald-500 ml-auto" />
        : <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: "#b45309", border: "1px solid #fcd34d", backgroundColor: "#fffbeb" }}>Required</span>
      }
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#0f172a" }}
      onClick={onClose}
    >
      <div className="flex flex-col h-full w-full">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ backgroundColor: "#1a3557" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-white/40 text-xs font-medium tracking-wide">
              S&amp;C &rsaquo; Projects &rsaquo; {project.name} &rsaquo; Create Request
            </span>
            <span className="text-white font-bold text-sm tracking-widest uppercase">Create Request — Preview</span>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-4" onClick={(e) => e.stopPropagation()}>
          {/* Project card */}
          <div className="mb-3 border border-slate-200 rounded-lg overflow-hidden bg-white">
            <div className="px-4 py-1.5 border-b border-slate-100" style={{ backgroundColor: "#f8fafc" }}>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Budget Change Request</span>
            </div>
            <div className="p-4 flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-slate-400 mb-0.5">{project.number}</p>
                <p className="text-xl font-bold text-slate-800 leading-tight">{project.name}</p>
                <div className="flex items-center flex-wrap gap-3 mt-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: "#fef9c3", color: "#854d0e", border: "1px solid #fde047" }}>Pending</span>
                  <span className="text-xs text-slate-500">{project.pmName} · 2026-04-28</span>
                  <span className="text-xs text-slate-500">Proponent: <span className="font-semibold text-slate-700">{project.hqProponent}</span></span>
                </div>
              </div>
              <div className="flex-shrink-0 border border-slate-200 rounded-lg overflow-hidden">
                <div className="grid divide-x divide-slate-200" style={{ gridTemplateColumns: "repeat(3, minmax(90px, 1fr))" }}>
                  {[
                    { label: "TOA",          val: project.budget, color: "#1e293b" },
                    { label: "Planned",      val: totalPlanned,   color: "#1e293b" },
                    { label: "Free Balance", val: freeBalance,    color: freeBalance >= 0 ? "#16a34a" : "#dc2626" },
                  ].map((c) => (
                    <div key={c.label} className="px-3 py-2 text-right">
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold whitespace-nowrap">{c.label}</p>
                      <p className="font-bold tabular-nums text-sm" style={{ color: c.color }}>{fmt(c.val)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Project description */}
          <div className="mb-3 border border-slate-200 rounded-lg p-4 bg-white">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Project Description</p>
            <p className="text-sm text-slate-700 leading-relaxed">{project.description}</p>
          </div>

          {/* Budget Breakdown */}
          <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden bg-white">
            <div className="px-4 py-2.5" style={{ backgroundColor: "#1a3557" }}>
              <span className="text-white font-bold text-xs tracking-widest uppercase">Budget Breakdown</span>
            </div>

            {orgOrder.map((orgCode) => {
              const orgEntries = byOrg[orgCode];
              const orgLabel   = orgEntries[0].orgLabel;
              const typeMap: Partial<Record<CREntry["type"], CREntry[]>> = {};
              for (const e of orgEntries) {
                if (!typeMap[e.type]) typeMap[e.type] = [];
                typeMap[e.type]!.push(e);
              }
              const usedTypes = TYPE_ORDER.filter((t) => typeMap[t]);

              return (
                <div key={orgCode} className="border-b border-slate-200 last:border-b-0">
                  {/* Org code header */}
                  <div className="px-4 py-1.5 flex items-center gap-3" style={{ backgroundColor: "#1e3a5f" }}>
                    <span className="font-mono text-xs font-bold" style={{ color: "#93c5fd" }}>{orgCode}</span>
                    {orgLabel && orgLabel !== orgCode && (
                      <span className="text-xs" style={{ color: "#94a3b8" }}>· {orgLabel}</span>
                    )}
                  </div>

                  {usedTypes.map((type) => {
                    const typeEntries = typeMap[type]!;
                    return (
                      <div key={type}>
                        {/* Type sub-header with column labels */}
                        <div className="px-4 py-1.5 flex items-center gap-2 border-b border-slate-100" style={{ backgroundColor: "#f1f5f9" }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_DOT[type] }} />
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex-1">{type}</span>
                          <span className="text-xs font-semibold text-slate-400 uppercase" style={{ width: 100, textAlign: "right" }}>Committed</span>
                          <span className="text-xs font-semibold text-slate-400 uppercase" style={{ width: 100, textAlign: "right" }}>Change</span>
                          <span className="text-xs font-semibold text-slate-400 uppercase" style={{ width: 100, textAlign: "right" }}>Requested</span>
                          <span style={{ width: 28 }} />
                        </div>

                        {typeEntries.map((entry) => {
                          const isTravel   = entry.type === "Travel";
                          const isResource = entry.type === "Contracting" || entry.type === "Outsourcing";

                          return (
                            <React.Fragment key={entry.rowId}>
                              {/* Data row */}
                              <div
                                className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-100"
                                style={{ backgroundColor: (isTravel || isResource) ? "#f8fafc" : undefined }}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 leading-snug truncate">{entry.displayName}</p>
                                  <p className="text-xs text-slate-400">{entry.orgCode}</p>
                                </div>
                                <span className="tabular-nums text-sm text-slate-600" style={{ width: 100, textAlign: "right" }}>
                                  {entry.committed > 0 ? fmt(entry.committed) : "—"}
                                </span>
                                <span className="tabular-nums text-sm font-semibold" style={{ width: 100, textAlign: "right", color: entry.change > 0 ? "#15803d" : entry.change < 0 ? "#b91c1c" : "#94a3b8" }}>
                                  {entry.change === 0 ? "—" : `${entry.change > 0 ? "+" : ""}${fmt(entry.change)}`}
                                </span>
                                <span className="tabular-nums text-sm font-bold text-slate-800" style={{ width: 100, textAlign: "right" }}>
                                  {entry.requested > 0 ? fmt(entry.requested) : "—"}
                                </span>
                                <span style={{ width: 28 }} />
                              </div>

                              {/* Travel detail form */}
                              {isTravel && (
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50" onClick={(e) => e.stopPropagation()}>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <ReqLabel label="POC" filled={!!getTF(entry.rowId).poc.trim()} tooltip="Point of Contact — the person responsible for coordinating this travel" />
                                      <input className={fieldCls} placeholder="Point of contact name"
                                        value={getTF(entry.rowId).poc}
                                        onChange={(e) => setTravelForms((f) => ({ ...f, [entry.rowId]: { ...getTF(entry.rowId), poc: e.target.value } }))}
                                      />
                                    </div>
                                    <div>
                                      <ReqLabel label="Travelers" filled={!!getTF(entry.rowId).travelers.trim()} tooltip="Names or number of people traveling" />
                                      <input className={fieldCls} placeholder="Names / number of travelers"
                                        value={getTF(entry.rowId).travelers}
                                        onChange={(e) => setTravelForms((f) => ({ ...f, [entry.rowId]: { ...getTF(entry.rowId), travelers: e.target.value } }))}
                                      />
                                    </div>
                                    <div>
                                      <ReqLabel label="Period of Performance (POP)" filled={!!getTF(entry.rowId).pop.trim()} tooltip="Overall period of performance for this travel authorization" />
                                      <PopDateRangePicker
                                        value={popRanges[-(entry.rowId)] ?? {}}
                                        onChange={(range, formatted) => {
                                          setPopRanges((r) => ({ ...r, [-(entry.rowId)]: range }));
                                          setTravelForms((f) => ({ ...f, [entry.rowId]: { ...getTF(entry.rowId), pop: formatted } }));
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <ReqLabel label="Dates of Travel" filled={!!getTF(entry.rowId).dates.trim()} tooltip="Specific travel dates (e.g. 15–18 Jul 2026)" />
                                      <input className={fieldCls} placeholder="e.g. 15–18 Jul 2026"
                                        value={getTF(entry.rowId).dates}
                                        onChange={(e) => setTravelForms((f) => ({ ...f, [entry.rowId]: { ...getTF(entry.rowId), dates: e.target.value } }))}
                                      />
                                    </div>
                                  </div>
                                  <div className="mb-3">
                                    <ReqLabel label="Purpose of Travel" filled={!!getTF(entry.rowId).purpose.trim()} tooltip="Brief justification for this travel request" />
                                    <textarea rows={2} className={fieldCls} placeholder="Brief purpose statement"
                                      value={getTF(entry.rowId).purpose}
                                      onChange={(e) => setTravelForms((f) => ({ ...f, [entry.rowId]: { ...getTF(entry.rowId), purpose: e.target.value } }))}
                                    />
                                  </div>
                                  {entry.isErdc && entry.requested > 0 && (
                                    <Flex4Breakdown requested={entry.requested} orgCode={entry.orgCode} />
                                  )}
                                </div>
                              )}

                              {/* Contract / Outsourcing detail form */}
                              {isResource && (
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50" onClick={(e) => e.stopPropagation()}>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <ReqLabel label="POC" filled={!!getRF(entry.rowId).poc.trim()} tooltip="Point of Contact — the person managing this contract or resource" />
                                      <input className={fieldCls} placeholder="Point of contact name"
                                        value={getRF(entry.rowId).poc}
                                        onChange={(e) => setResourceForms((f) => ({ ...f, [entry.rowId]: { ...getRF(entry.rowId), poc: e.target.value } }))}
                                      />
                                    </div>
                                    <div>
                                      <ReqLabel label="People" filled={!!getRF(entry.rowId).people.trim()} tooltip="Names or number of personnel involved with this resource" />
                                      <input className={fieldCls} placeholder="Names / number of people"
                                        value={getRF(entry.rowId).people}
                                        onChange={(e) => setResourceForms((f) => ({ ...f, [entry.rowId]: { ...getRF(entry.rowId), people: e.target.value } }))}
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <ReqLabel label="Period of Performance (POP)" filled={!!getRF(entry.rowId).pop.trim()} tooltip="Contract or task order period of performance" />
                                      <PopDateRangePicker
                                        value={popRanges[entry.rowId] ?? {}}
                                        onChange={(range, formatted) => {
                                          setPopRanges((r) => ({ ...r, [entry.rowId]: range }));
                                          setResourceForms((f) => ({ ...f, [entry.rowId]: { ...getRF(entry.rowId), pop: formatted } }));
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="mb-3">
                                    <ReqLabel label="Purpose" filled={!!getRF(entry.rowId).purpose.trim()} tooltip="Brief justification for this contract or resource request" />
                                    <textarea rows={2} className={fieldCls} placeholder="Brief purpose statement"
                                      value={getRF(entry.rowId).purpose}
                                      onChange={(e) => setResourceForms((f) => ({ ...f, [entry.rowId]: { ...getRF(entry.rowId), purpose: e.target.value } }))}
                                    />
                                  </div>
                                  {entry.isErdc && entry.requested > 0 && (
                                    <Flex4Breakdown requested={entry.requested} orgCode={entry.orgCode} />
                                  )}
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Sticky submit footer */}
        <div className="flex-shrink-0 border-t border-white/10 px-6 py-3 flex items-center justify-between gap-4" style={{ backgroundColor: "#1a3557" }} onClick={(e) => e.stopPropagation()}>
          {/* Field completion counter */}
          <div className="flex items-center gap-3">
            {/* Progress bar */}
            <div className="w-40 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${totalRequired > 0 ? (filledCount / totalRequired) * 100 : 100}%`, backgroundColor: canSubmit ? "#4ade80" : "#60a5fa" }}
              />
            </div>
            <p className="text-xs font-semibold" style={{ color: canSubmit ? "#4ade80" : "rgba(255,255,255,0.6)" }}>
              {canSubmit
                ? "All required fields complete"
                : `${filledCount} of ${totalRequired} required field${totalRequired === 1 ? "" : "s"} complete`}
            </p>
          </div>

          {/* Submit button */}
          <button
            disabled={!canSubmit}
            onClick={() => { if (canSubmit) { alert("Request submitted (stub)."); onClose(); } }}
            className="text-sm font-bold px-5 py-2 rounded transition-colors"
            style={canSubmit
              ? { backgroundColor: "#16a34a", color: "#fff", border: "1px solid #15803d", cursor: "pointer" }
              : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.1)", cursor: "not-allowed" }
            }
            onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.backgroundColor = "#15803d"; }}
            onMouseLeave={(e) => { if (canSubmit) e.currentTarget.style.backgroundColor = "#16a34a"; }}
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const [showLaborPicker,       setShowLaborPicker]       = useState(false);
  const [showTravelPicker,      setShowTravelPicker]      = useState(false);
  const [showContractPicker,    setShowContractPicker]    = useState(false);
  const [showOutsourcingPicker, setShowOutsourcingPicker] = useState(false);
  const [showCreateRequest,     setShowCreateRequest]     = useState(false);
  const [copiedLtp,             setCopiedLtp]             = useState(false);

  const toggleSet = (set: Set<number>, id: number): Set<number> => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  // Live totals for the summary bubbles
  const totalPlanned = [...laborRows, ...travelRows, ...contractRows, ...outsourcingRows]
    .reduce((sum, r) => sum + sumAll(r), 0);

  // "Create Request" gate: enabled only when 0 <= leftToPlan <= $50
  const leftToPlan = project.budget - totalPlanned;
  const createEnabled = leftToPlan >= 0 && leftToPlan <= 50;

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

  /* ── bulk request helpers ────────────────────────────────────── */
  function setBulkToMax<T extends QData & { id: number; requested: number }>(
    setRows: React.Dispatch<React.SetStateAction<T[]>>
  ) {
    setRows((rows) => rows.map((r) => {
      const maxR = openWindowMax(r);
      return { ...r, requested: clampRequested(maxR, obligatedQ(r), maxR) };
    }));
  }

  function setBulkToCommitments<T extends QData & { id: number; requested: number; openCommitment: number }>(
    setRows: React.Dispatch<React.SetStateAction<T[]>>
  ) {
    setRows((rows) => rows.map((r) => {
      const oblg = obligatedQ(r);
      const maxR = openWindowMax(r);
      return { ...r, requested: clampRequested(oblg + r.openCommitment, oblg, maxR) };
    }));
  }

  const addSectionHeader = (
    title: string,
    dotColor: string,
    onAdd: () => void,
    addLabel: string,
    bulkActions?: { label: string; tooltip: string; onClick: () => void; enabled: boolean }[]
  ) => (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200" style={{ backgroundColor: "#1a3557" }}>
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
      <span className="font-bold text-white text-sm tracking-wide flex-1">{title}</span>
      {bulkActions?.map((a) => (
        <button
          key={a.label}
          onClick={a.enabled ? a.onClick : undefined}
          title={a.tooltip}
          className="text-xs font-semibold px-2.5 py-1 rounded transition-colors"
          style={a.enabled
            ? { backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer" }
            : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.12)", cursor: "not-allowed" }
          }
          onMouseEnter={(e) => { if (a.enabled) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.28)"; } }}
          onMouseLeave={(e) => { if (a.enabled) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"; } }}
        >
          {a.label}
        </button>
      ))}
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

  const breadcrumb = (
    <>
      <Link href="/" className="hover:text-blue-600 transition-colors text-slate-500">Home</Link>
      <ChevronRight size={13} className="text-slate-300" />
      <Link href="/projects" className="hover:text-blue-600 transition-colors text-slate-500">Projects</Link>
      <ChevronRight size={13} className="text-slate-300" />
      <span className="font-semibold text-slate-700">
        <span className="font-mono text-slate-400 mr-1">[{project.number}]</span>{project.name}
      </span>
    </>
  );

  const headerActions = (
    <Link href={`/projects/${project.id}/settings`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
      <Settings size={13} />
      Settings
    </Link>
  );

  const stickyBanner = (
    <>
      {/* info bar */}
      <div className="px-6 py-3 flex items-center gap-4" style={{ backgroundColor: "#1a3557" }}>
        {/* LEFT: project number + name */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{project.number}</p>
          <p className="font-bold text-white truncate">{project.name}</p>
        </div>

        {/* CENTER: Create Request button + hint */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <button
            disabled={!createEnabled}
            onClick={() => createEnabled && setShowCreateRequest(true)}
            className="text-xs font-bold px-3 py-1.5 rounded transition-colors"
            style={createEnabled
              ? { backgroundColor: "#1a6ea8", color: "#fff", border: "1px solid #2d8fcf", cursor: "pointer" }
              : { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.12)", cursor: "not-allowed" }
            }
            onMouseEnter={(e) => { if (createEnabled) e.currentTarget.style.backgroundColor = "#1e82c6"; }}
            onMouseLeave={(e) => { if (createEnabled) e.currentTarget.style.backgroundColor = "#1a6ea8"; }}
          >
            Create Request
          </button>
          {!createEnabled && (
            <p className="text-xs text-center max-w-[200px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              {leftToPlan < 0
                ? <>Over budget by <span style={{ color: "#fbbf24", fontWeight: 600 }}>{fmt(Math.abs(leftToPlan))}</span></>
                : <>Plan <span style={{ color: "#fbbf24", fontWeight: 600 }}>{fmt(leftToPlan)}</span> more to enable</>}
            </p>
          )}
        </div>

        {/* RIGHT: status badge + POP */}
        <div className="flex items-center gap-3 flex-shrink-0 flex-1 justify-end">
          <div
            className="px-2 py-1 rounded text-xs font-semibold cursor-help"
            style={{ backgroundColor: "rgba(167,243,208,0.2)", color: "#6ee7b7", border: "1px solid rgba(167,243,208,0.3)" }}
            title={`Plan window: ${PLAN_WINDOW_LABEL} — submissions accepted from 1 Jun 2026 through 30 Jun 2026`}
          >
            {PLAN_STATUS_LABEL}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>Project POP</p>
            <p className="font-semibold text-sm text-white">{PLAN_WINDOW_LABEL}</p>
          </div>
        </div>
      </div>

      {/* summary bubbles — TOA / PLANNED / LEFT TO PLAN */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex gap-4">
          <div className="flex-1 rounded-xl px-5 py-4" style={{ backgroundColor: "#1a3557" }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>TOA</p>
            <p className="text-2xl font-bold text-white mt-0.5">{fmt(project.budget)}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Total Obligating Authority</p>
          </div>
          <div className="flex-1 rounded-xl px-5 py-4 border border-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Planned</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{fmt(totalPlanned)}</p>
            <p className="text-xs text-slate-400 mt-1">Amount currently planned</p>
          </div>
          <div
            className="flex-1 rounded-xl px-5 py-4 cursor-pointer select-none transition-opacity hover:opacity-80 active:opacity-60"
            title="Click to copy amount to clipboard"
            onClick={() => {
              navigator.clipboard.writeText(fmt(leftToPlan)).then(() => {
                setCopiedLtp(true);
                setTimeout(() => setCopiedLtp(false), 2000);
              });
            }}
            style={
              leftToPlan < 0   ? { backgroundColor: "#fef2f2", border: "1px solid #fca5a5" }
              : leftToPlan === 0 ? { backgroundColor: "#f0fdf4", border: "1px solid #86efac" }
              :                    { backgroundColor: "#fffbeb", border: "1px solid #fcd34d" }
            }
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: leftToPlan < 0 ? "#991b1b" : leftToPlan === 0 ? "#15803d" : "#92400e" }}>Left to Plan</p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: leftToPlan < 0 ? "#dc2626" : leftToPlan === 0 ? "#16a34a" : "#b45309" }}>{fmt(leftToPlan)}</p>
            <p className="text-xs mt-1" style={{ color: leftToPlan < 0 ? "#b91c1c" : leftToPlan === 0 ? "#15803d" : "#a16207" }}>
              {copiedLtp
                ? "Copied to clipboard!"
                : leftToPlan < 0 ? "Over budget — reduce planned amounts"
                : leftToPlan === 0 ? "Fully allocated"
                : "Click to copy · Unallocated funds remaining"}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Layout breadcrumb={breadcrumb} headerActions={headerActions} stickyBanner={stickyBanner}>
      <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>

        {/* column legend */}
        <div className="px-6 py-2.5 flex items-center gap-5 border-b border-slate-200 bg-white text-xs text-slate-600 font-medium">
          <span className="text-slate-400 font-semibold uppercase tracking-wide text-[10px] mr-1">Legend:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: AMBER_BG, border: "1px solid #fcd34d" }} />
            <span>Editable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: BLUE_BG, border: "1px solid #bfdbfe" }} />
            <span>Read-only (system data)</span>
          </div>
          <div className="h-3.5 w-px bg-slate-200" />
          <span className="text-slate-500 font-normal">Request may not be less than Obligated</span>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* ── LABOR ── */}
          {showLaborPicker && (
            <AddRowModal
              title="Add Labor Resource"
              sections={[
                { heading: "ERDC Personnel", items: LABOR_OPTIONS.filter((o) => o.sub.startsWith("U") || o.sub.startsWith("—")) },
                { heading: "District Personnel", items: LABOR_OPTIONS.filter((o) => o.sub.startsWith("W")) },
              ]}
              existingLabels={new Set(laborRows.map((r) => r.label))}
              onAdd={(items) => setLaborRows((rows) => [...rows, ...items.map(({ label, sub }) => ({
                id: uid(), label, sub: sub ?? "", ...emptyQ(), openCommitment: 0, requested: 0,
              }))])}
              onClose={() => setShowLaborPicker(false)}
            />
          )}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {addSectionHeader("LABOR", "#60a5fa", () => setShowLaborPicker(true), "Add Labor", [
              { label: "Request Max",     tooltip: "Set every row's request to its maximum (obligated + current quarter)",    onClick: () => setBulkToMax(setLaborRows),         enabled: laborRows.length > 0 },
              { label: "Cover Committed", tooltip: "Set every row's request to obligated + open commitments",                 onClick: () => setBulkToCommitments(setLaborRows), enabled: laborRows.length > 0 },
            ])}
            {tableWrap(
              <>
                <thead>
                  <ColHeaders nameHeader="Employee / Org Code" />
                </thead>
                <tbody>
                  {laborRows.map((row, i) => (
                    <PlanDataRow
                      key={row.id} row={row} isEven={i % 2 === 1}
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
              sections={[
                { heading: "ERDC Labs", items: TRAVEL_OPTIONS.filter((o) => o.sub.startsWith("U")) },
                { heading: "Districts", items: TRAVEL_OPTIONS.filter((o) => o.sub.startsWith("W")) },
              ]}
              existingLabels={new Set(travelRows.map((r) => r.label))}
              onAdd={(items) => setTravelRows((rows) => [...rows, ...items.map(({ label, sub }) => ({
                id: uid(), label, sub: sub ?? "", ...emptyQ(), openCommitment: 0, requested: 0,
              }))])}
              onClose={() => setShowTravelPicker(false)}
            />
          )}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {addSectionHeader("TRAVEL", "#a78bfa", () => setShowTravelPicker(true), "Add Travel", [
              { label: "Request Max",     tooltip: "Set every row's request to its maximum (obligated + current quarter)",    onClick: () => setBulkToMax(setTravelRows),         enabled: travelRows.length > 0 },
              { label: "Cover Committed", tooltip: "Set every row's request to obligated + open commitments",                 onClick: () => setBulkToCommitments(setTravelRows), enabled: travelRows.length > 0 },
            ])}
            {tableWrap(
              <>
                <thead><ColHeaders nameHeader="Organization" /></thead>
                <tbody>
                  {travelRows.map((row, i) => (
                    <PlanDataRow
                      key={row.id} row={row} isEven={i % 2 === 1}
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
            {addSectionHeader("CONTRACTING", "#34d399", () => setShowContractPicker(true), "Add Contract", [
              { label: "Request Max",     tooltip: "Set every row's request to its maximum (obligated + current quarter)",    onClick: () => setBulkToMax(setContractRows),         enabled: contractRows.length > 0 },
              { label: "Cover Committed", tooltip: "Set every row's request to obligated + open commitments",                 onClick: () => setBulkToCommitments(setContractRows), enabled: contractRows.length > 0 },
            ])}
            {tableWrap(
              <>
                <thead><ColHeaders nameHeader="Resource Code" /></thead>
                <tbody>
                  {contractRows.map((row, i) => (
                    <ResourceDataRow
                      key={row.id} row={row} isEven={i % 2 === 1}
                      line2={row.contractName}
                      subCode={row.contractCode}
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
            {addSectionHeader("OUTSOURCING & OTHER", "#f59e0b", () => setShowOutsourcingPicker(true), "Add Resource", [
              { label: "Request Max",     tooltip: "Set every row's request to its maximum (obligated + current quarter)",    onClick: () => setBulkToMax(setOutsourcingRows),         enabled: outsourcingRows.length > 0 },
              { label: "Cover Committed", tooltip: "Set every row's request to obligated + open commitments",                 onClick: () => setBulkToCommitments(setOutsourcingRows), enabled: outsourcingRows.length > 0 },
            ])}
            {tableWrap(
              <>
                <thead><ColHeaders nameHeader="Resource Code" /></thead>
                <tbody>
                  {outsourcingRows.map((row, i) => (
                    <ResourceDataRow
                      key={row.id} row={row} isEven={i % 2 === 1}
                      line2={row.resourceName}
                      subCode={row.resourceCode}
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

      {/* Create Request modal */}
      {showCreateRequest && (
        <CreateRequestModal
          project={project}
          laborRows={laborRows}
          travelRows={travelRows}
          contractRows={contractRows}
          outsourcingRows={outsourcingRows}
          totalPlanned={totalPlanned}
          onClose={() => setShowCreateRequest(false)}
        />
      )}
    </Layout>
  );
}
