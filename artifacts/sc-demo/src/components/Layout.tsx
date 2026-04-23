import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, FolderKanban, FileSpreadsheet, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  roleBadge?: string;
}

export default function Layout({ children, title, roleBadge }: LayoutProps) {
  const [location] = useLocation();

  const getPageTitle = () => {
    if (title) return title;
    if (location === "/") return "Home";
    if (location.startsWith("/projects")) return "Projects";
    if (location.startsWith("/change-requests")) return "Change Requests";
    return "S&C";
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2 sm:mb-0">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-lg tracking-tight">
            S&C
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800 leading-tight">
              {getPageTitle()}
            </h1>
            {roleBadge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                {roleBadge}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
          <User size={16} className="text-slate-400" />
          <span>John Smith</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-normal">Project Manager</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 overflow-x-hidden">
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

      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-200 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              location === "/" ? "text-primary" : "text-slate-500 hover:text-slate-900"
            }`}
            data-testid="nav-home"
          >
            <Home size={20} strokeWidth={location === "/" ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link
            href="/projects"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              location.startsWith("/projects") ? "text-primary" : "text-slate-500 hover:text-slate-900"
            }`}
            data-testid="nav-projects"
          >
            <FolderKanban size={20} strokeWidth={location.startsWith("/projects") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Projects</span>
          </Link>
          <Link
            href="/change-requests"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              location.startsWith("/change-requests") ? "text-primary" : "text-slate-500 hover:text-slate-900"
            }`}
            data-testid="nav-change-requests"
          >
            <FileSpreadsheet size={20} strokeWidth={location.startsWith("/change-requests") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Change Requests</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
