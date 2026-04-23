import { Link } from "wouter";
import { PlusCircle, FileSpreadsheet, FolderEdit, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";

export default function Home() {
  return (
    <Layout title="Dashboard">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, John.</h2>
          <p className="text-slate-500 mt-1">Here is your quick access panel for today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/projects" className="group">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col justify-between" data-testid="action-new-project">
              <div>
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <PlusCircle className="text-primary" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Set Up New Project</h3>
                <p className="text-sm text-slate-500 mt-2">Initialize a new S&C project, allocate initial budget, and assign team members.</p>
              </div>
              <div className="flex items-center text-primary text-sm font-medium mt-6 group-hover:translate-x-1 transition-transform">
                Start setup <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </Link>

          <Link href="/change-requests" className="group">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col justify-between" data-testid="action-process-funding">
              <div>
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  <FileSpreadsheet className="text-indigo-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Process Funding Request</h3>
                <p className="text-sm text-slate-500 mt-2">Review, approve, or reject pending change requests and budget reallocations.</p>
              </div>
              <div className="flex items-center text-indigo-600 text-sm font-medium mt-6 group-hover:translate-x-1 transition-transform">
                View requests <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </Link>

          <Link href="/projects" className="group">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col justify-between" data-testid="action-edit-plan">
              <div>
                <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-slate-100 transition-colors">
                  <FolderEdit className="text-slate-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Plan</h3>
                <p className="text-sm text-slate-500 mt-2">Access existing projects to update labor, travel, and material allocations.</p>
              </div>
              <div className="flex items-center text-slate-600 text-sm font-medium mt-6 group-hover:translate-x-1 transition-transform">
                Browse projects <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </Link>
        </div>

        <div className="pt-8">
          <div className="bg-slate-800 rounded-xl p-6 text-white overflow-hidden relative">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-700 rounded-full opacity-50 blur-3xl"></div>
            <div className="relative z-10">
              <h3 className="font-semibold text-lg mb-1">System Notice</h3>
              <p className="text-slate-300 text-sm max-w-2xl">
                End of month financial reconciliation begins in 3 days. Please ensure all active projects have their current month labor hours submitted and approved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
