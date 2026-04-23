import { useState, useMemo } from "react";
import { Link, useParams, useLocation } from "wouter";
import { Home, Settings, ChevronRight, AlignJustify } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

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
  const fy = scNumber.slice(0, 2); // e.g. "25" from "25A001"
  return [
    {
      id: 1,
      employeeOrg: "Nugent, Joseph Pat",
      totalPlanned: 10000,
      totalRequested: 500,
      totalCommitments: 500,
      openCommitments: 300,
      obligated: 200,
      description: `FY${fy}/SANDC LABOR FUNDS FOR ${scNumber}/CEFMS name/`,
      notes: "notes",
    },
    {
      id: 2,
      employeeOrg: "U435310",
      totalPlanned: 20000,
      totalRequested: 19000,
      totalCommitments: 19000,
      openCommitments: 10000,
      obligated: 9000,
      description: `FY${fy}/SANDC LABOR FUNDS FOR ${scNumber}/org code/`,
      notes: "notes",
    },
  ];
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export default function ProjectPlanning() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const projectId = params.id;
  const project = MOCK_PROJECTS.find((p) => p.id === projectId);

  const [labor] = useState<LaborRow[]>(() => makeInitialLabor(project?.number ?? ""));
  const toa = project?.budget ?? 0;
  const planned = useMemo(
    () => labor.reduce((s, r) => s + r.totalPlanned, 0),
    [labor]
  );
  const leftToPlan = toa - planned;

  const handleSubmit = () => {
    toast({
      title: "Plan submitted successfully",
      description: "Your plan has been sent for review.",
    });
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-600">
        Project not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5]">
      {/* ── TOP HEADER BAR ── */}
      <header className="bg-[#1a3557] text-white flex items-stretch min-h-[52px]">
        {/* LEFT: breadcrumb */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-r border-white/20 flex-shrink-0">
          <Link href="/" data-testid="nav-home-icon">
            <Home size={16} className="text-white/80 hover:text-white transition-colors" />
          </Link>
          <ChevronRight size={13} className="text-white/50" />
          <Link
            href="/projects"
            className="text-white/80 hover:text-white text-sm font-medium transition-colors"
            data-testid="nav-project-list"
          >
            Project List
          </Link>
          <ChevronRight size={13} className="text-white/50" />
          <span className="text-white text-sm font-semibold bg-white/20 px-2 py-0.5 rounded">
            {project.number}
          </span>
        </div>

        {/* CENTER: TOA / Planned / Left to Plan */}
        <div className="flex-1 flex items-center justify-center gap-6 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/60 font-medium uppercase tracking-wide text-xs">TOA</span>
            <span className="font-bold text-white text-base">{fmt(toa)}</span>
          </div>
          <div className="text-white/30 text-lg">/</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/60 font-medium uppercase tracking-wide text-xs">Planned</span>
            <span className="font-bold text-white text-base">{fmt(planned)}</span>
          </div>
          <div className="text-white/30 text-lg">/</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/60 font-medium uppercase tracking-wide text-xs">Left to Plan</span>
            <span
              className={`font-bold text-base ${leftToPlan < 0 ? "text-red-300" : "text-emerald-300"}`}
            >
              {fmt(leftToPlan)}
            </span>
          </div>
        </div>

        {/* RIGHT: Request button + hamburger */}
        <div className="flex items-center gap-2 px-4 py-2 border-l border-white/20 flex-shrink-0">
          <button
            className="text-xs font-medium bg-[#2a5080] hover:bg-[#3a6090] border border-white/30 text-white px-3 py-1.5 rounded transition-colors"
            data-testid="button-request-quarter"
          >
            Request through quarter
          </button>
          <button
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            data-testid="button-hamburger"
          >
            <AlignJustify size={20} className="text-white" />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 p-5 pb-24 overflow-x-auto">
        {/* LABOR TABLE */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm mb-5">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-base font-bold text-slate-800">Labor</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[900px]">
              <thead>
                <tr>
                  {/* Gray header columns */}
                  <th className="border border-slate-300 bg-slate-200 text-slate-700 font-semibold px-3 py-2 text-left text-xs w-[160px]">
                    Employee/org code
                  </th>
                  <th className="border border-slate-300 bg-slate-200 text-slate-700 font-semibold px-3 py-2 text-right text-xs w-[110px]">
                    Total Planned
                  </th>
                  <th className="border border-slate-300 bg-slate-200 text-slate-700 font-semibold px-3 py-2 text-right text-xs w-[110px]">
                    Total Requested
                  </th>
                  {/* Blue header columns */}
                  <th className="border border-slate-300 bg-[#1a6ea8] text-white font-semibold px-3 py-2 text-right text-xs w-[120px]">
                    Total Commitments
                  </th>
                  <th className="border border-slate-300 bg-[#1a6ea8] text-white font-semibold px-3 py-2 text-right text-xs w-[120px]">
                    Open Commitments
                  </th>
                  <th className="border border-slate-300 bg-[#1a6ea8] text-white font-semibold px-3 py-2 text-right text-xs w-[100px]">
                    Obligated
                  </th>
                  {/* Gray again */}
                  <th className="border border-slate-300 bg-slate-200 text-slate-700 font-semibold px-3 py-2 text-left text-xs">
                    Description
                  </th>
                  <th className="border border-slate-300 bg-slate-100 text-slate-700 font-semibold px-3 py-2 text-left text-xs w-[90px]">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {labor.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}
                    data-testid={`row-labor-${row.id}`}
                  >
                    <td className="border border-slate-200 px-3 py-2 font-medium text-slate-800">
                      {row.employeeOrg}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">
                      {fmt(row.totalPlanned)}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">
                      {fmt(row.totalRequested)}
                    </td>
                    {/* Blue cells */}
                    <td className="border border-slate-200 px-3 py-2 text-right font-medium text-slate-900 bg-[#5ab4e8]/25">
                      {fmt(row.totalCommitments)}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-medium text-slate-900 bg-[#5ab4e8]/25">
                      {fmt(row.openCommitments)}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-medium text-slate-900 bg-[#5ab4e8]/25">
                      {fmt(row.obligated)}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600 text-xs">
                      {row.description}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-500 text-xs">
                      {row.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5 mt-5">
            {/* TRAVEL TABLE */}
            <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h2 className="text-base font-bold text-slate-800">Travel</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr>
                      <th className="border border-slate-300 bg-slate-200 text-slate-700 font-semibold px-3 py-2 text-left text-xs">Description</th>
                      <th className="border border-slate-300 bg-slate-200 text-slate-700 font-semibold px-3 py-2 text-right text-xs w-[100px]">Total Planned</th>
                      <th className="border border-slate-300 bg-slate-200 text-slate-700 font-semibold px-3 py-2 text-right text-xs w-[110px]">Total Requested</th>
                      <th className="border border-slate-300 bg-[#1a6ea8] text-white font-semibold px-3 py-2 text-right text-xs w-[120px]">Total Commitments</th>
                      <th className="border border-slate-300 bg-[#1a6ea8] text-white font-semibold px-3 py-2 text-right text-xs w-[120px]">Open Commitments</th>
                      <th className="border border-slate-300 bg-[#1a6ea8] text-white font-semibold px-3 py-2 text-right text-xs w-[100px]">Obligated</th>
                      <th className="border border-slate-300 bg-slate-100 text-slate-700 font-semibold px-3 py-2 text-left text-xs w-[90px]">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 1, desc: "Site Visits", planned: 3400, requested: 3400, commits: 3400, open: 2000, obligated: 1400, notes: "" },
                      { id: 2, desc: "Equipment Transport", planned: 2400, requested: 2400, commits: 2400, open: 1200, obligated: 1200, notes: "" },
                    ].map((row, idx) => (
                      <tr key={row.id} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                        <td className="border border-slate-200 px-3 py-2 text-slate-800">{row.desc}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">{fmt(row.planned)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">{fmt(row.requested)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right bg-[#5ab4e8]/25">{fmt(row.commits)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right bg-[#5ab4e8]/25">{fmt(row.open)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right bg-[#5ab4e8]/25">{fmt(row.obligated)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-500 text-xs">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MATERIALS TABLE */}
            <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h2 className="text-base font-bold text-slate-800">Materials &amp; Other</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr>
                      <th className="border border-slate-300 bg-slate-200 text-slate-700 font-semibold px-3 py-2 text-left text-xs">Description</th>
                      <th className="border border-slate-300 bg-slate-200 text-slate-700 font-semibold px-3 py-2 text-right text-xs w-[100px]">Total Planned</th>
                      <th className="border border-slate-300 bg-slate-200 text-slate-700 font-semibold px-3 py-2 text-right text-xs w-[110px]">Total Requested</th>
                      <th className="border border-slate-300 bg-[#1a6ea8] text-white font-semibold px-3 py-2 text-right text-xs w-[120px]">Total Commitments</th>
                      <th className="border border-slate-300 bg-[#1a6ea8] text-white font-semibold px-3 py-2 text-right text-xs w-[120px]">Open Commitments</th>
                      <th className="border border-slate-300 bg-[#1a6ea8] text-white font-semibold px-3 py-2 text-right text-xs w-[100px]">Obligated</th>
                      <th className="border border-slate-300 bg-slate-100 text-slate-700 font-semibold px-3 py-2 text-left text-xs w-[90px]">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 1, desc: "Concrete (500 units)", planned: 75000, requested: 75000, commits: 75000, open: 40000, obligated: 35000, notes: "" },
                      { id: 2, desc: "Steel Rebar (2000 units)", planned: 50000, requested: 50000, commits: 50000, open: 25000, obligated: 25000, notes: "" },
                    ].map((row, idx) => (
                      <tr key={row.id} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                        <td className="border border-slate-200 px-3 py-2 text-slate-800">{row.desc}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">{fmt(row.planned)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right text-slate-700">{fmt(row.requested)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right bg-[#5ab4e8]/25">{fmt(row.commits)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right bg-[#5ab4e8]/25">{fmt(row.open)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right bg-[#5ab4e8]/25">{fmt(row.obligated)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-500 text-xs">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      </main>

      {/* ── BOTTOM FOOTER BAR ── */}
      <footer className="fixed bottom-0 w-full bg-[#1a3557] flex items-center justify-between px-4 py-2 z-10">
        {/* Back button */}
        <Link href="/projects" data-testid="nav-back">
          <button className="bg-[#2a5080] hover:bg-[#3a6090] border border-white/30 text-white font-bold px-6 py-2 rounded text-sm transition-colors">
            &lt;
          </button>
        </Link>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          className="bg-[#2a5080] hover:bg-[#3a6090] border border-white/30 text-white font-semibold px-16 py-2 rounded text-sm transition-colors"
          data-testid="button-submit-plan"
        >
          Submit
        </button>

        {/* Settings icon */}
        <Link href={`/projects/${project.id}/settings`} data-testid="nav-settings">
          <button className="bg-[#2a5080] hover:bg-[#3a6090] border border-white/30 text-white p-2 rounded transition-colors">
            <Settings size={18} />
          </button>
        </Link>
      </footer>

      <Toaster />
    </div>
  );
}
