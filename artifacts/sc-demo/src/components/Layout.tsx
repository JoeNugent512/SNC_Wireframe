import { ReactNode } from "react";
import { useLocation } from "wouter";
import { User, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  roleBadge?: string;
  breadcrumb?: ReactNode;
  headerActions?: ReactNode;
}

export default function Layout({ children, title, roleBadge, breadcrumb, headerActions }: LayoutProps) {
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
            {roleBadge && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {roleBadge}
              </span>
            )}
          </div>

          {/* Right: user badge + optional actions (far right) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <User size={15} className="text-slate-400" />
              <span>John Smith</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-normal">Project Manager</span>
            </div>
            {headerActions}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 overflow-x-hidden">
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

    </div>
  );
}
