import { useState, useMemo } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ChevronRight, Save, Settings, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

// Initial mock data for the planning tables
const INITIAL_LABOR = [
  { id: 1, role: "Project Manager", hours: 80, rate: 95 },
  { id: 2, role: "Senior Engineer", hours: 120, rate: 120 },
  { id: 3, role: "Field Technician", hours: 200, rate: 65 }
];

const INITIAL_TRAVEL = [
  { id: 1, desc: "Site Visits", trips: 4, costPerTrip: 850 },
  { id: 2, desc: "Equipment Transport", trips: 2, costPerTrip: 1200 }
];

const INITIAL_MATERIALS = [
  { id: 1, desc: "Concrete", quantity: 500, unitCost: 150 },
  { id: 2, desc: "Steel Rebar", quantity: 2000, unitCost: 25 }
];

export default function ProjectPlanning() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const projectId = params.id;
  const project = MOCK_PROJECTS.find(p => p.id === projectId);

  const [labor, setLabor] = useState(INITIAL_LABOR);
  const [travel, setTravel] = useState(INITIAL_TRAVEL);
  const [materials, setMaterials] = useState(INITIAL_MATERIALS);

  const [sectionsExpanded, setSectionsExpanded] = useState({
    labor: true,
    travel: true,
    materials: false
  });

  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLaborChange = (id: number, field: string, value: string) => {
    const numValue = Number(value) || 0;
    setLabor(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: numValue } : item
    ));
  };

  const handleTravelChange = (id: number, field: string, value: string) => {
    const numValue = Number(value) || 0;
    setTravel(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: numValue } : item
    ));
  };

  const handleMaterialsChange = (id: number, field: string, value: string) => {
    const numValue = Number(value) || 0;
    setMaterials(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: numValue } : item
    ));
  };

  // Calculate totals
  const laborTotal = useMemo(() => labor.reduce((acc, item) => acc + (item.hours * item.rate), 0), [labor]);
  const travelTotal = useMemo(() => travel.reduce((acc, item) => acc + (item.trips * item.costPerTrip), 0), [travel]);
  const materialsTotal = useMemo(() => materials.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0), [materials]);
  
  const totalPlanned = laborTotal + travelTotal + materialsTotal;
  const budget = project?.budget || 0;
  const leftToPlan = budget - totalPlanned;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = () => {
    toast({
      title: "Success",
      description: "Plan submitted successfully",
      variant: "default",
    });
  };

  if (!project) {
    return (
      <Layout>
        <div className="p-8 text-center">Project not found</div>
      </Layout>
    );
  }

  return (
    <Layout title={project.name}>
      <div className="flex flex-col max-w-5xl mx-auto space-y-6">
        <nav className="text-sm font-medium text-slate-500 flex items-center">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <ChevronRight size={16} className="mx-1 text-slate-400" />
          <Link href="/projects" className="hover:text-slate-900 transition-colors">Project List</Link>
          <ChevronRight size={16} className="mx-1 text-slate-400" />
          <span className="text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">{project.number}</span>
        </nav>

        {/* Rollup Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
              <p className="text-slate-500 text-sm mt-1">Planning View</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/projects/${project.id}/settings`}>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors" data-testid="button-settings">
                  <Settings size={16} />
                  Settings
                </button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Budget (TOA)</div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(budget)}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Planned</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalPlanned)}</div>
            </div>
            <div className={`p-4 rounded-lg border ${leftToPlan < 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${leftToPlan < 0 ? 'text-red-600' : 'text-emerald-600'}`}>Left to Plan</div>
              <div className={`text-2xl font-bold ${leftToPlan < 0 ? 'text-red-900' : 'text-emerald-900'}`}>
                {formatCurrency(leftToPlan)}
              </div>
            </div>
          </div>
        </div>

        {/* Planning Tables */}
        <div className="space-y-4">
          {/* LABOR TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div 
              className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => toggleSection('labor')}
              data-testid="toggle-labor"
            >
              <div className="flex items-center gap-3">
                {sectionsExpanded.labor ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                <h3 className="font-semibold text-slate-900 text-lg">Labor</h3>
              </div>
              <div className="font-bold text-slate-900">{formatCurrency(laborTotal)}</div>
            </div>
            
            {sectionsExpanded.labor && (
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold w-1/3">Role</th>
                      <th className="px-6 py-3 font-semibold text-right w-1/5">Hours</th>
                      <th className="px-6 py-3 font-semibold text-right w-1/5">Rate ($)</th>
                      <th className="px-6 py-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labor.map((item, idx) => (
                      <tr key={item.id} className={idx !== labor.length - 1 ? "border-b border-slate-100" : ""}>
                        <td className="px-6 py-3 font-medium text-slate-900">{item.role}</td>
                        <td className="px-6 py-3">
                          <Input 
                            type="number" 
                            min="0"
                            className="w-full text-right h-8"
                            value={item.hours}
                            onChange={(e) => handleLaborChange(item.id, 'hours', e.target.value)}
                            data-testid={`input-labor-hours-${item.id}`}
                          />
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600">${item.rate}/hr</td>
                        <td className="px-6 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(item.hours * item.rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TRAVEL TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div 
              className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => toggleSection('travel')}
              data-testid="toggle-travel"
            >
              <div className="flex items-center gap-3">
                {sectionsExpanded.travel ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                <h3 className="font-semibold text-slate-900 text-lg">Travel</h3>
              </div>
              <div className="font-bold text-slate-900">{formatCurrency(travelTotal)}</div>
            </div>
            
            {sectionsExpanded.travel && (
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold w-1/3">Description</th>
                      <th className="px-6 py-3 font-semibold text-right w-1/5">Trips</th>
                      <th className="px-6 py-3 font-semibold text-right w-1/5">Cost/Trip ($)</th>
                      <th className="px-6 py-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {travel.map((item, idx) => (
                      <tr key={item.id} className={idx !== travel.length - 1 ? "border-b border-slate-100" : ""}>
                        <td className="px-6 py-3 font-medium text-slate-900">{item.desc}</td>
                        <td className="px-6 py-3">
                          <Input 
                            type="number" 
                            min="0"
                            className="w-full text-right h-8"
                            value={item.trips}
                            onChange={(e) => handleTravelChange(item.id, 'trips', e.target.value)}
                            data-testid={`input-travel-trips-${item.id}`}
                          />
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600">${item.costPerTrip}</td>
                        <td className="px-6 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(item.trips * item.costPerTrip)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* MATERIALS TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div 
              className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => toggleSection('materials')}
              data-testid="toggle-materials"
            >
              <div className="flex items-center gap-3">
                {sectionsExpanded.materials ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                <h3 className="font-semibold text-slate-900 text-lg">Materials & Other</h3>
                <button className="ml-2 text-slate-400 hover:text-primary transition-colors p-1" onClick={(e) => { e.stopPropagation(); toggleSection('materials'); }}>
                  <span className="font-bold tracking-widest text-lg leading-none">...</span>
                </button>
              </div>
              <div className="font-bold text-slate-900">{formatCurrency(materialsTotal)}</div>
            </div>
            
            {sectionsExpanded.materials && (
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold w-1/3">Description</th>
                      <th className="px-6 py-3 font-semibold text-right w-1/5">Quantity</th>
                      <th className="px-6 py-3 font-semibold text-right w-1/5">Unit Cost ($)</th>
                      <th className="px-6 py-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((item, idx) => (
                      <tr key={item.id} className={idx !== materials.length - 1 ? "border-b border-slate-100" : ""}>
                        <td className="px-6 py-3 font-medium text-slate-900">{item.desc}</td>
                        <td className="px-6 py-3">
                          <Input 
                            type="number" 
                            min="0"
                            className="w-full text-right h-8"
                            value={item.quantity}
                            onChange={(e) => handleMaterialsChange(item.id, 'quantity', e.target.value)}
                            data-testid={`input-materials-qty-${item.id}`}
                          />
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600">${item.unitCost}</td>
                        <td className="px-6 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(item.quantity * item.unitCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end pt-4 pb-8">
          <button 
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            data-testid="button-submit-plan"
          >
            <Save size={18} />
            Submit Plan
          </button>
        </div>
      </div>
    </Layout>
  );
}
