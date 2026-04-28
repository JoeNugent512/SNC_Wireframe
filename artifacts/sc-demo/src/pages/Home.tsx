import { Link } from "wouter";
import { PlusCircle, FileSpreadsheet, FolderEdit, ArrowRight, AlertTriangle } from "lucide-react";
import Layout from "@/components/Layout";
import { PENDING_SETUP_PROJECTS, MOCK_PROJECTS, MOCK_CHANGE_REQUESTS } from "@/lib/mockData";

export default function Home() {
  const activeProjectCount  = MOCK_PROJECTS.filter((p) => p.status === "Active").length;
  const pendingRequestCount = MOCK_CHANGE_REQUESTS.filter((cr) =>
    ["Pending", "First Request", "Under Review"].includes(cr.status)
  ).length;
  const setupQueueCount = PENDING_SETUP_PROJECTS.length;

  return (
    <Layout title="Dashboard">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, John.</h2>
          <p className="text-slate-500 mt-1">Here is your quick access panel for today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Set Up New Project */}
          <Link href="/setup" className="group">
            <div className="bg-amber-50/60 p-6 rounded-xl border border-amber-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all cursor-pointer h-full flex flex-col justify-between" data-testid="action-new-project">
              <div>
                <div className="relative w-12 h-12 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <PlusCircle className="text-amber-600" size={24} />
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
                <h3 className="text-lg font-semibold text-slate-900">Set Up New Project</h3>
                <p className="text-sm text-slate-500 mt-2">Complete EPMP charter data for newly picked-up projects awaiting BA setup.</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-2xl font-bold text-amber-700">{setupQueueCount}</span>
                  <span className="text-sm text-amber-700/80">project{setupQueueCount !== 1 ? "s" : ""} in queue</span>
                </div>
              </div>
              <div className="flex items-center text-amber-600 text-sm font-medium mt-6 group-hover:translate-x-1 transition-transform">
                View setup queue <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </Link>

          {/* Process Funding Request */}
          <Link href="/change-requests" className="group">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col justify-between" data-testid="action-process-funding">
              <div>
                <div className="relative w-12 h-12 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <FileSpreadsheet className="text-indigo-600" size={24} />
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
                <h3 className="text-lg font-semibold text-slate-900">Process Funding Request</h3>
                <p className="text-sm text-slate-500 mt-2">Review, approve, or reject pending change requests and budget reallocations.</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-2xl font-bold text-indigo-700">{pendingRequestCount}</span>
                  <span className="text-sm text-indigo-700/80">request{pendingRequestCount !== 1 ? "s" : ""} pending review</span>
                </div>
              </div>
              <div className="flex items-center text-indigo-600 text-sm font-medium mt-6 group-hover:translate-x-1 transition-transform">
                View requests <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </Link>

          {/* Edit Budget Plan */}
          <Link href="/projects" className="group">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col justify-between" data-testid="action-edit-plan">
              <div>
                <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-slate-100 transition-colors">
                  <FolderEdit className="text-slate-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Budget Plan</h3>
                <p className="text-sm text-slate-500 mt-2">Access existing projects to update labor, travel, and material allocations.</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-800">{activeProjectCount}</span>
                  <span className="text-sm text-slate-500">active project{activeProjectCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="flex items-center text-primary text-sm font-medium mt-6 group-hover:translate-x-1 transition-transform">
                Browse projects <ArrowRight size={16} className="ml-1" />
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
                  End of month financial reconciliation begins in 3 days. Please ensure all active projects have their current month labor hours submitted and approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
