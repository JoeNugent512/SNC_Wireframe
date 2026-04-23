import { Link } from "wouter";
import { ChevronRight, ClipboardList, ArrowRight, AlertCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { PENDING_SETUP_PROJECTS, SetupProject } from "@/lib/mockData";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const REQUIRED_FIELDS: (keyof SetupProject)[] = [
  "pmName", "dwgCoP", "hqProponent", "executingOrg", "projectLead",
  "needsContractSupport", "startDate", "endDate", "primaryCmsLink", "cmsGuestLink",
];

function completionOf(p: SetupProject) {
  const filled = REQUIRED_FIELDS.filter((f) => {
    const v = p[f];
    return v !== "" && v !== null && v !== undefined;
  }).length;
  return { filled, total: REQUIRED_FIELDS.length, pct: Math.round((filled / REQUIRED_FIELDS.length) * 100) };
}

export default function SetupQueue() {
  const breadcrumb = (
    <>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
      <span className="font-semibold text-slate-800">Project Setup Queue</span>
    </>
  );

  return (
    <Layout breadcrumb={breadcrumb}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
            <ClipboardList size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Project Setup Queue</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Projects recently picked up that require a BA to complete the EPMP charter data.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {PENDING_SETUP_PROJECTS.map((p) => {
            const { filled, total, pct } = completionOf(p);
            const missing = total - filled;
            return (
              <Link key={p.id} href={`/setup/${p.id}`}>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer p-5 flex items-center gap-5">

                  {/* Left: progress ring substitute — colored bar */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1 w-14">
                    <span className={`text-lg font-bold ${pct === 100 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}>
                      {pct}%
                    </span>
                    <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">{filled}/{total}</span>
                  </div>

                  {/* Middle: project info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-semibold text-slate-500">{p.number}</span>
                      {missing > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          <AlertCircle size={10} /> {missing} field{missing !== 1 ? "s" : ""} missing
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{p.description}</div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>Est. {fmt(p.estimatedBudget)}</span>
                      <span>Received {new Date(p.receivedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span>Source: <span className="font-mono">{p.sourceRef}</span></span>
                    </div>
                  </div>

                  {/* Right: arrow */}
                  <div className="flex-shrink-0 text-slate-400 group-hover:text-amber-500 transition-colors">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
