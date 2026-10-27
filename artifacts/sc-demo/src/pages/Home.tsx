import { useState } from "react";
import { Link, useLocation } from "wouter";
import { PlusCircle, FileSpreadsheet, FolderEdit, ArrowRight, AlertTriangle, BarChart2 } from "lucide-react";
import Layout from "@/components/Layout";
import { PENDING_SETUP_PROJECTS, MOCK_PROJECTS, MOCK_CHANGE_REQUESTS } from "@/lib/mockData";
import { useUser } from "@/lib/userContext";

function daysUntilEndOfMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((lastDay.getTime() - now.getTime()) / msPerDay);
}

export default function Home() {
  const { user } = useUser();
  const [powerBiTooltipVisible, setPowerBiTooltipVisible] = useState(false);
  const [, navigate] = useLocation();

  const firstName = user.name.split(" ")[0];
  const daysLeft = daysUntilEndOfMonth();
  const canAccessCR = user.role === "Admin" || user.role === "Budget Analyst" || user.role === "Program Team";

  const activeProjectCount = user.role === "Project Lead"
    ? MOCK_PROJECTS.filter((p) => p.projectLead === user.name && p.status === "Active").length
    : user.role === "Proponent"
    ? MOCK_PROJECTS.filter((p) => p.hqProponent === user.name && p.status === "Active").length
    : MOCK_PROJECTS.filter((p) => p.status === "Active").length;

  const pendingRequestCount = MOCK_CHANGE_REQUESTS.filter((cr) =>
    cr.status === "Pending Approval"
  ).length;
  const setupQueueCount = PENDING_SETUP_PROJECTS.length;
  // 3 cards for roles without CR access, 4 for Admin/Budget Analyst
  const gridClass = canAccessCR
    ? "grid-cols-1 sm:grid-cols-4"
    : "grid-cols-1 sm:grid-cols-3";

  return (
    <Layout title="Dashboard">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {firstName}.</h2>
          <p className="text-slate-500 mt-1">Here is your quick access panel for today.</p>
        </div>

        <div className={`grid ${gridClass} gap-5`}>
          {/* Edit Budget Plan */}
          <Link href="/projects" className="group">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col justify-between" data-testid="action-edit-plan">
              <div>
                <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center mb-5 group-hover:bg-slate-100 transition-colors">
                  <FolderEdit className="text-slate-600" size={30} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Edit Budget Plan</h3>
                <p className="text-sm text-slate-500 mt-2">Access existing projects to update labor, travel, and material allocations.</p>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-3xl font-bold text-slate-800">{activeProjectCount}</span>
                  <span className="text-sm text-slate-500">active project{activeProjectCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="flex items-center text-primary text-sm font-medium mt-8 group-hover:translate-x-1 transition-transform">
                Browse projects <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </Link>

          {/* Process Funding Request — only visible to Admin and Budget Analyst */}
          {canAccessCR && <Link href="/change-requests" className="group">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col justify-between" data-testid="action-process-funding">
              <div>
                <div className="relative w-16 h-16 mb-5">
                  <div className="w-16 h-16 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <FileSpreadsheet className="text-indigo-600" size={30} />
                  </div>
                  {pendingRequestCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                      title={`${pendingRequestCount} request${pendingRequestCount !== 1 ? "s" : ""} pending review`}
                    >
                      {pendingRequestCount}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Process Funding Request</h3>
                <p className="text-sm text-slate-500 mt-2">Review, approve, or reject pending change requests and budget reallocations.</p>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-3xl font-bold text-indigo-700">{pendingRequestCount}</span>
                  <span className="text-sm text-indigo-700/80">request{pendingRequestCount !== 1 ? "s" : ""} pending review</span>
                </div>
              </div>
              <div className="flex items-center text-indigo-600 text-sm font-medium mt-8 group-hover:translate-x-1 transition-transform">
                View requests <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </Link>}

          {/* Power BI Dashboard */}
          <div className="group relative">
            <div
              className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-900/30 transition-all cursor-default h-full flex flex-col justify-between"
              data-testid="action-power-bi"
              onClick={() => setPowerBiTooltipVisible((v) => !v)}
            >
              <div>
                <div className="w-16 h-16 rounded-xl bg-blue-950 flex items-center justify-center mb-5">
                  <BarChart2 className="text-blue-200" size={30} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Power BI Dashboard</h3>
                <p className="text-sm text-slate-500 mt-2">View live S&amp;C financial metrics, burn rates, and portfolio analytics.</p>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-900/60 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">External link</span>
                </div>
              </div>
              <div className="flex items-center text-blue-900/60 text-sm font-medium mt-8">
                Opens externally <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Opens the S&amp;C Power BI dashboard (external link)
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800" />
            </div>
          </div>

          {/* Set Up New Project */}
          <Link href="/setup" className="group">
            <div className="bg-amber-50/60 p-8 rounded-xl border border-amber-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all cursor-pointer h-full flex flex-col justify-between" data-testid="action-new-project">
              <div>
                <div className="relative w-16 h-16 mb-5">
                  <div className="w-16 h-16 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <PlusCircle className="text-amber-600" size={30} />
                  </div>
                  {setupQueueCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                      title={`${setupQueueCount} project${setupQueueCount !== 1 ? "s" : ""} awaiting setup`}
                    >
                      {setupQueueCount}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Set Up New Project</h3>
                <p className="text-sm text-slate-500 mt-2">Complete EPMP charter data for newly picked-up projects awaiting BA setup.</p>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-3xl font-bold text-amber-700">{setupQueueCount}</span>
                  <span className="text-sm text-amber-700/80">project{setupQueueCount !== 1 ? "s" : ""} in queue</span>
                </div>
              </div>
              <div className="flex items-center text-amber-600 text-sm font-medium mt-8 group-hover:translate-x-1 transition-transform">
                View setup queue <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </Link>
        </div>

        <div className="pt-8">
          <div className="bg-slate-800 rounded-xl overflow-hidden relative flex" style={{ borderLeft: "4px solid #f59e0b" }}>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-700 rounded-full opacity-50 blur-3xl"></div>
            <div className="relative z-10 flex items-start gap-3 p-6">
              <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg mb-1 text-white">System Notice</h3>
                <p className="text-slate-300 text-sm max-w-2xl">
                  End of month financial reconciliation begins in {daysLeft} {daysLeft === 1 ? "day" : "days"}. Please ensure all active projects have their current month labor hours submitted and approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invisible hotspot — security by obscurity, no visible indicator */}
      <div
        style={{ position: "fixed", bottom: 0, left: 0, width: 40, height: 40, opacity: 0, cursor: "default", zIndex: 9999 }}
        onClick={() => navigate("/scratch")}
        aria-hidden="true"
      />
    </Layout>
  );
}
