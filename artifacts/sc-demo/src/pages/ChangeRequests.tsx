import { useState } from "react";
import { Link } from "wouter";
import {
  ChevronRight, Filter, FileText, CheckCircle, XCircle,
  Search, FolderPlus
} from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_CHANGE_REQUESTS, ChangeRequest } from "@/lib/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";

export default function ChangeRequests() {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null);
  const [actionReason, setActionReason] = useState("");

  const filteredCRs = MOCK_CHANGE_REQUESTS.filter(cr => {
    const matchesStatus = filterStatus === "All" || cr.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      cr.proposedNumber.toLowerCase().includes(q) ||
      cr.proposedName.toLowerCase().includes(q) ||
      cr.submittedBy.toLowerCase().includes(q);
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

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const handleOpen = (cr: ChangeRequest) => { setSelectedCR(cr); setActionReason(""); };
  const handleClose = () => { setSelectedCR(null); setActionReason(""); };

  const handleAction = (action: "Approve" | "Reject") => {
    const verb = action === "Approve" ? "approved" : "rejected";
    toast({
      title: `Proposal ${verb}`,
      description: action === "Approve"
        ? `${selectedCR!.proposedNumber} — ${selectedCR!.proposedName} has been approved and will be created in the project list.`
        : actionReason.trim()
          ? `Rejected: ${actionReason.trim()}`
          : `${selectedCR!.proposedNumber} proposal has been rejected.`,
      variant: action === "Approve" ? "default" : "destructive",
    });
    handleClose();
  };

  const isActionable = (status: ChangeRequest["status"]) =>
    status !== "Approved" && status !== "Rejected";

  return (
    <Layout roleBadge="BA View" breadcrumb={<>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300" />
      <span className="font-semibold text-slate-800">Change Requests</span>
    </>}>
      <div className="flex flex-col h-full space-y-6">

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
                  <th className="px-6 py-4 font-semibold">Proposed Project</th>
                  <th className="px-6 py-4 font-semibold text-right">Project Amount</th>
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Proponent</th>
                  <th className="px-6 py-4 font-semibold hidden sm:table-cell">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCRs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
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
                      onClick={() => handleOpen(cr)}
                      data-testid={`row-cr-${cr.id}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono font-semibold text-xs text-slate-500">{cr.proposedNumber}</div>
                        <div className="font-medium text-slate-900 truncate max-w-[200px]">{cr.proposedName}</div>
                      </td>
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
      <Dialog open={!!selectedCR} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0">
          {selectedCR && (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-0.5">
                    <FolderPlus size={16} className="text-primary/70" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proposed Project</span>
                  </div>
                  <DialogTitle className="text-lg font-bold text-slate-900 pr-8 leading-snug">
                    <span className="font-mono text-sm text-slate-500 mr-2">{selectedCR.proposedNumber}</span>
                    {selectedCR.proposedName}
                  </DialogTitle>
                  <div className="flex items-center gap-3 mt-1.5">
                    {getStatusBadge(selectedCR.status)}
                    <DialogDescription className="text-sm text-slate-500 m-0">
                      Submitted on {selectedCR.date} &mdash; Proponent: {selectedCR.submittedBy}
                    </DialogDescription>
                  </div>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-5">
                {/* Project description */}
                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedCR.proposedDescription}
                </p>

                {/* Funding request details */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Project Amount</div>
                  <div className="font-bold text-2xl text-slate-900">{fmt(selectedCR.amount)}</div>
                </div>

                {/* Justification */}
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Justification</div>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {selectedCR.justification}
                  </p>
                </div>
              </div>

              {/* Reason field — only when actionable */}
              {isActionable(selectedCR.status) && (
                <div className="px-6 pb-4">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Reason
                  </label>
                  <textarea
                    rows={3}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Provide a reason for your decision…"
                    className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                    data-testid="textarea-action-reason"
                  />
                </div>
              )}

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
                >
                  Close
                </button>
                {isActionable(selectedCR.status) && (
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
                      <CheckCircle size={16} /> Approve &amp; Create Project
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
