import { useState } from "react";
import { Link } from "wouter";
import {
  ChevronRight, Filter, FileText, CheckCircle, XCircle,
  Search, TrendingUp, TrendingDown, FolderOpen, User
} from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_CHANGE_REQUESTS, ChangeRequest, CRLineItem } from "@/lib/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function netChange(cr: ChangeRequest) {
  return cr.lineItems.reduce((sum, li) =>
    li.direction === "Increase" ? sum + li.amount : sum - li.amount, 0);
}

function typeColor(type: CRLineItem["type"]) {
  if (type === "Labor")     return "bg-blue-50 text-blue-700 border-blue-200";
  if (type === "Travel")    return "bg-violet-50 text-violet-700 border-violet-200";
  return                           "bg-slate-50 text-slate-600 border-slate-200";
}

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
      cr.projectNumber.toLowerCase().includes(q) ||
      cr.projectName.toLowerCase().includes(q) ||
      cr.submittedBy.toLowerCase().includes(q) ||
      cr.lineItems.some(li => li.description.toLowerCase().includes(q));
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

  const handleOpen = (cr: ChangeRequest) => { setSelectedCR(cr); setActionReason(""); };
  const handleClose = () => { setSelectedCR(null); setActionReason(""); };

  const handleAction = (action: "Approve" | "Reject") => {
    const verb = action === "Approve" ? "approved" : "rejected";
    toast({
      title: `Change request ${verb}`,
      description: action === "Approve"
        ? `${selectedCR!.projectNumber} — ${selectedCR!.projectName} budget change has been approved.`
        : actionReason.trim()
          ? `Rejected: ${actionReason.trim()}`
          : `${selectedCR!.projectNumber} change request has been rejected.`,
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
                  <th className="px-6 py-4 font-semibold">Project</th>
                  <th className="px-6 py-4 font-semibold">Changes</th>
                  <th className="px-6 py-4 font-semibold text-right">Net Change</th>
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Submitted By</th>
                  <th className="px-6 py-4 font-semibold hidden sm:table-cell">Requested</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
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
                  filteredCRs.map((cr) => {
                    const net = netChange(cr);
                    return (
                      <tr
                        key={cr.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleOpen(cr)}
                        data-testid={`row-cr-${cr.id}`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-mono font-semibold text-xs text-slate-500">{cr.projectNumber}</div>
                          <div className="font-medium text-slate-900 truncate max-w-[200px]">{cr.projectName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {cr.lineItems.map((li, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border ${typeColor(li.type)}`}
                              >
                                {li.direction === "Increase"
                                  ? <TrendingUp size={10} />
                                  : <TrendingDown size={10} />}
                                {li.description}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium tabular-nums">
                          <span className={net > 0 ? "text-emerald-700" : net < 0 ? "text-red-600" : "text-slate-600"}>
                            {net > 0 ? "+" : ""}{fmt(net)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 hidden md:table-cell">{cr.submittedBy}</td>
                        <td className="px-6 py-4 text-slate-600 hidden sm:table-cell">{cr.date}</td>
                        <td className="px-6 py-4">{getStatusBadge(cr.status)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <Dialog open={!!selectedCR} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
          {selectedCR && (() => {
            const net = netChange(selectedCR);
            return (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-0.5">
                      <FolderOpen size={15} className="text-primary/70" />
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Change Request</span>
                    </div>
                    <DialogTitle className="text-lg font-bold text-slate-900 pr-8 leading-snug">
                      <span className="font-mono text-sm text-slate-500 mr-2">{selectedCR.projectNumber}</span>
                      {selectedCR.projectName}
                    </DialogTitle>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {getStatusBadge(selectedCR.status)}
                      <DialogDescription className="text-sm text-slate-500 m-0 flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        <strong className="text-slate-700 font-semibold">{selectedCR.submittedBy}</strong>
                        <span className="text-slate-400">·</span>
                        {selectedCR.date}
                      </DialogDescription>
                    </div>
                  </DialogHeader>
                </div>

                <div className="overflow-y-auto flex-1">
                  <div className="p-6 space-y-5">

                    {/* Overview */}
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Overview</div>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                        {selectedCR.projectDescription}
                      </p>
                    </div>

                    {/* Line Items */}
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Requested Changes</div>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                        {selectedCR.lineItems.map((li, i) => (
                          <div key={i} className={`flex items-center justify-between px-4 py-3 ${
                            li.direction === "Increase" ? "bg-emerald-50/40" : "bg-red-50/40"
                          }`}>
                            <div className="flex items-center gap-3">
                              {li.direction === "Increase"
                                ? <TrendingUp size={16} className="text-emerald-600 flex-shrink-0" />
                                : <TrendingDown size={16} className="text-red-500 flex-shrink-0" />}
                              <div>
                                <div className="text-sm font-semibold text-slate-800">
                                  {li.direction} {li.type}: {li.description}
                                </div>
                              </div>
                            </div>
                            <div className={`text-sm font-bold tabular-nums ${
                              li.direction === "Increase" ? "text-emerald-700" : "text-red-600"
                            }`}>
                              {li.direction === "Increase" ? "+" : "-"}{fmt(li.amount)}
                            </div>
                          </div>
                        ))}
                        {/* Net total row */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t-2 border-slate-200">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Change</span>
                          <span className={`text-base font-bold tabular-nums ${
                            net > 0 ? "text-emerald-700" : net < 0 ? "text-red-600" : "text-slate-600"
                          }`}>
                            {net > 0 ? "+" : ""}{fmt(net)}
                          </span>
                        </div>
                      </div>
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
                        Reason (optional)
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
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
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
                        <CheckCircle size={16} /> Approve Changes
                      </button>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
      <Toaster />
    </Layout>
  );
}
