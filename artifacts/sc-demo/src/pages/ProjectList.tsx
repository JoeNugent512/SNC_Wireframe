import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Calendar, DollarSign, User, Briefcase, Search, Activity, PauseCircle, CheckCircle2, Clock } from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_PROJECTS, Project } from "@/lib/mockData";
import { Input } from "@/components/ui/input";

export default function ProjectList() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectProject = (id: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setSelectedId(id);
      setIsLoading(false);
    }, 500);
  };

  const selectedProject = MOCK_PROJECTS.find(p => p.id === selectedId);

  const filteredProjects = MOCK_PROJECTS.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case "Active": return <Activity size={14} className="text-emerald-500" />;
      case "Planning": return <Clock size={14} className="text-amber-500" />;
      case "On Hold": return <PauseCircle size={14} className="text-slate-500" />;
      case "Complete": return <CheckCircle2 size={14} className="text-blue-500" />;
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case "Active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Planning": return "bg-amber-50 text-amber-700 border-amber-200";
      case "On Hold": return "bg-slate-50 text-slate-700 border-slate-200";
      case "Complete": return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        <nav className="text-sm font-medium text-slate-500 mb-6 flex items-center">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <ChevronRight size={16} className="mx-1 text-slate-400" />
          <span className="text-slate-900">Project List</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
          {/* Left Panel - List */}
          <div className="w-full lg:w-5/12 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search projects..." 
                  className="pl-9 bg-white border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-projects"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {filteredProjects.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No projects found matching "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredProjects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => handleSelectProject(project.id)}
                      className={`w-full text-left p-4 rounded-lg transition-all border ${
                        selectedId === project.id 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
                      }`}
                      data-testid={`card-project-${project.id}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-500 tracking-wider">{project.number}</span>
                        <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(project.status)}`}>
                          {getStatusIcon(project.status)}
                          {project.status}
                        </div>
                      </div>
                      <h3 className={`font-semibold mb-1 ${selectedId === project.id ? 'text-primary' : 'text-slate-900'}`}>
                        {project.name}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Details */}
          <div className="w-full lg:w-7/12 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium">Loading project details...</p>
              </div>
            ) : !selectedProject ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center">
                <Briefcase size={48} className="mb-4 text-slate-200" strokeWidth={1} />
                <h3 className="text-lg font-medium text-slate-600 mb-1">No Project Selected</h3>
                <p className="text-sm max-w-xs">Select a project from the list to view its overview and management options.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="p-6 md:p-8 border-b border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 font-mono text-xs font-bold rounded mb-3">
                        {selectedProject.number}
                      </span>
                      <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-2">
                        {selectedProject.name}
                      </h2>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${getStatusColor(selectedProject.status)}`}>
                      {getStatusIcon(selectedProject.status)}
                      {selectedProject.status}
                    </div>
                  </div>
                  
                  <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                    {selectedProject.description}
                  </p>
                </div>

                <div className="p-6 md:p-8 bg-slate-50/50 flex-1">
                  <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase mb-4">Key Metrics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start gap-3">
                      <div className="bg-emerald-50 text-emerald-600 p-2 rounded-md mt-0.5">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Total Budget</div>
                        <div className="text-lg font-bold text-slate-900">{formatCurrency(selectedProject.budget)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start gap-3">
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-md mt-0.5">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Timeline</div>
                        <div className="text-sm font-semibold text-slate-900">
                          {new Date(selectedProject.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                          {new Date(selectedProject.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start gap-3 md:col-span-2">
                      <div className="bg-indigo-50 text-indigo-600 p-2 rounded-md mt-0.5">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Project Manager</div>
                        <div className="text-sm font-semibold text-slate-900">{selectedProject.pmName}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link href={`/projects/${selectedProject.id}/planning`} className="flex-1">
                      <button className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2" data-testid="button-edit-plan">
                        <FileSpreadsheet size={16} />
                        Edit Plan
                      </button>
                    </Link>
                    <Link href={`/projects/${selectedProject.id}/settings`} className="flex-1">
                      <button className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors text-sm" data-testid="button-project-settings">
                        Settings
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
