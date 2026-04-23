import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight, Settings } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";

interface LaborRow {
  id: number;
  employeeOrg: string;
  totalPlanned: number;
  totalRequested: number;
  totalCommitments: number;
  openCommitments: number;
  obligated: number;
  description: string;
  notes: string;
}

const makeInitialLabor = (scNumber: string): LaborRow[] => {
  const fy = scNumber.slice(0, 2);
  return [
    { id: 1, employeeOrg: "Nugent, Joseph Pat", totalPlanned: 10000, totalRequested: 500, totalCommitments: 500, openCommitments: 300, obligated: 200, description: `FY${fy}/SANDC LABOR FUNDS FOR ${scNumber}/CEFMS name/`, notes: "notes" },
    { id: 2, employeeOrg: "U435310", totalPlanned: 20000, totalRequested: 19000, totalCommitments: 19000, openCommitments: 10000, obligated: 9000, description: `FY${fy}/SANDC LABOR FUNDS FOR ${scNumber}/org code/`, notes: "notes" },
  ];
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const TableCols = () => (
  <colgroup>
    <col className="w-[160px]" />
    <col className="w-[105px]" />
    <col className="w-[105px]" />
    <col className="w-[120px]" />
    <col className="w-[120px]" />
    <col className="w-[100px]" />
    <col />
    <col className="w-[180px]" />
  </colgroup>
);

const thGray = "border border-slate-300 bg-slate-200 text-slate-700 font-semibold px-3 py-2 text-xs";
const thBlue = "border border-slate-300 bg-[#1a6ea8] text-white font-semibold px-3 py-2 text-xs";
const thNote = "border border-slate-300 bg-slate-100 text-slate-700 font-semibold px-3 py-2 text-xs text-left";

export default function ProjectPlanning() {
  const params = useParams();
  const { toast } = useToast();

  const projectId = params.id;
  const project = MOCK_PROJECTS.find((p) => p.id === projectId);

  const [labor] = useState<LaborRow[]>(() => makeInitialLabor(project?.number ?? ""));
  const toa = project?.budget ?? 0;
  const planned = useMemo(() => labor.reduce((s, r) => s + r.totalPlanned, 0), [labor]);
  const leftToPlan = toa - planned;

  const handleSubmit = () => {
    toast({ title: "Plan submitted successfully", description: "Your plan has been sent for review." });
  };

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
      <div className="space-y-5">

        {/* ── Big modern stat bubbles ── */}
        <div className="grid grid-cols-3 gap-4">
          {/* TOA */}
          <div className="bg-[#1a3557] rounded-2xl px-6 py-5 flex flex-col gap-1.5 shadow-md">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/50">TOA</span>
            <span className="text-3xl font-bold text-white leading-none">{fmt(toa)}</span>
            <span className="text-xs text-white/40">Total Obligating Authority</span>
          </div>
          {/* Planned */}
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 flex flex-col gap-1.5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Planned</span>
            <span className="text-3xl font-bold text-slate-900 leading-none">{fmt(planned)}</span>
            <span className="text-xs text-slate-400">Amount currently planned</span>
          </div>
          {/* Left to Plan */}
          <div className={`rounded-2xl px-6 py-5 flex flex-col gap-1.5 shadow-sm border ${
            leftToPlan < 0
              ? "bg-red-50 border-red-200"
              : "bg-emerald-50 border-emerald-200"
          }`}>
            <span className={`text-xs font-semibold uppercase tracking-widest ${leftToPlan < 0 ? "text-red-400" : "text-emerald-600"}`}>Left to Plan</span>
            <span className={`text-3xl font-bold leading-none ${leftToPlan < 0 ? "text-red-600" : "text-emerald-700"}`}>{fmt(leftToPlan)}</span>
            <span className={`text-xs ${leftToPlan < 0 ? "text-red-400" : "text-emerald-500"}`}>
              {leftToPlan < 0 ? "Over budget" : "Remaining to allocate"}
            </span>
          </div>
        </div>

        {/* ── LABOR TABLE ── */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-base font-bold text-slate-800">Labor</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm border-collapse min-w-[1050px]">
              <TableCols />
              <thead>
                <tr>
                  <th className={`${thGray} text-left`}>Employee / Org Code</th>
                  <th className={`${thGray} text-right`}>Total Planned</th>
                  <th className={`${thGray} text-right`}>Total Requested</th>
                  <th className={`${thBlue} text-right`}>Total Commitments</th>
                  <th className={`${thBlue} text-right`}>Open Commitments</th>
                  <th className={`${thBlue} text-right`}>Obligated</th>
                  <th className={`${thGray} text-left`}>Description</th>
                  <th className={thNote}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {labor.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"} data-testid={`row-labor-${row.id}`}>
                    <td className="border border-slate-200 px-3 py-2 font-medium text-slate-800 truncate">{row.employeeOrg}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">{fmt(row.totalPlanned)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">{fmt(row.totalRequested)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-medium text-slate-900 bg-[#5ab4e8]/25">{fmt(row.totalCommitments)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-medium text-slate-900 bg-[#5ab4e8]/25">{fmt(row.openCommitments)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-medium text-slate-900 bg-[#5ab4e8]/25">{fmt(row.obligated)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600 text-xs truncate">{row.description}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600 text-sm">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── TRAVEL TABLE ── */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-base font-bold text-slate-800">Travel</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm border-collapse min-w-[1050px]">
              <TableCols />
              <thead>
                <tr>
                  <th className={`${thGray} text-left`}>Travel Line</th>
                  <th className={`${thGray} text-right`}>Total Planned</th>
                  <th className={`${thGray} text-right`}>Total Requested</th>
                  <th className={`${thBlue} text-right`}>Total Commitments</th>
                  <th className={`${thBlue} text-right`}>Open Commitments</th>
                  <th className={`${thBlue} text-right`}>Obligated</th>
                  <th className={`${thGray} text-left`}>Description</th>
                  <th className={thNote}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 1, label: "Site Visits",         planned: 3400,  requested: 3400,  commits: 3400,  open: 2000, obligated: 1400, description: "FY25/SANDC TRAVEL FOR 25A01/Site Visits/",     notes: "" },
                  { id: 2, label: "Equipment Transport", planned: 2400,  requested: 2400,  commits: 2400,  open: 1200, obligated: 1200, description: "FY25/SANDC TRAVEL FOR 25A01/Equip Transport/", notes: "" },
                ].map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                    <td className="border border-slate-200 px-3 py-2 font-medium text-slate-800 truncate">{row.label}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">{fmt(row.planned)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">{fmt(row.requested)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right bg-[#5ab4e8]/25">{fmt(row.commits)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right bg-[#5ab4e8]/25">{fmt(row.open)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right bg-[#5ab4e8]/25">{fmt(row.obligated)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600 text-xs truncate">{row.description}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600 text-sm">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── MATERIALS TABLE ── */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-base font-bold text-slate-800">Materials &amp; Other</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm border-collapse min-w-[1050px]">
              <TableCols />
              <thead>
                <tr>
                  <th className={`${thGray} text-left`}>Item</th>
                  <th className={`${thGray} text-right`}>Total Planned</th>
                  <th className={`${thGray} text-right`}>Total Requested</th>
                  <th className={`${thBlue} text-right`}>Total Commitments</th>
                  <th className={`${thBlue} text-right`}>Open Commitments</th>
                  <th className={`${thBlue} text-right`}>Obligated</th>
                  <th className={`${thGray} text-left`}>Description</th>
                  <th className={thNote}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 1, label: "Concrete (500 units)",     planned: 75000, requested: 75000, commits: 75000, open: 40000, obligated: 35000, description: "FY25/SANDC MATL FOR 25A01/Concrete/500 units", notes: "" },
                  { id: 2, label: "Steel Rebar (2000 units)", planned: 50000, requested: 50000, commits: 50000, open: 25000, obligated: 25000, description: "FY25/SANDC MATL FOR 25A01/Rebar/2000 units",   notes: "" },
                ].map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                    <td className="border border-slate-200 px-3 py-2 font-medium text-slate-800 truncate">{row.label}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">{fmt(row.planned)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">{fmt(row.requested)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right bg-[#5ab4e8]/25">{fmt(row.commits)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right bg-[#5ab4e8]/25">{fmt(row.open)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right bg-[#5ab4e8]/25">{fmt(row.obligated)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600 text-xs truncate">{row.description}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600 text-sm">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="flex justify-center pt-2 pb-6">
          <button
            onClick={handleSubmit}
            className="bg-[#1a3557] hover:bg-[#243f6a] text-white font-semibold px-16 py-2.5 rounded text-sm transition-colors shadow-sm"
            data-testid="button-submit-plan"
          >
            Submit
          </button>
        </div>

      </div>
      <Toaster />
    </Layout>
  );
}
