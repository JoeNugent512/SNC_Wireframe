import { useState } from "react";
import { Link } from "wouter";
import {
  ChevronRight, Filter, FileText, CheckCircle, XCircle,
  Search, TrendingUp, TrendingDown, FolderOpen, User, ArrowRight, Copy, Check
} from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_CHANGE_REQUESTS, MOCK_PROJECTS, ChangeRequest, CRLineItem } from "@/lib/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmtDelta = (n: number) =>
  (n > 0 ? "+" : "") + fmt(n);

function netChange(cr: ChangeRequest) {
  return cr.lineItems.reduce((sum, li) =>
    li.direction === "Increase" ? sum + li.amount : sum - li.amount, 0);
}

function getProponent(projectNumber: string) {
  return MOCK_PROJECTS.find(p => p.number === projectNumber)?.hqProponent ?? "—";
}

function buildDescription(cr: ChangeRequest, proponent: string): string {
  const net = cr.lineItems.reduce((s, li) =>
    li.direction === "Increase" ? s + li.amount : s - li.amount, 0);
  const pad = (s: string, w: number) => s.padEnd(w, " ");
  const lines = cr.lineItems.map(li => {
    const delta = li.direction === "Increase" ? li.amount : -li.amount;
    const sign  = delta >= 0 ? "+" : "";
    return `  ${li.direction === "Increase" ? "[+]" : "[-]"} ${pad(li.type + ": " + li.description, 38)} ${pad(fmt(li.from), 12)} -> ${pad(fmt(li.to), 12)} (${sign}${fmt(delta)})`;
  });
  const netLabel = net === 0 ? "$0" : (net > 0 ? "+" : "") + fmt(net);
  return [
    "Budget Change Request",
    `Project:       ${cr.projectNumber} — ${cr.projectName}`,
    `Proponent:     ${proponent}`,
    `Requested by:  ${cr.submittedBy}  |  Date: ${cr.date}`,
    `Status:        ${cr.status}`,
    "",
    "Budget Changes:",
    ...lines,
    `${"".padEnd(62, "-")}`,
    `  Net Change: ${netLabel}`,
    "",
    "Justification:",
    `  ${cr.justification}`,
  ].join("\n");
}

function typeChipClass(type: CRLineItem["type"]) {
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
  const [noteText, setNoteText] = useState("");
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);

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

  const handleOpen = (cr: ChangeRequest) => {
    setSelectedCR(cr);
    setActionReason("");
    setNoteText("");
    setCopiedDesc(false);
    setCopiedNotes(false);
  };
  const handleClose = () => {
    setSelectedCR(null);
    setActionReason("");
    setNoteText("");
    setCopiedDesc(false);
    setCopiedNotes(false);
  };

  const copyToClipboard = (text: string, which: "desc" | "notes") => {
    navigator.clipboard.writeText(text).then(() => {
      if (which === "desc") { setCopiedDesc(true); setTimeout(() => setCopiedDesc(false), 2000); }
      else                  { setCopiedNotes(true); setTimeout(() => setCopiedNotes(false), 2000); }
    });
  };

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
                  <th className="px-6 py-4 font-semibold hidden lg:table-cell">Proponent</th>
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
                    return (
                      <tr
                        key={cr.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleOpen(cr)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-mono font-semibold text-xs text-slate-400">{cr.projectNumber}</div>
                          <div className="font-medium text-slate-900 truncate max-w-[200px]">{cr.projectName}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 hidden lg:table-cell">{getProponent(cr.projectNumber)}</td>
                        <td className="px-6 py-4 text-slate-600 hidden md:table-cell">{cr.submittedBy}</td>
                        <td className="px-6 py-4 text-slate-500 hidden sm:table-cell">{cr.date}</td>
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
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
          {selectedCR && (() => {
            const net = netChange(selectedCR);
            return (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-0.5">
                      <FolderOpen size={14} className="text-primary/70" />
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Change Request</span>
                    </div>
                    <DialogTitle className="text-lg font-bold text-slate-900 pr-8 leading-snug">
                      <span className="font-mono text-sm text-slate-400 mr-2">{selectedCR.projectNumber}</span>
                      {selectedCR.projectName}
                    </DialogTitle>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {getStatusBadge(selectedCR.status)}
                      <DialogDescription className="text-sm text-slate-500 m-0 flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        <strong className="text-slate-700 font-semibold">{selectedCR.submittedBy}</strong>
                        <span className="text-slate-300">·</span>
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

                    {/* Before / After table */}
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Budget Changes</div>
                      <div className="rounded-lg border border-slate-200 overflow-hidden">
                        {/* Column headers */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-200 px-4 py-2 gap-x-4">
                          <span>Line Item</span>
                          <span className="text-right w-24">Current</span>
                          <span className="w-4" />
                          <span className="text-right w-24">Proposed</span>
                          <span className="text-right w-24">Change</span>
                        </div>

                        {/* Line item rows */}
                        {selectedCR.lineItems.map((li, i) => {
                          const delta = li.direction === "Increase" ? li.amount : -li.amount;
                          return (
                            <div
                              key={i}
                              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-4 py-3 gap-x-4 border-b border-slate-100 last:border-0"
                            >
                              {/* Description */}
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${typeChipClass(li.type)}`}>
                                  {li.type}
                                </span>
                                <span className="text-sm text-slate-700 truncate">{li.description}</span>
                              </div>

                              {/* Current */}
                              <span className="text-sm tabular-nums text-slate-500 text-right w-24">{fmt(li.from)}</span>

                              {/* Arrow */}
                              <ArrowRight size={13} className="text-slate-300 w-4" />

                              {/* Proposed */}
                              <span className="text-sm tabular-nums font-medium text-slate-800 text-right w-24">{fmt(li.to)}</span>

                              {/* Delta */}
                              <span className={`text-sm tabular-nums font-semibold text-right w-24 ${
                                delta > 0 ? "text-emerald-700" : "text-red-600"
                              }`}>
                                {delta > 0 ? "+" : ""}{fmt(delta)}
                              </span>
                            </div>
                          );
                        })}

                        {/* Net total row */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-4 py-3 gap-x-4 bg-slate-50 border-t-2 border-slate-200">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider col-span-4 text-right">Net Change</span>
                          <span className={`text-sm font-bold tabular-nums text-right w-24 ${
                            net > 0 ? "text-emerald-700" : net < 0 ? "text-red-600" : "text-slate-500"
                          }`}>
                            {net === 0 ? "$0" : fmtDelta(net)}
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

                    {/* Auto-generated Description */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</div>
                        <button
                          onClick={() => copyToClipboard(buildDescription(selectedCR, getProponent(selectedCR.projectNumber)), "desc")}
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                        >
                          {copiedDesc ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          {copiedDesc ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <textarea
                        readOnly
                        rows={10}
                        value={buildDescription(selectedCR, getProponent(selectedCR.projectNumber))}
                        className="w-full text-xs text-slate-700 font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes</div>
                        <button
                          onClick={() => copyToClipboard(noteText, "notes")}
                          disabled={!noteText.trim()}
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        >
                          {copiedNotes ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          {copiedNotes ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add any additional notes here…"
                        className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                      />
                    </div>
                  </div>

                  {/* Reason textarea — only when actionable */}
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
                      >
                        <XCircle size={16} /> Reject
                      </button>
                      <button
                        onClick={() => handleAction("Approve")}
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
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
