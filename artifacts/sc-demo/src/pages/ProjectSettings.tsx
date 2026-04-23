import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ChevronRight, Save, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_PROJECTS, Project } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ProjectSettings() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const projectId = params.id;
  const project = MOCK_PROJECTS.find(p => p.id === projectId);

  const [formData, setFormData] = useState({
    name: project?.name || "",
    status: project?.status || "Planning",
    pmName: project?.pmName || "",
    description: project?.description || ""
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Project details have been updated successfully.",
      variant: "default",
    });
    // In a real app we'd update the backend, then navigate
    setTimeout(() => {
      setLocation(`/projects/${projectId}/planning`);
    }, 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!project) {
    return (
      <Layout>
        <div className="p-8 text-center">Project not found</div>
      </Layout>
    );
  }

  return (
    <Layout title={`Settings: ${project.number}`}>
      <div className="flex flex-col max-w-3xl mx-auto space-y-6">
        <nav className="text-sm font-medium text-slate-500 flex items-center">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <ChevronRight size={16} className="mx-1 text-slate-400" />
          <Link href="/projects" className="hover:text-slate-900 transition-colors">Project List</Link>
          <ChevronRight size={16} className="mx-1 text-slate-400" />
          <Link href={`/projects/${project.id}/planning`} className="hover:text-slate-900 transition-colors">
            <span className="bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">{project.number}</span>
          </Link>
          <ChevronRight size={16} className="mx-1 text-slate-400" />
          <span className="text-slate-900">Settings</span>
        </nav>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Project Configuration</h2>
              <p className="text-sm text-slate-500 mt-1">Manage high-level project details and status.</p>
            </div>
            <Link href={`/projects/${project.id}/planning`}>
              <button className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                <ArrowLeft size={16} /> Back to Plan
              </button>
            </Link>
          </div>

          <div className="p-6 space-y-6">
            {/* Read-only fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <Label className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1 block">S&C Number</Label>
                <div className="font-mono text-sm font-semibold text-slate-900">{project.number}</div>
              </div>
              <div>
                <Label className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1 block">Total Budget</Label>
                <div className="font-bold text-slate-900">{formatCurrency(project.budget)}</div>
              </div>
              <div>
                <Label className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1 block">Timeline</Label>
                <div className="text-sm font-medium text-slate-900">
                  {project.startDate} to {project.endDate}
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input 
                    id="projectName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    data-testid="input-project-name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val: Project['status']) => setFormData(prev => ({ ...prev, status: val }))}
                  >
                    <SelectTrigger id="status" data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pmName">Project Manager Name</Label>
                <Input 
                  id="pmName"
                  value={formData.pmName}
                  onChange={(e) => setFormData(prev => ({ ...prev, pmName: e.target.value }))}
                  data-testid="input-pm-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="input-description"
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button 
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              data-testid="button-save-settings"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
