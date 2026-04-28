import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Filter, FileText, Search } from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_CHANGE_REQUESTS, MOCK_PROJECTS, ChangeRequest } from "@/lib/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

function getProponent(projectNumber: string) {
  return MOCK_PROJECTS.find(p => p.number === projectNumber)?.hqProponent ?? "—";
}

function StatusBadge({ status }: { status: ChangeRequest["status"] }) {
  const map: Record<string, string> = {
    "First Request": "bg-violet-100 text-violet-800 border-violet-200",
    Approved:      "bg-emerald-100 text-emerald-800 border-emerald-200",
    Pending:       "bg-blue-100 text-blue-800 border-blue-200",
    "Under Review":"bg-amber-100 text-amber-800 border-amber-200",
    Rejected:      "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status]}`}>
      {status}
    </span>
  );
}

export default function ChangeRequests() {
  const [, navigate] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCRs = MOCK_CHANGE_REQUESTS.filter(cr => {
    const matchesStatus = filterStatus === "All" || cr.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      cr.projectNumber.toLowerCase().includes(q) ||
      cr.projectName.toLowerCase().includes(q) ||
      cr.submittedBy.toLowerCase().includes(q) ||
      cr.lineItems.some(li =>
        li.resource.toLowerCase().includes(q) || li.orgCode.toLowerCase().includes(q)
      );
    return matchesStatus && matchesSearch;
  });

  return (
    <Layout roleBadge="BA View" breadcrumb={<>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300" />
      <span className="font-semibold text-slate-800">Change Requests</span>
    </>}>
      <div className="flex flex-col h-full space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">

          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search by project, resource, org code…"
                className="pl-9 h-9 text-sm bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter size={16} className="text-slate-400" />
              <div className="w-40">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="First Request">First Request</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Project</th>
                  <th className="px-6 py-4 font-semibold hidden lg:table-cell">Proponent</th>
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Submitted By</th>
                  <th className="px-6 py-4 font-semibold hidden sm:table-cell">Date Submitted</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCRs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={32} className="text-slate-300 mb-3" />
                        <p>No change requests found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCRs.map((cr) => (
                    <tr
                      key={cr.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/change-requests/${cr.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono font-semibold text-xs text-slate-400">{cr.projectNumber}</div>
                        <div className="font-medium text-slate-900 truncate max-w-[200px]">{cr.projectName}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 hidden lg:table-cell">{getProponent(cr.projectNumber)}</td>
                      <td className="px-6 py-4 text-slate-600 hidden md:table-cell">{cr.submittedBy}</td>
                      <td className="px-6 py-4 text-slate-500 hidden sm:table-cell">{cr.date}</td>
                      <td className="px-6 py-4"><StatusBadge status={cr.status} /></td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-primary whitespace-nowrap">Review &rarr;</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
