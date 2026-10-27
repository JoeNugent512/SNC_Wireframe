import { ReactNode, useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { User, ArrowLeft, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/userContext";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  roleBadge?: string;
  breadcrumb?: ReactNode;
  headerActions?: ReactNode;
  stickyBanner?: ReactNode;
  stickyFooter?: ReactNode;
  mainClassName?: string;
}

const ROLE_COLORS: Record<string, string> = {
  "Admin":          "bg-violet-100 text-violet-800",
  "Project Lead":   "bg-blue-100 text-blue-800",
  "Proponent":      "bg-teal-100 text-teal-800",
  "Budget Analyst": "bg-amber-100 text-amber-800",
  "Program Team":   "bg-amber-100 text-amber-800",
};

export default function Layout({ children, title, roleBadge, breadcrumb, headerActions, stickyBanner, stickyFooter, mainClassName }: LayoutProps) {
  const [location] = useLocation();
  const { user, users, setUser } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const getPageTitle = () => {
    if (title) return title;
    if (location === "/") return "Home";
    if (location.startsWith("/projects")) return "Projects";
    if (location.startsWith("/change-requests")) return "Funds Requests";
    return "S&C";
  };

  const roleColor = ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Left: logo + title + optional breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-sm tracking-tight flex-shrink-0">
              S&C
            </div>
            {breadcrumb ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap text-sm font-medium leading-tight">
                  {breadcrumb}
                </div>
                <button
                  onClick={() => window.history.back()}
                  className="flex-shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Go back"
                >
                  <ArrowLeft size={16} />
                </button>
              </div>
            ) : (
              <h1 className="text-lg font-semibold text-slate-800 truncate">
                {getPageTitle()}
              </h1>
            )}
          </div>

          {/* Right: optional role badge + user role switcher + header actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {roleBadge && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {roleBadge}
              </span>
            )}

            {/* Role switcher dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
              >
                <User size={15} className="text-slate-400 flex-shrink-0" />
                <span className="hidden sm:inline">{user.name}</span>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span className={`hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor}`}>
                  {user.role}
                </span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Switch User (Demo)</p>
                    </div>
                    {users.map((u) => {
                      const isActive = u.name === user.name;
                      const rc = ROLE_COLORS[u.role] ?? "bg-slate-100 text-slate-600";
                      return (
                        <button
                          key={u.name}
                          onClick={() => { setUser(u); setDropdownOpen(false); }}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors ${isActive ? "bg-blue-50" : "hover:bg-slate-50"}`}
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <User size={13} className="text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 leading-tight">{u.name}</p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${rc}`}>{u.role}</span>
                          </div>
                          {isActive && <Check size={14} className="text-primary flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {headerActions}
          </div>
        </div>
      </header>

      {/* Optional sticky sub-header */}
      {stickyBanner && (
        <div className="sticky z-20 w-full" style={{ top: 56 }}>
          {stickyBanner}
        </div>
      )}

      <main
        className={mainClassName ?? "flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 overflow-x-hidden"}
        style={stickyFooter ? { paddingBottom: "3rem" } : undefined}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Optional sticky footer */}
      {stickyFooter && (
        <div className="fixed bottom-0 left-0 right-0 z-30 w-full">
          {stickyFooter}
        </div>
      )}
    </div>
  );
}
