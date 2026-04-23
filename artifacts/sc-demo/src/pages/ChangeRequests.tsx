import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Filter, FileText, CheckCircle, XCircle, Search, TrendingUp, TrendingDown } from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_CHANGE_REQUESTS, MOCK_PROJECTS, ChangeRequest } from "@/lib/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";

function typeLabel(cr: ChangeRequest) {
  return `${cr.category} — ${cr.target} — ${cr.direction}`;
}

export default function ChangeRequests() {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null);

  const enrichedCRs = MOCK_CHANGE_REQUESTS.map(cr => ({
    ...cr,
    projectName: MOCK_PROJECTS.find(p => p.id === cr.projectId)?.name ?? "Unknown Project",
    projectNumber: MOCK_PROJECTS.find(p => p.id === cr.projectId)?.number ?? "",
  }));

  const filteredCRs = enrichedCRs.filter(cr => {
    const matchesStatus = filterStatus === "All" || cr.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      cr.projectName.toLowerCase().includes(q) ||
      cr.projectNumber.toLowerCase().includes(q) ||
      cr.category.toLowerCase().includes(q) ||
      cr.target.toLowerCase().includes(q) ||
      cr.direction.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ChangeRequest["status"]) => {
    switch (status) {
      case "Approved":     return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</span>;
      case "Pending":      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Pending</span>;
      case "Under Review": return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Under Review</span>;
      case "Rejected":     return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">Rejected</span>;
    }
  };

  const getDirectionBadge = (direction: ChangeRequest["direction"]) =>
    direction === "Increase" ? (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
        <TrendingUp size={11} /> Increase
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
        <TrendingDown size={11} /> Decrease
      </span>
    );

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const handleAction = (action: "Approve" | "Reject") => {
    toast({
      title: `Request ${action}d`,
      description: `${typeLabel(selectedCR!)} has been ${action.toLowerCase()}d.`,
      variant: action === "Approve" ? "default" : "destructive",
    });
    setSelectedCR(null);
  };

  const selectedEnriched = selectedCR
    ? enrichedCRs.find(c => c.id === selectedCR.id)
    : null;

  return (
    <Layout title="Change Requests" roleBadge="BA View">
      <div className="flex flex-col h-full space-y-6">
        <nav className="text-sm font-medium text-slate-500 flex items-center">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <ChevronRight size={16} className="mx-1 text-slate-400" />
          <span className="text-slate-900">Change Requests</span>
        </nav>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
          {/* ── Toolbar ── */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search requests..."
                className="pl-9 h-9 text-sm bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-crs"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter size={16} className="text-slate-400" />
              <div className="w-40">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-filter-status">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Project</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Target</th>
                  <th className="px-6 py-4 font-semibold">Direction</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Submitted By</th>
                  <th className="px-6 py-4 font-semibold hidden sm:table-cell">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCRs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
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
                      onClick={() => setSelectedCR(cr)}
                      data-testid={`row-cr-${cr.id}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono font-semibold text-slate-900 text-xs">{cr.projectNumber}</div>
                        <div className="text-slate-500 text-xs truncate max-w-[180px]">{cr.projectName}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{cr.category}</td>
                      <td className="px-6 py-4 text-slate-600">{cr.target}</td>
                      <td className="px-6 py-4">{getDirectionBadge(cr.direction)}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">{fmt(cr.amount)}</td>
                      <td className="px-6 py-4 text-slate-600 hidden md:table-cell">{cr.submittedBy}</td>
                      <td className="px-6 py-4 text-slate-600 hidden sm:table-cell">{cr.date}</td>
                      <td className="px-6 py-4">{getStatusBadge(cr.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <Dialog open={!!selectedCR} onOpenChange={(open) => !open && setSelectedCR(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0">
          {selectedCR && selectedEnriched && (
            <>
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-slate-900 pr-8">
                    {selectedCR.category} — {selectedCR.target}
                  </DialogTitle>
                  <div className="flex items-center gap-3 mt-1">
                    {getStatusBadge(selectedCR.status)}
                    <DialogDescription className="text-sm text-slate-500 m-0">
                      Submitted on {selectedCR.date} by {selectedCR.submittedBy}
                    </DialogDescription>
                  </div>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Project</div>
                    <div className="font-medium text-slate-900">{selectedEnriched.projectNumber} — {selectedEnriched.projectName}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Direction</div>
                    <div>{getDirectionBadge(selectedCR.direction)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount</div>
                    <div className={`font-bold text-lg ${selectedCR.direction === "Increase" ? "text-emerald-700" : "text-red-700"}`}>
                      {selectedCR.direction === "Decrease" ? "−" : "+"}{fmt(selectedCR.amount)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Justification</div>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {selectedCR.justification}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedCR(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
                >
                  Close
                </button>
                {selectedCR.status !== "Approved" && selectedCR.status !== "Rejected" && (
                  <>
                    <button
                      onClick={() => handleAction("Reject")}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors flex items-center gap-1.5"
                      data-testid="button-cr-reject"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button
                      onClick={() => handleAction("Approve")}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
                      data-testid="button-cr-approve"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Toaster />
    </Layout>
  );
}
