import { useState, useRef, Fragment } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Pencil,
} from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_PROJECTS, Project } from "@/lib/mockData";
import {
  CURRENT_FISCAL_PERIOD,
  CURRENT_FY,
  CURRENT_QUARTER,
  getFiscalQuarters,
} from "@/lib/fiscalYear";
import {
  clampQuarterPlanToObligationFloor,
  getAllocatableQuarterBucket,
  getQuarterSyncReductionCapacity,
  syncQuarterPlanToAnnual,
  scopeDemoActualsToAnnualPlan,
  resolveAnnualPlanEdit,
  type FiscalQuarterKey,
  type QuarterAmounts,
} from "@/lib/planningFiscalMath";
import { useUser } from "@/lib/userContext";
import { useChangeRequests } from "@/lib/changeRequestsContext";
import { useToast } from "@/hooks/use-toast";
import { fundingCurrency, splitMoney, type ProjectFunding } from "@/lib/projectFunding";

/* ── Formatting ──────────────────────────────────────────── */
const fmt = fundingCurrency;
const fmtDelta = (n: number) => (n >= 0 ? "+" : "") + fmt(n);

/* ── Constants ───────────────────────────────────────────── */
const FYS = ["FY25", "FY26", "FY27", "FY28", "FY29"] as const;
type FY = (typeof FYS)[number];
const CURRENT_FY_IN_GRID = CURRENT_FY as FY;
type Category = "Labor" | "Travel" | "Contracts" | "Outsourcing & Other";
type QuarterKey = FiscalQuarterKey;
const CATEGORIES: Category[] = ["Labor", "Travel", "Contracts", "Outsourcing & Other"];

/* ── Government quarter definitions for the current FY ───── */
interface QDef {
  key: QuarterKey;
  label: string;
  range: string;
  start: Date;
  end: Date;
}
const GOV_QUARTERS = getFiscalQuarters(CURRENT_FISCAL_PERIOD.year) as QDef[];
const CURRENT_QUARTER_KEY = `Q${CURRENT_QUARTER}` as QuarterKey;
const CURRENT_QUARTER_DEF = GOV_QUARTERS.find((q) => q.key === CURRENT_QUARTER_KEY)!;
type QStatus = "past" | "current" | "near-next" | "future";


function getQStatus(q: QDef, today: Date): QStatus {
  if (today > q.end) return "past";
  if (today >= q.start) return "current";
  const days = Math.ceil((q.start.getTime() - today.getTime()) / 86_400_000);
  return days <= 14 ? "near-next" : "future";
}
const isRequired = (s: QStatus) => s === "current" || s === "near-next";
const isPastQ    = (s: QStatus) => s === "past";

/* ── Stub data ───────────────────────────────────────────── */
interface PersonRow {
  name: string;
  orgCode: string;
  committed: number;
  obligated: number;
  obligatedByQ: Record<QuarterKey, number>;
}
interface CategoryData {
  name: Category;
  committed: number;
  obligated: number;
  people: PersonRow[];
}

/** Distribute obligations only across completed and current quarters.
 *  Future quarters must not be presented as already obligated. */
function splitObligated(total: number, seed: number): Record<QuarterKey, number> {
  const recordedQuarters = GOV_QUARTERS.slice(0, CURRENT_QUARTER);
  const out: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  if (recordedQuarters.length === 1) {
    out[recordedQuarters[0].key] = total;
    return out;
  }

  const variance = (seed % 5) * 0.02;
  const weights = recordedQuarters.map((_, index) =>
    index === 0 ? 0.54 + variance : 1
  );
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  let allocated = 0;
  recordedQuarters.forEach((quarter, index) => {
    const amount = index === recordedQuarters.length - 1
      ? total - allocated
      : Math.round(total * weights[index] / weightTotal);
    out[quarter.key] = amount;
    allocated += amount;
  });
  return out;
}

function makeCategoryData(project: Project): CategoryData[] {
  if (project.funding) {
    const funding = project.funding;
    return CATEGORIES.map(name => {
      const actual = funding.annual[CURRENT_FY]?.[name];
      const people = name === "Labor" ? funding.resources.map(resource => {
        const obligated = resource.annualObligations[CURRENT_FY] ?? 0;
        return {
          name: resource.name, orgCode: resource.orgCode,
          committed: obligated, obligated,
          obligatedByQ: Object.fromEntries(splitMoney(obligated, 4).map((amount, i) => [`Q${i + 1}`, amount])) as Record<QuarterKey, number>,
        };
      }) : [];
      return { name, people, committed: (actual?.committed ?? 0) + (actual?.obligated ?? 0), obligated: actual?.obligated ?? 0 };
    });
  }
  if (project.noData) {
    return CATEGORIES.map((name) => ({
      name,
      committed: 0,
      obligated: 0,
      people: [],
    }));
  }

  const seed = parseInt(project.id, 10) || 1;
  const b = project.budget;
  const s = (pct: number, v = 0) =>
    Math.round(b * pct * (0.85 + ((seed + v) % 6) * 0.04));

  const mkPerson = (
    name: string,
    orgCode: string,
    cPct: number,
    oPct: number,
    cv: number,
    ov: number,
    si: number
  ): PersonRow => {
    const committed = s(cPct, cv);
    const obligated = s(oPct, ov);
    return { name, orgCode, committed, obligated, obligatedByQ: splitObligated(obligated, seed + si) };
  };

  // Labor: bulk of budget (~75% committed) — most project work lives here
  const labor = [
    mkPerson(project.projectLead || "Nugent, Joseph P.", "U435000", 0.26, 0.13, 0, 1, 0),
    mkPerson("Chen, David",          "U435000", 0.20, 0.10,  2, 3, 1),
    mkPerson("Williams, Sandra K.",  "U438000", 0.16, 0.08,  4, 5, 2),
    mkPerson("Contractor Pool",      "U435000", 0.13, 0.065, 1, 2, 3),
  ];
  // Travel: small presence — site visits and inspections only (~3.8% committed)
  const travel = [
    mkPerson("CERL Site Visits",  "U435000", 0.018, 0.009, 3, 0, 4),
    mkPerson("CHL / WES",         "U430000", 0.012, 0.006, 2, 1, 5),
    mkPerson("Field Inspections", "U438000", 0.008, 0.004, 5, 4, 6),
  ];

  // Contracts: absent for some projects; large lump when present (concentrated into 1 FY by initMultiYear)
  const hasContracts = seed % 2 === 1;
  const contracts = hasContracts ? [
    mkPerson("Software Maintenance",       "U400000", 0.08, 0.05, 0, 2, 7),
    mkPerson("Private Sector (OTHCONSVC)", "U435000", 0.10, 0.06, 3, 1, 8),
  ] : [];

  // Outsourced/Other: absent for most projects; moderate lump when present (concentrated into 1 FY)
  const hasOutsourced = seed % 3 === 1;
  const outsourcing = hasOutsourced ? [
    mkPerson("Corps District (MIPR)",  "U400000", 0.06, 0.025, 2, 0, 9),
    mkPerson("OrderTrak (SHOP/FACIL)", "U435000", 0.03, 0.015, 4, 3, 10),
  ] : [];

  const sum = (rows: PersonRow[], f: "committed" | "obligated") =>
    rows.reduce((t, r) => t + r[f], 0);

  return [
    { name: "Labor",               committed: sum(labor,       "committed"), obligated: sum(labor,       "obligated"), people: labor       },
    { name: "Travel",              committed: sum(travel,      "committed"), obligated: sum(travel,      "obligated"), people: travel      },
    { name: "Contracts",           committed: sum(contracts,   "committed"), obligated: sum(contracts,   "obligated"), people: contracts   },
    { name: "Outsourcing & Other", committed: sum(outsourcing, "committed"), obligated: sum(outsourcing, "obligated"), people: outsourcing },
  ];
}

function initMultiYear(
  cats: CategoryData[],
  targetTotal?: number,
  seed = 1,
  noData = false,
  funding?: ProjectFunding
): Record<Category, Record<FY, number | null>> {
  if (funding) {
    return Object.fromEntries(CATEGORIES.map(category => [category, Object.fromEntries(
      FYS.map(fy => [fy, funding.annual[fy]?.[category]?.plan ?? 0]),
    )])) as Record<Category, Record<FY, number | null>>;
  }
  const fyScales: Record<FY, number> = {
    FY25: 0.92, FY26: 0.96, FY27: 1.0, FY28: 1.04, FY29: 1.02,
  };
  const out = {} as Record<Category, Record<FY, number | null>>;
  for (const c of cats) {
    const base = Math.round(c.committed * 1.08);
    // noData project (all committed = 0): start every cell as null ("--")
    const row = {} as Record<FY, number | null>;
    for (const fy of FYS) row[fy] = base === 0 ? null : Math.round(base * fyScales[fy]);
    out[c.name as Category] = row;
  }

  // Scale all values proportionally so the grand total equals targetTotal exactly
  if (targetTotal && targetTotal > 0) {
    let rawTotal = 0;
    for (const cat of CATEGORIES)
      for (const fy of FYS) rawTotal += (out[cat]?.[fy] ?? 0) as number;
    if (rawTotal > 0 && rawTotal !== targetTotal) {
      const scale = targetTotal / rawTotal;
      let running = 0;
      let lastCat: Category = CATEGORIES[CATEGORIES.length - 1];
      let lastFY: FY = FYS[FYS.length - 1];
      for (const cat of CATEGORIES) {
        for (const fy of FYS) {
          const val = out[cat]?.[fy];
          if (val !== null && val !== undefined && val > 0) {
            const scaled = Math.round(val * scale);
            out[cat][fy] = scaled;
            running += scaled;
            lastCat = cat; lastFY = fy;
          }
        }
      }
      // Fix any rounding remainder on the last filled cell
      const rem = targetTotal - running;
      if (rem !== 0 && out[lastCat]?.[lastFY]) {
        out[lastCat][lastFY] = (out[lastCat][lastFY] as number) + rem;
      }
    }
  }

  // For new / no-data projects: past FY shows $0 (no obligations); current/future stay null (—, unplanned)
  if (noData) {
    const currentIdx = FYS.indexOf(CURRENT_FY_IN_GRID);
    for (const cat of CATEGORIES) {
      const row = out[cat];
      if (row) for (const fy of FYS) row[fy] = FYS.indexOf(fy) < currentIdx ? 0 : null;
    }
    return out;
  }

  // Contracts and Outsourcing tend to be lump-sum, not spread annually.
  // Concentrate each into a single FY so the table looks realistic.
  for (const cat of (["Contracts", "Outsourcing & Other"] as Category[])) {
    const row = out[cat];
    if (!row) continue;
    const total5yr = FYS.reduce((s, fy) => s + ((row[fy] ?? 0) as number), 0);
    if (total5yr === 0) continue;
    const chosenFY = cat === "Contracts"
      ? FYS[seed % FYS.length]
      : FYS[(seed + 2) % FYS.length];
    for (const fy of FYS) row[fy] = null;
    row[chosenFY] = total5yr;
  }

  return out;
}

