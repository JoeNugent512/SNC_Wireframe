import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, FileText, Search, Lock, Inbox, CheckCircle, CircleDot, Archive, Circle, ChevronDown } from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_PROJECTS, ChangeRequest } from "@/lib/mockData";
import { useChangeRequests } from "@/lib/changeRequestsContext";
import { formatRequestNumber } from "@/lib/requestNumber";
import { useUser } from "@/lib/userContext";
import { Input } from "@/components/ui/input";

type FolderStatus = ChangeRequest["status"] | "All";

const FOLDERS: { label: string; status: FolderStatus; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { label: "Pending Approval", status: "Pending Approval", icon: CircleDot },
  { label: "Approved",         status: "Approved",         icon: CheckCircle },
  { label: "Complete - Partial", status: "Complete - Partial", icon: Circle },
  { label: "Complete",         status: "Complete",         icon: CheckCircle },
  { label: "Archived",         status: "Archived",         icon: Archive },
];

function getProponent(projectNumber: string) {
  return MOCK_PROJECTS.find(p => p.number === projectNumber)?.hqProponent ?? "—";
}

function AccessRestricted() {
  return (
    <Layout breadcrumb={<>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300" />
      <span className="font-semibold text-slate-800">Funds Requests</span>
    </>}>
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Lock size={24} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-xs">
          Funds Requests are only accessible to Budget Analysts, Program Team, and Admins. Switch your role in the top nav to view this page.
        </p>
        <Link href="/" className="mt-6 text-sm text-primary hover:underline font-medium">
          Return to Home
        </Link>
      </div>
    </Layout>
  );
}

function StatusBadge({ status }: { status: ChangeRequest["status"] }) {
  const map: Record<string, string> = {
    "Pending Approval":  "bg-blue-100 text-blue-800 border-blue-200",
    "Approved":          "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Complete - Partial":"bg-amber-100 text-amber-800 border-amber-200",
    "Complete":          "bg-teal-100 text-teal-800 border-teal-200",
    "Archived":          "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {status}
    </span>
  );
}

const ALL_STATUSES = FOLDERS.map(f => f.status) as ChangeRequest["status"][];