function initQuarters(
  multiYear: Record<Category, Record<FY, number | null>>,
  catData: CategoryData[]
): Record<Category, Record<QuarterKey, number>> {
  const out = {} as Record<Category, Record<QuarterKey, number>>;
  for (const cat of CATEGORIES) {
    const cd = catData.find((c) => c.name === cat);
    const annual = (multiYear[cat]?.[CURRENT_FY_IN_GRID] ?? 0) as number;
    const obligations = Object.fromEntries(
      GOV_QUARTERS.map((q) => [
        q.key,
        annual > 0 && cd
          ? cd.people.reduce((sum, person) => sum + (person.obligatedByQ[q.key] ?? 0), 0)
          : 0,
      ])
    ) as Record<QuarterKey, number>;
    const obligatedTotal = GOV_QUARTERS.reduce((sum, q) => sum + obligations[q.key], 0);
    const remaining = Math.max(0, annual - obligatedTotal);
    const planCurrentQuarter = cat === "Labor" ? Math.round(remaining * 0.6) : remaining;
    const planFinalQuarter = cat === "Labor" ? remaining - planCurrentQuarter : 0;
    const quarters = { ...obligations };
    quarters[CURRENT_QUARTER_KEY] += planCurrentQuarter;
    quarters.Q4 += planFinalQuarter;
    out[cat] = quarters;
  }
  return out;
}

function initAllQuarters(
  multiYear: Record<Category, Record<FY, number | null>>,
  catData: CategoryData[],
  funding?: ProjectFunding
): Record<FY, Record<Category, Record<QuarterKey, number>>> {
  if (funding) {
    return Object.fromEntries(FYS.map(fy => [fy, Object.fromEntries(CATEGORIES.map(category => [
      category, Object.fromEntries(GOV_QUARTERS.map(q => [q.key, funding.quarterly[fy]?.[category]?.[q.key] ?? 0])),
    ]))])) as Record<FY, Record<Category, Record<QuarterKey, number>>>;
  }
  const currentIdx = FYS.indexOf(CURRENT_FY_IN_GRID);
  const out = {} as Record<FY, Record<Category, Record<QuarterKey, number>>>;
  for (const fy of FYS) {
    const fyIdx = FYS.indexOf(fy);
    if (fy === CURRENT_FY_IN_GRID) {
      out[fy] = initQuarters(multiYear, catData);
    } else if (fyIdx < currentIdx) {
      const fyData = {} as Record<Category, Record<QuarterKey, number>>;
      for (const cat of CATEGORIES) {
        const annual = (multiYear[cat]?.[fy] ?? 0) as number;
        const q1 = Math.round(annual * 0.27);
        const q2 = Math.round(annual * 0.23);
        const q3 = Math.round(annual * 0.25);
        fyData[cat] = { Q1: q1, Q2: q2, Q3: q3, Q4: annual - q1 - q2 - q3 };
      }
      out[fy] = fyData;
    } else {
      const fyData = {} as Record<Category, Record<QuarterKey, number>>;
      for (const cat of CATEGORIES) {
        const annual = (multiYear[cat]?.[fy] ?? 0) as number;
        fyData[cat] = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      }
      out[fy] = fyData;
    }
  }
  return out;
}

/* ── Colour tokens ───────────────────────────────────────── */
const GOLD_BG    = "#fffbeb";
const PAST_BG    = "#eff6ff";
const HEADER_BG  = "#1a3557";
const REQ_BORDER = "2px solid #0f172a";

export default function PlanningDashboard() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useUser();
  const { addChangeRequest } = useChangeRequests();
  const { toast } = useToast();

  const project = MOCK_PROJECTS.find((p) => p.id === params.id);
  const sourceCatData = project ? makeCategoryData(project) : [];
  const initApprovedBudget = project ? (project.planningBudget ?? project.budget) : 0;

  const initSeed   = parseInt(project?.id ?? "1", 10) || 1;
  const initNoData = project?.noData ?? false;
  const initialMultiYear = initMultiYear(sourceCatData, initApprovedBudget, initSeed, initNoData, project?.funding);
  const catData = project?.funding ? sourceCatData : sourceCatData.map(category => {
    const people = scopeDemoActualsToAnnualPlan(
      category.people, initialMultiYear[category.name][CURRENT_FY_IN_GRID] ?? 0,
    ).map((person, index) => ({
      ...person, obligatedByQ: splitObligated(person.obligated, initSeed + index),
    }));
    return {
      ...category, people,
      committed: people.reduce((sum, person) => sum + person.committed, 0),
      obligated: people.reduce((sum, person) => sum + person.obligated, 0),
    };
  });
  const [multiYear, setMultiYear] = useState<Record<Category, Record<FY, number | null>>>(
    () => initialMultiYear
  );
  const [allQuarters, setAllQuarters] = useState<Record<FY, Record<Category, Record<QuarterKey, number>>>>(
    () => initAllQuarters(initialMultiYear, catData, project?.funding)
  );
  const [selectedQFY, setSelectedQFY] = useState<FY>(CURRENT_FY_IN_GRID);
  const quarters = allQuarters[selectedQFY];
  const [topEdit,    setTopEdit]    = useState<{ cat: Category; fy: FY } | null>(null);
  const [topEditVal, setTopEditVal] = useState<string>("");
  const [qEdit,    setQEdit]    = useState<{ cat: Category; qKey: QuarterKey } | null>(null);
  const [showAlloc, setShowAlloc] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  /* ── Allocation form state (built when showAlloc opens) ── */
  type AllocResource = { id: string; name: string; orgCode: string; committed: number; obligated: number; obligatedCurrentQuarter: number; change: number; isNew: boolean };
  const parseChange = (raw: string): number => {
    const s = raw.replace(/[$,\s]/g, "");
    if (!s || s === "+" || s === "-") return 0;
    const n = parseFloat(s);
    return isNaN(n) ? 0 : Math.round(n * 100) / 100;
  };
  const fmtChange = (n: number) =>
    n === 0 ? "$0" : (n > 0 ? "+" : "") + fmt(n);

  /* Non-labor multi-item model */
  type NLLineItem = { id: string; objectCode: string; quarter: QuarterKey; amount: number; vendor: string; justification: string };
  type NLCategory  = { category: Category; bucket: number; items: NLLineItem[] };

  const NL_CODES: Record<"Travel" | "Contracts" | "Outsourcing & Other", { code: string; label: string }[]> = {
    "Travel": [
      { code: "TRAVEL", label: "TRAVEL" },
    ],
    "Contracts": [
      { code: "DFC-CONTR",   label: "DFC-CONTR — Direct Fund Cite Contract" },
      { code: "EQUIPMENT",   label: "EQUIPMENT — Durable property" },
      { code: "INTEREST",    label: "INTEREST — Interest Payments and Dividends" },
      { code: "ITCONTSVS",   label: "ITCONTSVS — IT Other Services (NON-GOV)" },
      { code: "ITEQUIPEXP",  label: "ITEQUIPEXP — IT Equipment (Printers, scanners, hard drives, etc)" },
      { code: "ITSFTDEVL",   label: "ITSFTDEVL — Software (Private Sector for software development)" },
      { code: "ITSFTMAINT",  label: "ITSFTMAINT — Software maintenance or support" },
      { code: "ITSFTWREXP",  label: "ITSFTWREXP — Custom/off the shelf Software licenses, updates" },
      { code: "ITSOFTLEAS",  label: "ITSOFTLEAS — ADP/telecommunication software leases" },
      { code: "O&MEQUIP",    label: "O&MEQUIP — Contracts for O&M, repair, storage, parts for equipment" },
      { code: "OTHCONSVC",   label: "OTHCONSVC — Private Sector contracts not otherwise classified" },
      { code: "OTHFACSVCS",  label: "OTHFACSVCS — Private Sector Contractual Services Not Otherwise Classified" },
      { code: "OTHRENTAL",   label: "OTHRENTAL — Rental of Equipment (IT equip, cylinder, equipment rental)" },
      { code: "R&D",         label: "R&D — R&D contractual services including BAAs" },
      { code: "SUPMATRL",    label: "SUPMATRL — Commodities expended within one year (supplies, fuel, parts, etc.)" },
      { code: "TRANTHNGS",   label: "TRANTHNGS — Shipping" },
      { code: "WKBOTHCOE",   label: "WKBOTHCOE — Corps District (MIPR)" },
      { code: "WKBOTHFED",   label: "WKBOTHFED — DoD or other Federal Agency (MIPR)" },
    ],
    "Outsourcing & Other": [
      { code: "OTHFACSVCS-EDIT",   label: "OTHFACSVCS — Editing (ITLEDITOR)" },
      { code: "OTHFACSVCS-LIB",    label: "OTHFACSVCS — Library Purchases (Periodicals, subscriptions etc.)" },
      { code: "OTHFACSVCS-PAINT",  label: "OTHFACSVCS — Paint Tests - Billings (PAINT-TST)" },
      { code: "OTHFACSVCS-CQAB",   label: "OTHFACSVCS — CQAB Chemical Tests & Analysis" },
      { code: "OTHFACSVCS-SMS",    label: "OTHFACSVCS — SMS Facility Account" },
      { code: "OTHFACSVCS-FAC",    label: "OTHFACSVCS — Other Facility Services (Vehicle maintenance, fuel)" },
      { code: "OTHFACSVCS-MIL",    label: "OTHFACSVCS — Civil Funded Military Officers" },
      { code: "SHOP/FACIL-OT",     label: "SHOP/FACIL — OrderTrak" },
      { code: "SHOP/FACIL-CCE",    label: "SHOP/FACIL — ERDC-CCE" },
      { code: "SHOP/FACIL-PRINT",  label: "SHOP/FACIL — Printing" },
      { code: "GSAVEH",            label: "GSAVEH — Government Vehicle" },
      { code: "TRANTHNGS-OTHER",   label: "TRANTHNGS — Other Shipping" },
      { code: "TRANTHNGS-52E",     label: "TRANTHNGS — 52E Shipping (NIGHTMAIL)" },
      { code: "GOVPURCH-TESS",     label: "GOVPURCH — TESS (unburdened)" },
      { code: "GOVPURCH-TESSS",    label: "GOVPURCH — TESS-S (burdened)" },
      { code: "GOVPURCH-FFS",      label: "GOVPURCH — Other Federal Agency Purchases (ex. Fee-For-Service)" },
    ],
  };

  /* ── Labor modal — personnel and org lookups ── */
  const ERDC_PERSONNEL = [
    { name: "Gunn, Charles", orgCode: "HQEC-DEMO" },
    { name: "Phillips, Jonah", orgCode: "HQEC-DEMO" },
    { name: "Torres, Miguel A.",  orgCode: "U430000", sub: "U430000/CHL" },
    { name: "Park, Jennifer",     orgCode: "U433000", sub: "U433000/EL"  },
    { name: "Harrison, Mark T.",  orgCode: "U439000", sub: "U439000/GRL" },
    { name: "Okafor, Chioma",     orgCode: "U437000", sub: "U437000/CRRL" },
    { name: "Reyes, Carlos",      orgCode: "U43400",  sub: "U43400/ITL"  },
    { name: "Placeholder — TBD", orgCode: "",        sub: "— name/org code pending" },
  ];
  const ERDC_ORGS: { group: string; items: { name: string; code: string }[] }[] = [
    { group: "ERDC Labs", items: [
      { name: "GRL",        code: "U439000" },
      { name: "CHL",        code: "U430000" },
      { name: "EL",         code: "U433000" },
      { name: "CERL",       code: "U435000" },
      { name: "GSL",        code: "U438000" },
      { name: "ITL",        code: "U43400"  },
      { name: "CTS",        code: "U4P0000" },
      { name: "CRRL",       code: "U437000" },
      { name: "OTHER ERDC", code: "U400000" },
      { name: "HPC",        code: "U440000" },
    ]},
    { group: "Districts", items: [
      { name: "HQ USACE",                     code: "W0100ER" },
      { name: "Institute for Water Resources", code: "W4110ER" },
      { name: "Buffalo District",             code: "W073ER0" },
      { name: "Chicago District",             code: "W074ER0" },
      { name: "Detroit District",             code: "W075ER0" },
      { name: "Memphis District",             code: "W060ER0" },
      { name: "New Orleans District",         code: "W912ER0" },
    ]},
  ];

  const buildAllocResources = (): AllocResource[] =>
    (catData.find((c) => c.name === "Labor")?.people ?? []).map((p, i) => ({
      id: `p${i}`, name: p.name, orgCode: p.orgCode,
      committed: p.committed, obligated: p.obligated,
      obligatedCurrentQuarter: p.obligatedByQ?.[CURRENT_QUARTER_KEY] ?? 0,
      change: project?.funding
        ? splitMoney(allQuarters[CURRENT_FY_IN_GRID]?.Labor?.[CURRENT_QUARTER_KEY] ?? 0, project.funding.resources.length)[i] ?? 0
        : 0,
      isNew: false,
    }));

  const categoryObligationsByQuarter = (category: Category): QuarterAmounts => {
    const people = catData.find((c) => c.name === category)?.people ?? [];
    return Object.fromEntries(
      GOV_QUARTERS.map((q) => [
        q.key,
        people.reduce((sum, person) => sum + (person.obligatedByQ[q.key] ?? 0), 0),
      ])
    ) as QuarterAmounts;
  };

  const buildAllocNonLabor = (): NLCategory[] => {
    const currentFYQuarters = allQuarters[CURRENT_FY_IN_GRID];
    const openQuarterKeys = project?.funding ? [CURRENT_QUARTER_KEY] : GOV_QUARTERS
      .filter((q) => getQStatus(q, CURRENT_FISCAL_PERIOD.today) !== "past")
      .map((q) => q.key);
    return (["Travel", "Contracts", "Outsourcing & Other"] as Category[]).map((cat) => ({
      category: cat,
      bucket: getAllocatableQuarterBucket(
        currentFYQuarters[cat] ?? {},
        categoryObligationsByQuarter(cat),
        openQuarterKeys
      ),
      items: [],
    }));
  };

  const [allocResources, setAllocResources] = useState<AllocResource[]>([]);
  const [allocNonLabor,  setAllocNonLabor]  = useState<NLCategory[]>([]);
  const [allocEdit, setAllocEdit] = useState<{ id: string; field: "change" | "noc"; raw: string } | null>(null);

  /* NL item modal state */
  const [nlModal, setNlModal] = useState<{
    open: boolean; category: Category | null;
    code: string; quarter: QuarterKey; amount: string; vendor: string; justification: string;
    editingItemId: string | null;
  }>({ open: false, category: null, code: "", quarter: CURRENT_QUARTER_KEY, amount: "", vendor: "", justification: "", editingItemId: null });

  const openNlModal  = (cat: Category) => setNlModal({ open: true, category: cat, code: cat === "Travel" ? "TRAVEL" : "", quarter: CURRENT_QUARTER_KEY, amount: "", vendor: "", justification: "", editingItemId: null });
  const editNlItem   = (cat: Category, item: NLLineItem) => setNlModal({
    open: true, category: cat,
    code: cat === "Travel" ? "TRAVEL" : item.objectCode, quarter: item.quarter,
    amount: String(item.amount), vendor: item.vendor, justification: item.justification,
    editingItemId: item.id,
  });
  const closeNlModal = () => setNlModal((s) => ({ ...s, open: false }));
  const nlNextIdRef = useRef(200);
  const submitNlModal = () => {
    if (!nlModal.category || !nlModal.code || !nlModal.amount || !nlModal.justification.trim()) return;
    const targetCategory = allocNonLabor.find((category) => category.category === nlModal.category);
    const totalAllocated = targetCategory?.items.reduce((sum, item) => sum + item.amount, 0) ?? 0;
    const existingAmount = targetCategory?.items.find((item) => item.id === nlModal.editingItemId)?.amount ?? 0;
    const available = (targetCategory?.bucket ?? 0) - totalAllocated + existingAmount;
    const amount = parseInt(nlModal.amount.replace(/[^0-9]/g, ""), 10) || 0;
    if (amount > available) return;
    const updated: Partial<NLLineItem> = {
      objectCode: nlModal.category === "Travel" ? "TRAVEL" : nlModal.code,
      quarter: nlModal.quarter,
      amount,
      vendor: nlModal.vendor.trim(),
      justification: nlModal.justification.trim(),
    };
    if (nlModal.editingItemId) {
      setAllocNonLabor((p) => p.map((c) => c.category === nlModal.category
        ? { ...c, items: c.items.map((i) => i.id === nlModal.editingItemId ? { ...i, ...updated } : i) }
        : c));
    } else {
      const item: NLLineItem = { id: String(nlNextIdRef.current++), ...updated as Omit<NLLineItem, "id"> };
      setAllocNonLabor((p) => p.map((c) => c.category === nlModal.category ? { ...c, items: [...c.items, item] } : c));
    }
    closeNlModal();
  };
  const [allocModalOpen,    setAllocModalOpen]    = useState(false);
  const [allocModalName,    setAllocModalName]    = useState("");
  const [allocModalOrgCode, setAllocModalOrgCode] = useState("");
  const [allocModalType,    setAllocModalType]    = useState<"individual" | "org">("individual");
  const allocNextIdRef = useRef(100);

  const closeAllocModal = () => {
    setAllocModalOpen(false);
    setAllocModalName("");
    setAllocModalOrgCode("");
    setAllocModalType("individual");
  };
  const submitAllocModal = () => {
    const name = allocModalName.trim();
    if (!name) return;
    setAllocResources((p) => [...p, {
      id: String(allocNextIdRef.current++), name,
      orgCode: allocModalOrgCode.trim(),
      committed: 0, obligated: 0, obligatedCurrentQuarter: 0, change: 0, isNew: true,
    }]);
    closeAllocModal();
  };

  if (!project)
    return (
      <Layout>
        <div className="py-24 text-center text-slate-500">Project not found.</div>
      </Layout>
    );

  const legacyPath     = `/projects/${project.id}/planning/legacy`;
  const approvedBudget = project.planningBudget ?? project.budget;
  const today          = CURRENT_FISCAL_PERIOD.today;

  const selectedFYIdx = FYS.indexOf(selectedQFY);
  const currentFYIdx  = FYS.indexOf(CURRENT_FY_IN_GRID);
  const isPastFY = (fy: FY) => FYS.indexOf(fy) < currentFYIdx;
  const fyInScope     = (fy: FY) => CATEGORIES.some((c) => (multiYear[c]?.[fy] ?? 0) > 0);
  const qStatuses: Record<string, QStatus> = Object.fromEntries(
    GOV_QUARTERS.map((q) => [
      q.key,
      selectedFYIdx < currentFYIdx ? "past" :
      selectedFYIdx > currentFYIdx ? "future" :
      getQStatus(q, today),
    ])
  );

  /* ── Derived values ─────────────────────────────────────── */
  const currentFYVal  = (cat: Category) => (multiYear[cat]?.[CURRENT_FY_IN_GRID] ?? 0) as number;
  const selectedFYVal = (cat: Category) => (multiYear[cat]?.[selectedQFY] ?? 0) as number;
  const qSum          = (cat: Category) => Object.values(quarters[cat] ?? {}).reduce((s, v) => s + v, 0);
  const qDiff         = (cat: Category) => selectedFYVal(cat) - qSum(cat);
  const totalCurrentFY = CATEGORIES.reduce((s, k) => s + currentFYVal(k), 0);
  const allBalanced   = CATEGORIES.every((c) => qDiff(c) === 0);

  const fyColTotal = (fy: FY) => CATEGORIES.reduce((s, k) => s + (multiYear[k]?.[fy] ?? 0), 0);
  const grandTotal = CATEGORIES.reduce(
    (s, k) => s + FYS.reduce((fs, fy) => fs + (multiYear[k]?.[fy] ?? 0), 0),
    0
  );
  const leftToPlan = approvedBudget - grandTotal;

  /* ── Request Change blocking reasons ────────────────────── */
  const currentFYQuarters = allQuarters[CURRENT_FY_IN_GRID];
  const openQKeys    = project?.funding ? [CURRENT_QUARTER_KEY] : GOV_QUARTERS.filter((q) => getQStatus(q, today) !== "past").map((q) => q.key);
  const isHistoricalFY = selectedFYIdx < currentFYIdx;
  const balanceQuarterKey: QuarterKey = selectedFYIdx === currentFYIdx ? CURRENT_QUARTER_KEY : "Q1";
  const anyPlanned = CATEGORIES.some((c) =>
    GOV_QUARTERS.some((q) => (currentFYQuarters[c]?.[q.key] ?? 0) > 0)
  );
  const blockingReasons: string[] = [];
  if (!anyPlanned) {
    blockingReasons.push("No quarterly amounts have been planned — enter at least one value to submit");
  }
  if (leftToPlan !== 0) {
    blockingReasons.push(
      leftToPlan > 0
        ? `Multi-year plan has ${fmt(leftToPlan)} unallocated — Left to Plan must be $0`
        : `Multi-year plan exceeds budget by ${fmt(-leftToPlan)} — reduce planned amounts`
    );
  }
  const canRequestChange = blockingReasons.length === 0;

  /* Live totals that reflect the currently-typed value before commit */
  const liveEditAmt = topEdit
    ? (parseFloat(topEditVal.replace(/[^0-9.]/g, "")) || 0)
    : null;
  const liveTotalCurrentFY = liveEditAmt !== null && topEdit?.fy === CURRENT_FY_IN_GRID && topEdit
    ? totalCurrentFY - (multiYear[topEdit.cat]?.[CURRENT_FY_IN_GRID] ?? 0) + liveEditAmt
    : totalCurrentFY;
  const liveGrandTotal = liveEditAmt !== null && topEdit
    ? grandTotal - (multiYear[topEdit.cat]?.[topEdit.fy] ?? 0) + liveEditAmt
    : grandTotal;
  const liveLeftToPlan = approvedBudget - liveGrandTotal;
  const totalCommitted = catData.reduce((s, c) => s + c.committed, 0);

  /* ── Alloc form derived ─────────────────────────────────── */
  const laborBucket     = getAllocatableQuarterBucket(
    currentFYQuarters.Labor ?? {},
    categoryObligationsByQuarter("Labor"),
    openQKeys
  );
  const laborCurrentQuarterObligated = allocResources.reduce((s, r) => s + r.obligatedCurrentQuarter, 0);
  const laborNetChange    = allocResources.reduce((s, r) => s + r.change, 0);
  const laborTotalNOC     = allocResources.reduce((s, r) => s + (r.committed - r.obligated + r.change), 0);
  const laborBucketRemaining = laborBucket - laborTotalNOC;
  const laborAllocated    = laborCurrentQuarterObligated; // display only
  const laborOver         = laborBucketRemaining < 0;
  const laborDone         = laborBucketRemaining === 0;
  const laborRemaining    = laborBucketRemaining;
  const nlDone = allocNonLabor.every((c) => {
    if (c.bucket === 0) return true;
    const total = c.items.reduce((s, i) => s + i.amount, 0);
    return c.items.length > 0 && total === c.bucket && c.items.every((i) => i.objectCode && i.amount > 0 && i.justification);
  });
  const allocCanSubmit  = laborDone && nlDone && !laborOver;

  const submitQuarterPlan = () => {
    if (!allocCanSubmit) return;
    if (project.funding) {
      const laborItems = allocResources.filter(resource => resource.change !== 0).map(resource => {
        const from = Math.max(0, resource.committed - resource.obligated);
        return {
          direction: resource.change > 0 ? "Increase" as const : "Decrease" as const,
          type: "Labor" as const,
          orgCode: resource.orgCode,
          resource: resource.name,
          laborCode: project.funding!.resources.find(person => person.name === resource.name)?.laborCode,
          amount: Math.abs(resource.change),
          from, to: from + resource.change,
        };
      });
      const nonLaborItems = allocNonLabor.flatMap(category => category.items.map(item => ({
        direction: "Increase" as const,
        type: category.category === "Travel" ? "Travel" as const : "Contracting" as const,
        orgCode: project.executingOrg, resource: item.vendor || item.objectCode,
        amount: item.amount, from: 0, to: item.amount,
        resourceDetails: { purpose: item.justification },
      })));
      if (laborItems.length + nonLaborItems.length === 0) return;
      addChangeRequest({
        id: `cr-${Date.now()}`,
        projectNumber: project.number, projectName: project.name, projectDescription: project.description,
        submittedBy: user.name, date: CURRENT_FISCAL_PERIOD.today.toISOString().slice(0, 10),
        requestFY: CURRENT_FY, requestQuarter: CURRENT_QUARTER_KEY,
        resourceCategory: nonLaborItems.length ? undefined : "Labor",
        requestType: laborNetChange < 0 ? "Decrease" : "Increase",
        status: "Pending Approval",
        justification: `${CURRENT_FY} ${CURRENT_QUARTER_KEY} funding for ${project.name}. Labor allocations: ${laborItems.map(item => `${item.resource} ${fmt(item.amount)}`).join("; ")}. Generated demo resource splits; historical obligations are unchanged.`,
        lineItems: [...laborItems, ...nonLaborItems],
      });
    }
    setShowSubmitConfirm(true);
  };

  /* ── Mutators ───────────────────────────────────────────── */
  const commitTopEdit = (raw: string) => {
    if (!topEdit) return;
    const n = raw.trim() === "" ? 0 : parseFloat(raw.replace(/[^0-9.-]/g, ""));
    // Only the current FY can have obligations — future FYs have no floor.
    const obligatedFloor = topEdit.fy === CURRENT_FY_IN_GRID
      ? (catData.find((c) => c.name === topEdit.cat)?.obligated ?? 0)
      : 0;
    const result = resolveAnnualPlanEdit(multiYear[topEdit.cat][topEdit.fy] ?? 0, n, obligatedFloor);
    if (result.accepted) {
      setMultiYear((p) => ({
        ...p,
        [topEdit.cat]: { ...p[topEdit.cat], [topEdit.fy]: result.amount },
      }));
    } else {
      toast({
        title: "Planned amount unchanged",
        description: Number.isFinite(n) && obligatedFloor > 0
          ? `${topEdit.cat} cannot be below ${fmt(obligatedFloor)} already obligated in ${topEdit.fy}.`
          : "Enter a valid, non-negative planned amount.",
        variant: "destructive",
      });
    }
    setTopEdit(null);
  };

  const commitQEdit = (raw: string) => {
    if (!qEdit) return;
    const requestedAmount = Math.max(0, parseFloat(raw.replace(/[^0-9.]/g, "")) || 0);
    const obligatedFloor = selectedQFY === CURRENT_FY_IN_GRID
      ? categoryObligationsByQuarter(qEdit.cat)[qEdit.qKey] ?? 0
      : 0;
    const newVal = clampQuarterPlanToObligationFloor(requestedAmount, obligatedFloor);
    setAllQuarters((p) => ({
      ...p,
      [selectedQFY]: {
        ...p[selectedQFY],
        [qEdit.cat]: { ...p[selectedQFY][qEdit.cat], [qEdit.qKey]: newVal },
      },
    }));
    setQEdit(null);
  };

  return (
    <Layout
      breadcrumb={
        <>
          <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">
            Home
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <Link href="/projects" className="text-slate-400 hover:text-slate-700 transition-colors">
            Projects
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <Link
            href={`/projects/${project.id}/settings`}
            className="text-slate-400 hover:text-slate-700 transition-colors truncate max-w-[160px]"
          >
            {project.name}
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="font-semibold text-slate-800">Planning</span>
        </>
      }
    >
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-slate-400 mb-0.5">{project.number}</p>
            <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
            <p className="text-sm text-slate-500 mt-1">
              Enterprise Project Management Plan &mdash; {CURRENT_FY} Funding
            </p>
          </div>
        </div>

        {/* ── Planning rules — TABLE 1 ── */}
        {!showAlloc && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-slate-700 space-y-2">
          <p className="font-semibold text-[#1a3557]">Multi-Year Funding Plan — Planning Rules</p>
          <ul className="space-y-1.5 list-none text-xs text-slate-600">
            <li className="flex gap-2">
              <span className="text-[#1a6ea8] font-bold flex-shrink-0">1.</span>
              <span><strong>Plan your entire project budget.</strong> The five-year total across all categories must equal the Approved Budget — Left to Plan must reach $0. Click any FY cell to enter or adjust an amount.</span>
            </li>
          </ul>
        </div>
        )}

        {/* ════════════════════════════════════════════════════
            TABLE 1 — Multi-year (FY25–FY29)
        ════════════════════════════════════════════════════ */}
        {!showAlloc && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div
            className="px-5 py-3 border-b border-slate-200 flex items-center justify-between"
            style={{ backgroundColor: HEADER_BG }}
          >
            <span className="text-white font-bold tracking-wide text-sm uppercase">
              Project Funding Plan
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-white/70">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: PAST_BG }} />
                Uneditable
              </span>
              <span className="flex items-center gap-1.5 text-white/70">
                <span className="inline-block w-3 h-3 rounded-sm border-2 border-slate-900 bg-amber-50" />
                Current request
              </span>
              <span className="flex items-center gap-1.5 text-white/70">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: GOLD_BG }} />
                Editable
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 620 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #cbd5e1", backgroundColor: "#f1f5f9" }}>
                  <th
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                    style={{ width: 160 }}
                  />
                  {FYS.map((fy) => (
                    <th
                      key={fy}
                      className="py-3 text-center text-xs font-bold tracking-wider"
                      style={{
                        backgroundColor: isPastFY(fy) ? PAST_BG : GOLD_BG,
                        color: isPastFY(fy) ? "#1e40af" : "#92400e",
                        borderLeft: "1px solid #e2e8f0",
                        minWidth: 100,
                        boxShadow: fy === CURRENT_FY_IN_GRID ? "inset 0 0 0 2px #0f172a" : "none",
                      }}
                    >
                      {fy}
                      {fy === CURRENT_FY_IN_GRID && (
                        <span className="ml-1.5 text-[9px] font-semibold uppercase opacity-60">
                          current
                        </span>
                      )}
                    </th>
                  ))}
                  <th
                    className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600"
                    style={{ borderLeft: "2px solid #94a3b8", minWidth: 100 }}
                  >
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((cat, ci) => {
                  const catTotal = FYS.reduce((s, fy) => s + (multiYear[cat]?.[fy] ?? 0), 0);
                  const rowBg    = ci % 2 === 0 ? "#ffffff" : "#f8fafc";
                  return (
                    <tr key={cat} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: rowBg }}>
                      <td className="px-4 py-3 font-semibold text-slate-700 text-sm">
                        {cat === "Outsourcing & Other" ? "Outsourced/Other" : cat}:
                      </td>
                      {FYS.map((fy) => {
                        const rawVal = multiYear[cat]?.[fy];          // null = unset
                        const val    = rawVal ?? 0;                   // 0 for math/display
                        const isNull = rawVal === null || rawVal === undefined;
                        const isPast  = isPastFY(fy);
                        const isCurrent = fy === CURRENT_FY_IN_GRID;
                        const isEdit = !isPast && topEdit?.cat === cat && topEdit?.fy === fy;
                        const catOblTotal = isCurrent
                          ? (catData.find((c) => c.name === cat)?.obligated ?? 0)
                          : 0;
                        return (
                          <td
                            key={fy}
                            className={isCurrent && !isEdit ? "group relative" : undefined}
                            style={{
                              backgroundColor: isPast ? PAST_BG : GOLD_BG,
                              borderLeft: "1px solid #e2e8f0",
                              padding: "8px 12px",
                              boxShadow: isCurrent ? "inset 0 0 0 2px #0f172a" : "none",
                              cursor: isPast ? "default" : undefined,
                            }}
                          >
                            {isEdit ? (
                              <input
                                autoFocus
                                type="text"
                                className="w-full text-right text-sm tabular-nums border rounded px-2 py-1 focus:outline-none"
                                style={{
                                  borderColor: "#fcd34d",
                                  backgroundColor: "#fffef0",
                                }}
                                value={topEditVal}
                                onChange={(e) => setTopEditVal(e.target.value)}
                                onBlur={(e) => commitTopEdit(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    commitTopEdit((e.target as HTMLInputElement).value);
                                  if (e.key === "Escape") setTopEdit(null);
                                }}
                              />
                            ) : isPast ? (
                              <span
                                className="block w-full text-right tabular-nums text-sm font-medium"
                                style={{ color: "#1e40af" }}
                              >
                                {fmt(val)}
                              </span>
                            ) : (
                              <>
                                <button
                                  className="w-full text-right tabular-nums text-sm font-medium transition-opacity hover:opacity-60"
                                  style={{ color: "#92400e", cursor: "pointer" }}
                                  onClick={() => { setTopEdit({ cat, fy }); setTopEditVal(isNull ? "" : String(val)); }}
                                  title="Click to edit"
                                >
                                  {isNull
                                    ? <span className="opacity-25 font-normal">—</span>
                                    : val > 0 ? fmt(val) : <span className="opacity-40">$0</span>}
                                </button>
                                {isCurrent && (
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block z-50 pointer-events-none" style={{ minWidth: 172 }}>
                                    <div className="bg-slate-900 text-white text-xs rounded-lg shadow-xl p-3 text-left">
                                      <p className="font-semibold text-slate-300 mb-1.5 text-[10px] uppercase tracking-wide">{cat}</p>
                                      <div className="flex justify-between gap-4">
                                        <span className="text-slate-400">YTD total</span>
                                        <span className="font-semibold tabular-nums text-white">{fmt(catOblTotal)}</span>
                                      </div>
                                    </div>
                                    <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1" />
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        );
                      })}
                      <td
                        className="px-4 py-3 text-right tabular-nums font-semibold text-slate-700 text-sm"
                        style={{ borderLeft: "2px solid #94a3b8" }}
                      >
                        {fmt(catTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #94a3b8", backgroundColor: "#f1f5f9" }}>
                  <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                    TOTAL:
                  </td>
                  {FYS.map((fy) => (
                    <td
                      key={fy}
                      className="py-3 text-right tabular-nums font-bold text-sm px-3"
                      style={{
                        backgroundColor: isPastFY(fy) ? PAST_BG : GOLD_BG,
                        borderLeft: "1px solid #e2e8f0",
                        color: isPastFY(fy) ? "#1e40af" : "#92400e",
                        boxShadow: fy === CURRENT_FY_IN_GRID ? "inset 0 0 0 2px #0f172a" : "none",
                      }}
                    >
                      {fmt(fyColTotal(fy))}
                    </td>
                  ))}
                  <td
                    className="px-4 py-3 text-right tabular-nums font-bold text-slate-800 text-sm"
                    style={{ borderLeft: "2px solid #94a3b8" }}
                  >
                    {fmt(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Summary strip */}
          <div
            className="border-t border-slate-200 px-5 py-3 flex flex-wrap items-center justify-end gap-x-8 gap-y-1 text-sm"
            style={{ backgroundColor: "#f8fafc" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide font-semibold text-slate-400">
                Total Planned ({CURRENT_FY})
              </span>
                <span className="tabular-nums font-bold text-slate-800">{fmt(liveTotalCurrentFY)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide font-semibold text-slate-400">
                Approved Budget
              </span>
              <span className="tabular-nums font-bold text-slate-800">{fmt(approvedBudget)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide font-semibold text-slate-400">
                Left to Plan
              </span>
              <span
                className="tabular-nums font-bold"
                style={{
                  color:
                    liveLeftToPlan > 0 ? "#b45309" : liveLeftToPlan < 0 ? "#b91c1c" : "#065f46",
                }}
              >
                {liveLeftToPlan < 0
                  ? `(${fmt(Math.abs(liveLeftToPlan))})`
                  : fmt(liveLeftToPlan)}
              </span>
            </div>
          </div>
        </div>
        )} {/* end !showAlloc Table 1 */}

        {/* ── Planning rules — TABLE 2 ── */}
        {!showAlloc && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-slate-700 space-y-2">
          <p className="font-semibold text-[#1a3557]">Quarterly Spending Plan — Planning Rules</p>
          <ul className="space-y-1.5 list-none text-xs text-slate-600">
            <li className="flex gap-2">
              <span className="text-[#1a6ea8] font-bold flex-shrink-0">1.</span>
              <span><strong>Plan at least one quarterly amount.</strong> Click any editable current or future quarter cell to enter a planned dollar amount for that category. Past quarters are read-only, and categories you leave blank will be treated as $0 for that quarter.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#1a6ea8] font-bold flex-shrink-0">2.</span>
              <span><strong>Each category's quarterly plan must balance against its selected {selectedQFY} annual amount.</strong> The sum of Q1 + Q2 + Q3 + Q4 for a category should equal the {selectedQFY} figure in the multi-year table above. The "Planning Diff" column shows you how far off each row is — a green "Balanced" badge means you are aligned.</span>
            </li>
          </ul>
        </div>
        )}

        {/* ════════════════════════════════════════════════════
            TABLE 2 — Quarterly Breakdown
            Category rows → Q1-Q4 planned (editable), past quarters read-only
        ════════════════════════════════════════════════════ */}
        {!showAlloc && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header bar */}
          <div
            className="px-5 pt-3.5 pb-2 border-b border-slate-200 flex flex-col gap-2"
            style={{ backgroundColor: HEADER_BG }}
          >
            {/* Row 1: title + dropdown  |  legend */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold tracking-wide text-sm">
                  Anticipated Spending Per Quarter
                </span>
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedQFY}
                    onChange={(e) => { setSelectedQFY(e.target.value as FY); setQEdit(null); }}
                    className="appearance-none pl-2 pr-6 py-0.5 rounded text-xs font-bold bg-white text-slate-800 cursor-pointer border-none outline-none"
                  >
                    {FYS.filter((f) => f === CURRENT_FY_IN_GRID || fyInScope(f)).map((f) => (
                      <option key={f} value={f}>{f}{f === CURRENT_FY_IN_GRID ? " (Current)" : ""}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs flex-shrink-0">
                <span className="flex items-center gap-1.5 text-white/70">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: PAST_BG }} />
                  Uneditable
                </span>
                <span className="flex items-center gap-1.5 text-white/70">
                  <span className="inline-block w-3 h-3 rounded-sm border-2 border-slate-900 bg-amber-50" />
                  Current request
                </span>
                <span className="flex items-center gap-1.5 text-white/70">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: GOLD_BG }} />
                  Editable
                </span>
              </div>
            </div>
            {/* Row 2: < prev year   next year > */}
            {(() => {
              const prevFY = selectedFYIdx > 0 && fyInScope(FYS[selectedFYIdx - 1]) ? FYS[selectedFYIdx - 1] : null;
              const nextFY = selectedFYIdx < FYS.length - 1 && fyInScope(FYS[selectedFYIdx + 1]) ? FYS[selectedFYIdx + 1] : null;
              return (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { if (prevFY) { setSelectedQFY(prevFY); setQEdit(null); } }}
                    disabled={!prevFY}
                    className="flex items-center gap-1 text-xs font-medium text-white/60 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={13} />
                    {prevFY ?? ""}
                  </button>
                  <button
                    onClick={() => { if (nextFY) { setSelectedQFY(nextFY); setQEdit(null); } }}
                    disabled={!nextFY}
                    className="flex items-center gap-1 text-xs font-medium text-white/60 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  >
                    {nextFY ?? ""}
                    <ChevronRight size={13} />
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Required callout */}
          <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2 flex-wrap text-xs text-slate-600">
            {selectedFYIdx < currentFYIdx ? (
              <span className="text-slate-500 italic">{selectedQFY} is a completed fiscal year — quarters are read-only.</span>
            ) : selectedFYIdx > currentFYIdx ? (
              <>
                <span className="font-semibold">Planning {selectedQFY}:</span>
                <span className="text-slate-400">Click any quarterly cell to enter a planned amount.</span>
              </>
            ) : (
              <>
                <span className="font-semibold">Planning required for:</span>
                {GOV_QUARTERS.filter((q) => isRequired(qStatuses[q.key])).map((q) => (
                  <span key={q.key} className="inline-flex items-center gap-1 font-bold border-2 border-slate-900 rounded px-1.5 py-0.5 text-slate-800">
                    {q.label} ({q.range})
                  </span>
                ))}
                <span className="text-slate-400">Click a cell to enter the planned amount for that category.</span>
              </>
            )}
          </div>

          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              style={{ borderCollapse: "collapse", minWidth: 720 }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #cbd5e1", backgroundColor: "#f1f5f9" }}>
                  {/* Category */}
                  <th
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                    style={{ width: 168 }}
                  >
                    Category
                  </th>
                  {/* Q1–Q4 */}
                  {GOV_QUARTERS.map((q) => {
                    const status = qStatuses[q.key];
                    const req    = isRequired(status);
                    const past   = isPastQ(status);
                    const obligatedRows = req
                      ? catData.map((c) => ({
                          name: c.name === "Outsourcing & Other" ? "Outsourced/Other" : c.name,
                          amt: c.people.reduce((s, p) => s + (p.obligatedByQ[q.key] ?? 0), 0),
                        }))
                      : [];
                    return (
                      <th
                        key={q.key}
                        className={`py-2 text-center text-xs font-bold tracking-wider${req ? " group relative" : ""}`}
                        style={{
                          backgroundColor: past ? PAST_BG : GOLD_BG,
                          color: past ? "#1e40af" : "#92400e",
                          borderLeft: "1px solid #e2e8f0",
                          minWidth: 96,
                          boxShadow: req ? "inset 0 0 0 2px #0f172a" : "none",
                        }}
                      >
                        {q.label}
                        <br />
                        <span className="text-[9px] font-normal opacity-70 normal-case">
                          {q.range}
                        </span>
                        {req && (
                          <span className="block text-[9px] font-bold uppercase tracking-widest mt-0.5 text-slate-700">
                            Obligated + Planned
                          </span>
                        )}
                        {req && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block z-50 pointer-events-none">
                            <div className="bg-slate-900 text-white text-xs rounded-lg shadow-xl p-3 w-48 text-left">
                              <p className="font-semibold text-slate-300 mb-1.5 text-[10px] uppercase tracking-wide">{q.label} Obligated</p>
                              <div className="space-y-1">
                                {obligatedRows.map((r) => (
                                  <div key={r.name} className="flex justify-between gap-3">
                                    <span className="text-slate-300 truncate">{r.name}</span>
                                    <span className="font-semibold tabular-nums text-white flex-shrink-0">{fmt(r.amt)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1" />
                          </div>
                        )}
                        {past && (
                          <span className="block text-[9px] font-normal uppercase opacity-50 mt-0.5">
                            Obligated
                          </span>
                        )}
                        {!req && !past && (
                          <span className="block text-[9px] font-normal uppercase opacity-50 mt-0.5">
                            Planned
                          </span>
                        )}
                      </th>
                    );
                  })}
                  {/* Total Planned for Year */}
                  <th
                    className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-500"
                    style={{ borderLeft: "1px solid #e2e8f0", minWidth: 92 }}
                  >
                    Total Planned for Year
                  </th>
                  {/* Planning Diff */}
                  <th
                    className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-500"
                    style={{ borderLeft: "1px solid #e2e8f0", minWidth: 88 }}
                  >
                    Planning Diff
                  </th>
                </tr>
              </thead>

              <tbody>
                {catData.map((cat, ci) => {
                  const rowBg   = ci % 2 === 0 ? "#ffffff" : "#f8fafc";
                  const catQSum = qSum(cat.name);
                  const diff    = qDiff(cat.name);
                  const annual  = selectedFYVal(cat.name);
                  return (
                    <Fragment key={cat.name}>
                      {/* ── Category row ── */}
                      <tr
                        style={{
                          borderBottom: "1px solid #e2e8f0",
                          backgroundColor: rowBg,
                        }}
                      >
                        {/* Name */}
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800">
                            {cat.name === "Outsourcing & Other"
                              ? "Outsourced/Other"
                              : cat.name}
                            {GOV_QUARTERS
                              .filter((q) => isRequired(qStatuses[q.key]) && (quarters[cat.name]?.[q.key] ?? 0) === 0)
                              .map((q) => (
                                <span key={q.key} className="block text-[10px] font-semibold text-red-500 leading-none mt-0.5">
                                  {q.label} plan required
                                </span>
                              ))}
                          </span>
                        </td>

                        {/* Q1–Q4 planned cells — past read-only, current/future editable */}
                        {GOV_QUARTERS.map((q) => {
                          const status = qStatuses[q.key];
                          const req    = isRequired(status);
                          const past   = isPastQ(status);
                          const isEdit = !past && qEdit?.cat === cat.name && qEdit?.qKey === q.key;
                          const val    = quarters[cat.name]?.[q.key] ?? 0;
                          return (
                            <td
                              key={q.key}
                              style={{
                                backgroundColor: past ? PAST_BG : GOLD_BG,
                                borderLeft: "1px solid #e2e8f0",
                                padding: "8px 12px",
                                boxShadow: req ? "inset 0 0 0 2px #0f172a" : "none",
                                cursor: past ? "default" : undefined,
                              }}
                            >
                              {isEdit ? (
                                <input
                                  autoFocus
                                  type="text"
                                  className="w-full text-right text-sm tabular-nums border rounded px-2 py-1 focus:outline-none"
                                  style={{ borderColor: "#fcd34d", backgroundColor: "#fffef0" }}
                                  defaultValue={String(val)}
                                  onBlur={(e) => commitQEdit(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") commitQEdit((e.target as HTMLInputElement).value);
                                    if (e.key === "Escape") setQEdit(null);
                                  }}
                                />
                              ) : past ? (
                                <span
                                  className="block w-full text-right tabular-nums text-sm font-medium"
                                  style={{ color: "#1e40af" }}
                                >
                                  {val > 0 ? fmt(val) : <span className="opacity-50">$0</span>}
                                </span>
                              ) : (
                                <button
                                  className="w-full text-right tabular-nums text-sm font-medium transition-opacity hover:opacity-60"
                                  style={{ color: "#92400e", cursor: "pointer" }}
                                  onClick={() => setQEdit({ cat: cat.name, qKey: q.key })}
                                  title="Click to enter planned amount"
                                >
                                  {val > 0 ? fmt(val) : <span className="opacity-30">—</span>}
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* Year Total */}
                        <td
                          className="px-4 py-3 text-right tabular-nums font-semibold text-slate-700 text-sm"
                          style={{ borderLeft: "1px solid #e2e8f0", backgroundColor: PAST_BG }}
                        >
                          {catQSum > 0 ? (
                            fmt(catQSum)
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Planning Diff */}
                        <td
                          className="px-4 py-3 text-right"
                          style={{ borderLeft: "1px solid #e2e8f0", backgroundColor: PAST_BG }}
                        >
                          {diff === 0 ? (
                            <span className="flex items-center justify-end gap-1 text-emerald-600">
                              <CheckCircle size={13} />
                              <span className="text-xs font-semibold">Balanced</span>
                            </span>
                          ) : isHistoricalFY ? (
                            <span className="text-xs font-bold tabular-nums text-slate-500">{fmtDelta(diff)}</span>
                          ) : (
                            (() => {
                              const editableKeys = GOV_QUARTERS
                                .filter((q) => !isPastQ(qStatuses[q.key]))
                                .map((q) => q.key);
                              const obligationFloors = selectedQFY === CURRENT_FY_IN_GRID
                                ? categoryObligationsByQuarter(cat.name)
                                : {};
                              const reductionCapacity = getQuarterSyncReductionCapacity(
                                quarters[cat.name] ?? {},
                                obligationFloors,
                                editableKeys
                              );
                              const canSync = diff > 0 || reductionCapacity >= Math.abs(diff);
                              return canSync ? (
                            <button
                              className="group inline-flex items-center justify-end gap-1.5 w-full"
                              title={
                                diff > 0
                                  ? `Click to add ${fmt(diff)} to ${balanceQuarterKey} and balance this row`
                                  : `Click to reduce editable quarter amounts by ${fmt(Math.abs(diff))} and balance this row`
                              }
                              onClick={() => {
                                setAllQuarters((prev) => {
                                  const cur = prev[selectedQFY][cat.name] ?? {};
                                  const updated = syncQuarterPlanToAnnual(
                                    cur,
                                    selectedFYVal(cat.name),
                                    obligationFloors,
                                    editableKeys,
                                    balanceQuarterKey
                                  );
                                  return { ...prev, [selectedQFY]: { ...prev[selectedQFY], [cat.name]: updated } };
                                });
                              }}
                            >
                              <span
                                className="text-xs font-bold tabular-nums"
                                style={{ color: diff > 0 ? "#b45309" : "#b91c1c" }}
                              >
                                {fmtDelta(diff)}
                              </span>
                              <span
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: "#1a3557", color: "white" }}
                              >
                                sync
                              </span>
                            </button>
                              ) : (
                                <span className="text-xs font-bold tabular-nums text-slate-500">{fmtDelta(diff)}</span>
                              );
                            })()
                          )}
                        </td>
                      </tr>

                    </Fragment>
                  );
                })}
              </tbody>

              <tfoot>
                <tr style={{ borderTop: "2px solid #94a3b8", backgroundColor: "#f1f5f9" }}>
                  <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                    TOTAL
                  </td>
                  {/* Q1–Q4 planned totals */}
                  {GOV_QUARTERS.map((q) => {
                    const qTotal = CATEGORIES.reduce(
                      (s, c) => s + (quarters[c]?.[q.key] ?? 0),
                      0
                    );
                    const past = isPastQ(qStatuses[q.key]);
                    const req  = isRequired(qStatuses[q.key]);
                    return (
                      <td
                        key={q.key}
                        className="py-3 text-right tabular-nums font-bold text-sm px-3"
                        style={{
                          backgroundColor: past ? PAST_BG : GOLD_BG,
                          borderLeft: "1px solid #e2e8f0",
                          color: past ? "#1e40af" : "#92400e",
                          boxShadow: req ? "inset 0 0 0 2px #0f172a" : "none",
                        }}
                      >
                        {qTotal > 0 ? fmt(qTotal) : <span className="opacity-30">$0</span>}
                      </td>
                    );
                  })}
                  <td
                    className="px-4 py-3 text-right tabular-nums font-bold text-slate-800 text-sm"
                    style={{ borderLeft: "1px solid #e2e8f0", backgroundColor: PAST_BG }}
                  >
                    {fmt(CATEGORIES.reduce((s, c) => s + qSum(c), 0))}
                  </td>
                  <td style={{ borderLeft: "1px solid #e2e8f0", backgroundColor: PAST_BG }} />
                </tr>
              </tfoot>
            </table>
          </div>

          <div
            className="border-t border-slate-100 px-5 py-2 flex items-center gap-2 text-[11px] text-slate-400"
            style={{ backgroundColor: "#f8fafc" }}
          >
            Use <span className="font-semibold text-slate-500">Request Change</span> to update planned amounts for current or future quarters.
          </div>
        </div>
        )} {/* end !showAlloc Table 2 */}

        {/* ── Actions bar ─────────────────────────────────── */}
        {!showAlloc && (
        <div
          className="rounded-xl border bg-white shadow-sm px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{
            borderLeft: `4px solid ${canRequestChange ? "#16a34a" : "#e2e8f0"}`,
            borderColor: canRequestChange ? "#bbf7d0" : "#e2e8f0",
          }}
        >
          <div>
            <h3 className="font-semibold text-slate-800">{CURRENT_QUARTER_KEY} {CURRENT_FY} Actions</h3>
            {canRequestChange ? (
              <p className="text-xs text-green-700 mt-0.5 font-medium">
                Full budget allocated and plan balanced — ready to submit.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">
                {leftToPlan !== 0
                  ? leftToPlan > 0
                    ? `Allocate ${fmt(leftToPlan)} more in the multi-year table before submitting.`
                    : `Multi-year plan exceeds budget by ${fmt(-leftToPlan)} — reduce planned amounts.`
                  : "Enter at least one planned quarterly amount before submitting."}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Request Change with tooltip */}
            <div className="relative group">
              <button
                disabled={!canRequestChange}
                onClick={() => {
                  if (!canRequestChange) return;
                  setAllocResources(buildAllocResources());
                  setAllocNonLabor(buildAllocNonLabor());
                  setShowAlloc(true);
                }}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                style={{
                  backgroundColor: canRequestChange ? "#1a3557" : "#e2e8f0",
                  color: canRequestChange ? "white" : "#94a3b8",
                  cursor: canRequestChange ? "pointer" : "not-allowed",
                }}
              >
                Request Change <ArrowRight size={15} />
              </button>
              {/* Tooltip — only when blocked */}
              {!canRequestChange && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50 w-72 pointer-events-none">
                  <div className="bg-slate-900 text-white text-xs rounded-lg shadow-xl p-3">
                    <p className="font-semibold mb-1.5 text-slate-200">Cannot request change:</p>
                    <ul className="space-y-1">
                      {blockingReasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="mt-0.5 text-amber-400 flex-shrink-0">•</span>
                          <span className="text-slate-300">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Arrow */}
                  <div className="absolute right-4 top-full w-0 h-0"
                    style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #0f172a" }} />
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* ── Resource Allocation Form (swaps in for quarterly table) ── */}
        {showAlloc && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* header */}
          <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "#1a3557" }}>
            <div>
              <div className="text-xs text-slate-300 uppercase tracking-wide">{CURRENT_QUARTER_KEY} {CURRENT_FY} · {CURRENT_QUARTER_DEF.range}</div>
              <div className="text-lg font-semibold text-white">Resource Allocation</div>
              <div className="text-xs text-slate-300 mt-0.5">Distribute each remaining unobligated amount across resources before submitting</div>
            </div>
            <button
              onClick={() => setShowAlloc(false)}
              className="text-slate-300 hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              ← Back to quarterly plan
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5">

            {/* ── LABOR ── */}
            <div className="rounded-lg border overflow-hidden"
                 style={{ borderColor: laborOver ? "#fca5a5" : laborDone ? "#86efac" : "#e2e8f0" }}>
              <div className="px-5 py-3 border-b flex items-center justify-between"
                   style={{ backgroundColor: "#f8fafc", borderColor: laborOver ? "#fca5a5" : laborDone ? "#86efac" : "#e2e8f0" }}>
                <div>
                  <span className="font-semibold text-slate-800">Labor</span>
                  <span className="ml-2 text-xs text-slate-500">Open-quarter unobligated plan</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="tabular-nums text-slate-600">
                    Available: <strong className="text-amber-700">{fmt(laborBucket)}</strong>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="tabular-nums text-slate-600">
                    {CURRENT_QUARTER_KEY} Obligated: <strong className="text-blue-700">{fmt(laborCurrentQuarterObligated)}</strong>
                  </span>
                  {laborNetChange !== 0 && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="tabular-nums text-slate-600">
                        Net Change:{" "}
                        <strong style={{ color: laborNetChange > 0 ? "#166534" : "#b91c1c" }}>
                          {fmtChange(laborNetChange)}
                        </strong>
                      </span>
                    </>
                  )}
                  <span className="text-slate-300">·</span>
                  <span className="tabular-nums text-slate-600">
                    Remaining:{" "}
                    <strong style={{ color: laborBucketRemaining < 0 ? "#b91c1c" : laborBucketRemaining === 0 ? "#166534" : "#92400e" }}>
                      {laborBucketRemaining < 0 ? `-${fmt(-laborBucketRemaining)}` : fmt(laborBucketRemaining)}
                    </strong>
                    {laborBucketRemaining < 0 && <span className="ml-1 text-[10px] font-semibold text-red-600 bg-red-50 rounded px-1">over</span>}
                  </span>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50">
                    <th className="py-2 px-4 text-left">Resource</th>
                    <th className="py-2 px-3 text-right">Obligated (this qtr)</th>
                    <th className="py-2 px-3 text-right">Open Commitments</th>
                    <th className="py-2 px-3 text-right w-36">Change</th>
                    <th className="py-2 px-3 text-right">New Open Commitments</th>
                    <th className="py-2 px-2 w-6" />
                  </tr>
                </thead>
                <tbody>
                  {allocResources.map((r) => {
                    const openCommit = r.committed - r.obligated;
                    const newOpenCommit = openCommit + r.change;
                    const isEditingChange = allocEdit?.id === r.id && allocEdit.field === "change";
                    const isEditingNoc   = allocEdit?.id === r.id && allocEdit.field === "noc";
                    return (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="py-2 px-4">
                          <div className="font-medium text-slate-800 text-sm">{r.name}</div>
                          {r.orgCode && <div className="text-[10px] text-slate-400 font-mono">{r.orgCode}</div>}
                        </td>
                        <td className="py-2 px-3 text-right text-sm tabular-nums text-blue-600">
                          {r.obligatedCurrentQuarter > 0 ? fmt(r.obligatedCurrentQuarter) : <span className="text-slate-300">$0</span>}
                        </td>
                        <td className="py-2 px-3 text-right text-sm tabular-nums text-slate-500">
                          {openCommit > 0 ? fmt(openCommit) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-2 px-3 w-36">
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-300"
                            style={{ color: r.change > 0 ? "#166534" : r.change < 0 ? "#b91c1c" : "#64748b", fontWeight: 600 }}
                            placeholder="$0"
                            value={isEditingChange ? allocEdit!.raw : fmtChange(r.change)}
                            onFocus={() => setAllocEdit({ id: r.id, field: "change", raw: r.change !== 0 ? String(r.change) : "" })}
                            onChange={(e) => {
                              setAllocEdit((a) => a ? { ...a, raw: e.target.value } : a);
                            }}
                            onBlur={() => {
                              const v = parseChange(allocEdit?.raw ?? "");
                              setAllocResources((p) => p.map((x) => x.id === r.id ? { ...x, change: v } : x));
                              setAllocEdit(null);
                            }}
                          />
                        </td>
                        <td className="py-2 px-3 w-40">
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-300"
                            style={{ color: newOpenCommit > 0 ? "#92400e" : newOpenCommit < 0 ? "#b91c1c" : "#64748b", fontWeight: 600 }}
                            placeholder="$0"
                            value={isEditingNoc ? allocEdit!.raw : (newOpenCommit !== 0 ? fmt(newOpenCommit) : "$0")}
                            onFocus={() => setAllocEdit({ id: r.id, field: "noc", raw: newOpenCommit !== 0 ? String(newOpenCommit) : "" })}
                            onChange={(e) => {
                              setAllocEdit((a) => a ? { ...a, raw: e.target.value } : a);
                            }}
                            onBlur={() => {
                              const parsed = Math.max(0, parseFloat(allocEdit?.raw?.replace(/[$,\s]/g, "") ?? "0") || 0);
                              setAllocResources((p) => p.map((x) => x.id === r.id ? { ...x, change: parsed - (x.committed - x.obligated) } : x));
                              setAllocEdit(null);
                            }}
                          />
                        </td>
                        <td className="py-2 px-2">
                          {r.isNew && (
                            <button className="text-slate-300 hover:text-red-400 text-lg leading-none transition-colors"
                              onClick={() => setAllocResources((p) => p.filter((x) => x.id !== r.id))}>×</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* add row — opens modal */}
                  <tr className="border-t border-slate-100">
                    <td colSpan={6} className="py-2 px-4">
                      <button className="flex items-center gap-1.5 text-xs font-semibold text-[#1a6ea8] hover:text-[#1a3557] transition-colors"
                        onClick={() => setAllocModalOpen(true)}>
                        <span className="text-base leading-none">+</span> Add labor resource
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase">Total</td>
                    <td className="py-2.5 px-3 text-right text-sm font-semibold text-blue-600 tabular-nums">{fmt(laborCurrentQuarterObligated)}</td>
                    <td className="py-2.5 px-3 text-right text-sm font-semibold text-slate-500 tabular-nums">{fmt(allocResources.reduce((s, r) => s + Math.max(0, r.committed - r.obligated), 0))}</td>
                    <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums"
                        style={{ color: laborNetChange > 0 ? "#166534" : laborNetChange < 0 ? "#b91c1c" : "#64748b" }}>
                      {fmtChange(laborNetChange)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm font-semibold tabular-nums"
                        style={{ color: "#92400e" }}>
                      {fmt(allocResources.reduce((s, r) => s + (r.committed - r.obligated + r.change), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── NON-LABOR ── */}
            <div className="flex flex-col gap-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Non-Labor Categories</div>
              {allocNonLabor.map((cat) => {
                const catTotal = cat.items.reduce((s, i) => s + i.amount, 0);
                const over = catTotal > cat.bucket && cat.bucket > 0;
                const under = catTotal < cat.bucket && cat.bucket > 0;
                const done = cat.bucket === 0 || (
                  cat.items.length > 0 && catTotal === cat.bucket &&
                  cat.items.every((i) => i.objectCode && i.amount > 0 && i.justification)
                );
                const removeItem = (id: string) =>
                  setAllocNonLabor((p) => p.map((c) => c.category === cat.category
                    ? { ...c, items: c.items.filter((i) => i.id !== id) } : c));
                const codes = NL_CODES[cat.category as keyof typeof NL_CODES] ?? [];
                return (
                  <div key={cat.category}
                    className="rounded-lg border overflow-hidden"
                    style={{ borderColor: over ? "#fca5a5" : done ? "#86efac" : under ? "#fcd34d" : "#e2e8f0" }}>

                    {/* Card header */}
                    <div className="px-4 py-3 flex items-center justify-between border-b"
                         style={{ backgroundColor: "#f8fafc", borderColor: over ? "#fca5a5" : done ? "#86efac" : under ? "#fcd34d" : "#e2e8f0" }}>
                      <span className="font-semibold text-slate-800 text-sm">{cat.category}</span>
                      <div className="flex items-center gap-3 text-xs">
                        {cat.bucket === 0
                          ? <span className="italic text-slate-400">No open-quarter amount planned — no allocation needed</span>
                          : <>
                              <span className="text-slate-500">
                                Available: <strong className="text-amber-700">{fmt(cat.bucket)}</strong>
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className={over ? "text-red-600" : "text-slate-500"}>
                                Allocated: <strong>{fmt(catTotal)}</strong>
                              </span>
                              <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full" style={{
                                  width: `${Math.min((catTotal / Math.max(cat.bucket, 1)) * 100, 100)}%`,
                                  backgroundColor: over ? "#dc2626" : done ? "#16a34a" : "#f59e0b",
                                }} />
                              </div>
                              {done && !over && <span className="font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">Complete</span>}
                              {under && <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Remaining {fmt(cat.bucket - catTotal)}</span>}
                              {over && <span className="font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">Over by {fmt(catTotal - cat.bucket)}</span>}
                            </>}
                      </div>
                    </div>

                    {cat.bucket > 0 && (
                      <div className="flex flex-col">
                        {/* Progress bar */}
                        <div className="h-1 w-full bg-slate-100 overflow-hidden">
                          <div className="h-full transition-all" style={{
                            width: `${Math.min((catTotal / cat.bucket) * 100, 100)}%`,
                            backgroundColor: over ? "#dc2626" : done ? "#16a34a" : "#f59e0b",
                          }} />
                        </div>

                        {/* Existing items */}
                        {cat.items.length > 0 && (
                          <div className="divide-y divide-slate-100">
                            {cat.items.map((item) => (
                              <div key={item.id} className="px-4 py-3 flex flex-col gap-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                      {item.objectCode}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {codes.find((c) => c.code === item.objectCode)?.label.split(" — ")[1] ?? ""}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-500">
                                      {item.quarter} ({GOV_QUARTERS.find((q) => q.key === item.quarter)?.range})
                                    </span>
                                    <span className="font-semibold text-slate-800">{fmt(item.amount)}</span>
                                    {item.vendor && (
                                      <span className="text-xs text-slate-400 italic">{item.vendor}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0 mt-0.5">
                                    <button
                                      onClick={() => editNlItem(cat.category, item)}
                                      className="text-slate-400 hover:text-blue-600 transition-colors"
                                      title="Edit"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      onClick={() => removeItem(item.id)}
                                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-snug">{item.justification}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add item button */}
                        <div className="px-4 py-3 border-t border-slate-100">
                          <button
                            onClick={() => openNlModal(cat.category)}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors flex items-center gap-1"
                          >
                            + Add {cat.category === "Travel" ? "travel line" : cat.category === "Contracts" ? "contract line" : "line item"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Submit footer ── */}
            <div className="rounded-xl border p-4 flex items-center justify-between"
              style={{
                backgroundColor: allocCanSubmit ? "#f0fdf4" : "#f8fafc",
                borderColor: allocCanSubmit ? "#86efac" : "#e2e8f0",
              }}>
              <div className="text-sm">
                {allocCanSubmit
                  ? <span className="font-semibold text-green-700">All open-quarter available amounts allocated — ready to submit {CURRENT_QUARTER_KEY} plan</span>
                  : <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-700">Complete all sections to submit</span>
                      <div className="flex flex-wrap gap-3 text-xs mt-0.5">
                        {!laborDone && !laborOver && laborBucket > 0 && <span className="text-amber-600">Labor: {fmt(laborBucketRemaining)} remaining</span>}
                        {laborOver && <span className="text-red-600">Labor: over by {fmt(-laborBucketRemaining)}</span>}
                        {allocNonLabor.filter((c) => {
                          if (c.bucket === 0) return false;
                          const total = c.items.reduce((s, i) => s + i.amount, 0);
                          return c.items.length === 0 || total !== c.bucket || c.items.some((i) => !i.objectCode || !i.amount || !i.justification);
                        }).map((c) => (
                          <span key={String(c.category)} className="text-amber-600">{c.category}: incomplete</span>
                        ))}
                      </div>
                    </div>}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowAlloc(false)}
                  className="text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg px-4 py-2 transition-colors">
                  Cancel
                </button>
                <button disabled={!allocCanSubmit}
                  onClick={submitQuarterPlan}
                  className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: allocCanSubmit ? "#1a3557" : "#e2e8f0",
                    color: allocCanSubmit ? "white" : "#94a3b8",
                    cursor: allocCanSubmit ? "pointer" : "not-allowed",
                  }}>
                  Submit {CURRENT_QUARTER_KEY} Plan
                </button>
              </div>
            </div>

          </div>
        </div>
        )}
      </div>

      {user.role === "Admin" && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            right: 0,
            width: 40,
            height: 40,
            opacity: 0,
            cursor: "default",
            zIndex: 9999,
          }}
          onClick={() => navigate(legacyPath)}
          aria-hidden="true"
        />
      )}

      {/* ── Full Plan ghost button — lower-left ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: 40,
          height: 40,
          opacity: 0,
          cursor: "default",
          zIndex: 9999,
        }}
        onClick={() => navigate(legacyPath)}
        aria-hidden="true"
      />

      {/* ── Submission Confirmation Modal ── */}
      {showSubmitConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(15,23,42,0.45)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100" style={{ backgroundColor: "#1a3557" }}>
              <div className="text-white font-semibold text-base">{CURRENT_QUARTER_KEY} Plan Submitted</div>
              <div className="text-slate-300 text-xs mt-0.5">{CURRENT_FY} Resource Allocation Request</div>
            </div>
            <div className="px-6 py-6 flex flex-col gap-3">
              <p className="text-sm text-slate-700 leading-relaxed">
                Your {CURRENT_QUARTER_KEY} resource allocation plan has been submitted for review. The BA / Budget Analyst will be notified and a confirmation will be sent once the plan is approved.
              </p>
              <p className="text-xs text-slate-400">
                Submitted: {CURRENT_FISCAL_PERIOD.today.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => navigate("/projects")}
                className="text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 bg-white rounded-lg px-4 py-2 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  setShowAlloc(false);
                }}
                className="text-sm font-semibold rounded-lg px-5 py-2 text-white transition-colors"
                style={{ backgroundColor: "#1a3557" }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Non-Labor Line Item Modal ── */}
      {nlModal.open && nlModal.category && (() => {
        const codes = NL_CODES[nlModal.category as keyof typeof NL_CODES] ?? [];
        const catBucket = allocNonLabor.find((c) => c.category === nlModal.category)?.bucket ?? 0;
        const catSpent  = (allocNonLabor.find((c) => c.category === nlModal.category)?.items ?? [])
          .reduce((sum, item) => sum + (item.id === nlModal.editingItemId ? 0 : item.amount), 0);
        const remaining = catBucket - catSpent;
        const amtNum    = parseInt(nlModal.amount.replace(/[^0-9]/g, ""), 10) || 0;
        const canAdd    = !!nlModal.code && amtNum > 0 && amtNum <= remaining && !!nlModal.justification.trim();
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(15,23,42,0.45)" }}
            onClick={(e) => { if (e.target === e.currentTarget) closeNlModal(); }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              {/* Modal header */}
              <div className="px-6 py-4 border-b border-slate-100" style={{ backgroundColor: "#1a3557" }}>
                <div className="text-white font-semibold text-base">{nlModal.editingItemId ? "Edit" : "Add"} {nlModal.category} Line Item</div>
                <div className="text-slate-300 text-xs mt-0.5">
                  Available: {fmt(catBucket)} &nbsp;·&nbsp; Remaining: {fmt(remaining)}
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4">
                {/* Object Code */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Object Code <span className="text-red-400">*</span>
                  </label>
                  {nlModal.category === "Travel" ? (
                    <div className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-700">
                      TRAVEL
                    </div>
                  ) : (
                  <select
                    autoFocus
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                    value={nlModal.code}
                    onChange={(e) => setNlModal((s) => ({ ...s, code: e.target.value }))}
                  >
                    <option value="">— Select object code —</option>
                    {codes.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  )}
                </div>

                {/* Quarter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Quarter <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    {GOV_QUARTERS
                      .filter((q) => getQStatus(q, today) !== "past")
                      .map((q) => (
                      <button key={q.key}
                        onClick={() => setNlModal((s) => ({ ...s, quarter: q.key }))}
                        className="flex-1 py-1.5 text-sm font-semibold rounded-lg border transition-all"
                        style={{
                          backgroundColor: nlModal.quarter === q.key ? "#1a3557" : "white",
                          borderColor:     nlModal.quarter === q.key ? "#1a3557" : "#e2e8f0",
                          color:           nlModal.quarter === q.key ? "white"   : "#475569",
                        }}>
                        {q.label} ({q.range})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount + Vendor */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Amount <span className="text-red-400">*</span>
                    </label>
                    <input type="text"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="$0"
                      value={nlModal.amount}
                      onChange={(e) => setNlModal((s) => ({ ...s, amount: e.target.value.replace(/[^0-9]/g, "") }))}
                    />
                    {amtNum > 0 && amtNum > remaining && (
                      <p className="text-[11px] text-red-500 mt-1">Exceeds remaining {fmt(remaining)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      {nlModal.category === "Contracts" ? "Contractor / Vendor" : "Recipient / Program"}
                      <span className="text-slate-300 font-normal normal-case ml-1">(optional)</span>
                    </label>
                    <input type="text"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder={nlModal.category === "Contracts" ? "Contractor Name" : "e.g. CERL"}
                      value={nlModal.vendor}
                      onChange={(e) => setNlModal((s) => ({ ...s, vendor: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Justification */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Justification / Purpose <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                    placeholder="Describe the purpose, mission need, or reason for this request…"
                    value={nlModal.justification}
                    onChange={(e) => setNlModal((s) => ({ ...s, justification: e.target.value }))}
                  />
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button onClick={closeNlModal}
                  className="text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 bg-white rounded-lg px-4 py-2 transition-colors">
                  Cancel
                </button>
                <button
                  disabled={!canAdd}
                  onClick={submitNlModal}
                  className="text-sm font-semibold rounded-lg px-5 py-2 transition-all"
                  style={{
                    backgroundColor: canAdd ? "#1a3557" : "#e2e8f0",
                    color:           canAdd ? "white"   : "#94a3b8",
                    cursor:          canAdd ? "pointer" : "not-allowed",
                  }}>
                  {nlModal.editingItemId ? "Save Changes" : "Add Line Item"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add Labor Resource Modal ── */}
      {allocModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(15,23,42,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeAllocModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100" style={{ backgroundColor: "#1a3557" }}>
              <div className="text-white font-semibold text-base">Add Labor Resource</div>
              <div className="text-slate-300 text-xs mt-0.5">Employee, contractor, or district / org unit</div>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Type toggle */}
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Resource Type</div>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                  {(["individual", "org"] as const).map((t) => (
                    <button key={t}
                      onClick={() => { setAllocModalType(t); setAllocModalName(""); setAllocModalOrgCode(""); }}
                      className="flex-1 py-2 text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: allocModalType === t ? "#1a3557" : "white",
                        color: allocModalType === t ? "white" : "#475569",
                      }}>
                      {t === "individual" ? "Individual / Employee" : "District / Org Unit"}
                    </button>
                  ))}
                </div>
              </div>

              {allocModalType === "individual" ? (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Employee Name <span className="text-red-400">*</span>
                    </label>
                    <select
                      autoFocus
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                      value={allocModalName}
                      onChange={(e) => {
                        const person = ERDC_PERSONNEL.find((p) => p.name === e.target.value);
                        setAllocModalName(e.target.value);
                        setAllocModalOrgCode(person?.orgCode ?? "");
                      }}
                    >
                      <option value="">— Select employee —</option>
                      <optgroup label="ERDC PERSONNEL">
                        {ERDC_PERSONNEL.map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Org / UIC Code
                    </label>
                    <input type="text"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="auto-filled from selection"
                      value={allocModalOrgCode}
                      onChange={(e) => setAllocModalOrgCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Org / Lab / District <span className="text-red-400">*</span>
                  </label>
                  <select
                    autoFocus
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                    value={allocModalName}
                    onChange={(e) => {
                      const [name, code] = e.target.value.split("||");
                      setAllocModalName(name ?? "");
                      setAllocModalOrgCode(code ?? "");
                    }}
                  >
                    <option value="">— Select org —</option>
                    {ERDC_ORGS.map((grp) => (
                      <optgroup key={grp.group} label={grp.group}>
                        {grp.items.map((item) => (
                          <option key={item.code} value={`${item.name}||${item.code}`}>
                            {item.name} ({item.code})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {allocModalOrgCode && (
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">
                      UIC: {allocModalOrgCode}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={closeAllocModal}
                className="text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 bg-white rounded-lg px-4 py-2 transition-colors">
                Cancel
              </button>
              <button
                disabled={!allocModalName.trim()}
                onClick={submitAllocModal}
                className="text-sm font-semibold rounded-lg px-5 py-2 transition-all"
                style={{
                  backgroundColor: allocModalName.trim() ? "#1a3557" : "#e2e8f0",
                  color: allocModalName.trim() ? "white" : "#94a3b8",
                  cursor: allocModalName.trim() ? "pointer" : "not-allowed",
                }}>
                Add Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