function StatusFilterDropdown({
  statuses,
  selected,
  onToggle,
  onClear,
}: {
  statuses: ChangeRequest["status"][];
  selected: Set<ChangeRequest["status"]>;
  onToggle: (s: ChangeRequest["status"]) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label = selected.size === 0
    ? "All Statuses"
    : selected.size === 1
      ? [...selected][0]
      : `${selected.size} statuses`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 h-9 px-3 text-sm rounded-md border transition-colors ${
          selected.size > 0
            ? "border-primary bg-primary/5 text-primary font-semibold"
            : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
        }`}
      >
        <span>{label}</span>
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden w-52">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Status</span>
            {selected.size > 0 && (
              <button onClick={onClear} className="text-[11px] text-primary hover:underline font-medium">Clear</button>
            )}
          </div>
          {statuses.map(s => {
            const checked = selected.has(s);
            return (
              <button
                key={s}
                onClick={() => onToggle(s)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  checked ? "bg-primary/5 text-primary font-semibold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  checked ? "bg-primary border-primary" : "border-slate-300"
                }`}>
                  {checked && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ChangeRequests() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const [activeFolder, setActiveFolder] = useState<FolderStatus>("Pending Approval");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<ChangeRequest["status"]>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const { changeRequests } = useChangeRequests();

  if (user.role === "Project Lead" || user.role === "Proponent") {
    return <AccessRestricted />;
  }

  const counts = Object.fromEntries(
    FOLDERS.map(f => [f.status, changeRequests.filter(cr => cr.status === f.status).length])
  ) as Record<FolderStatus, number>;

  const toggleStatus = (s: ChangeRequest["status"]) => {
    setSelectedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const usingChips = selectedStatuses.size > 0;

  const filteredCRs = changeRequests.filter(cr => {
    const matchesStatus = usingChips
      ? selectedStatuses.has(cr.status)
      : cr.status === activeFolder;
    if (!matchesStatus) return false;
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      cr.projectNumber.toLowerCase().includes(q) ||
      cr.projectName.toLowerCase().includes(q) ||
      cr.submittedBy.toLowerCase().includes(q) ||
      formatRequestNumber(cr, changeRequests).toLowerCase().includes(q)
    );
  });

  return (
    <Layout breadcrumb={<>
      <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
      <ChevronRight size={14} className="text-slate-300" />
      <span className="font-semibold text-slate-800">Funds Requests</span>
    </>}>
      <div className="flex gap-4 h-[calc(100vh-10rem)]">

        {/* ── Inbox Sidebar ── */}
        <div className="w-52 flex-shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Inbox size={15} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inbox</span>
            </div>
          </div>
          <nav className="flex-1 py-1.5">
            {FOLDERS.map(({ label, status, icon: Icon }) => {
              const isActive = activeFolder === status;
              const count = counts[status] ?? 0;
              return (
                <button
                  key={status}
                  onClick={() => setActiveFolder(status)}
                  className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-600 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon size={14} className={isActive ? "text-primary" : "text-slate-400"} />
                    <span className="truncate text-xs">{label}</span>
                  </div>
                  <span className={`text-xs ml-1 tabular-nums px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Main Panel ── */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-w-0">

          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search by project, submitter, or request #"
                className="pl-9 h-9 text-sm bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Multi-select status dropdown */}
            <StatusFilterDropdown
              statuses={ALL_STATUSES}
              selected={selectedStatuses}
              onToggle={toggleStatus}
              onClear={() => setSelectedStatuses(new Set())}
            />

            <span className="text-xs text-slate-400 ml-auto">
              {filteredCRs.length} {filteredCRs.length === 1 ? "request" : "requests"}
            </span>
          </div>

          {/* Table */}
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-slate-50/70 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-semibold w-32">Request #</th>
                  <th className="px-5 py-3 font-semibold">Project</th>
                  <th className="px-5 py-3 font-semibold hidden lg:table-cell">Proponent</th>
                  <th className="px-5 py-3 font-semibold hidden md:table-cell">Submitted By</th>
                  <th className="px-5 py-3 font-semibold hidden sm:table-cell">Date Submitted</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCRs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={32} className="text-slate-300 mb-3" />
                        <p className="font-medium">No requests in this folder.</p>
                        {searchQuery && <p className="text-xs mt-1 text-slate-400">Try clearing the search.</p>}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCRs.map((cr, i) => (
                    <tr
                      key={cr.id}
                      className="hover:bg-primary/5 transition-colors cursor-pointer group"
                      style={{ backgroundColor: i % 2 === 1 ? "#f8fafc" : "#ffffff" }}
                      onClick={() => navigate(`/change-requests/${cr.id}`)}
                    >
                      {/* Request # */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-500 group-hover:text-primary transition-colors">
                          {formatRequestNumber(cr, changeRequests)}
                        </span>
                      </td>

                      {/* Project — number big & bold, name smaller */}
                      <td className="px-5 py-4">
                        <div className="font-mono text-base font-extrabold text-slate-800 leading-tight">
                          {cr.projectNumber}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">{cr.projectName}</div>
                        {cr.requestFY && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{cr.requestFY} {cr.requestQuarter}</div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600 text-xs hidden lg:table-cell">{getProponent(cr.projectNumber)}</td>
                      <td className="px-5 py-4 text-slate-600 text-xs hidden md:table-cell">{cr.submittedBy}</td>
                      <td className="px-5 py-4 text-slate-500 text-xs hidden sm:table-cell">{cr.date}</td>
                      <td className="px-5 py-4"><StatusBadge status={cr.status} /></td>
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
