export interface Project {
  id: string;
  number: string;
  name: string;
  description: string;
  status: "Planning" | "Active" | "Complete" | "On Hold";
  budget: number;
  startDate: string;
  endDate: string;
  pmName: string;
}

export interface ChangeRequest {
  id: string;
  crNumber: string;
  projectId: string;
  type: string;
  amount: number;
  submittedBy: string;
  date: string;
  status: "Pending" | "Approved" | "Under Review" | "Rejected";
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    number: "25A001",
    name: "Highway 45 Expansion",
    description: "Adding 2 lanes to the northbound and southbound sections of Highway 45.",
    status: "Active",
    budget: 2400000,
    startDate: "2024-01-15",
    endDate: "2025-06-30",
    pmName: "John Smith"
  },
  {
    id: "2",
    number: "25T002",
    name: "Bridge Rehabilitation",
    description: "Structural reinforcement and resurfacing of the downtown suspension bridge.",
    status: "Planning",
    budget: 1200000,
    startDate: "2024-03-01",
    endDate: "2024-11-15",
    pmName: "Sarah Jenkins"
  },
  {
    id: "3",
    number: "24A003",
    name: "Downtown Water Main",
    description: "Replacement of 100-year-old water main infrastructure in the central business district.",
    status: "Active",
    budget: 3500000,
    startDate: "2023-09-01",
    endDate: "2024-12-31",
    pmName: "Marcus Thorne"
  },
  {
    id: "4",
    number: "24T004",
    name: "Airport Terminal Upgrade",
    description: "Modernization of Terminal B including new security checkpoints and concession areas.",
    status: "On Hold",
    budget: 8500000,
    startDate: "2024-06-01",
    endDate: "2026-03-31",
    pmName: "Elena Rodriguez"
  },
  {
    id: "5",
    number: "25A005",
    name: "Metro Rail Extension",
    description: "Feasibility study and initial planning for the Westside light rail extension.",
    status: "Planning",
    budget: 500000,
    startDate: "2024-02-15",
    endDate: "2024-08-30",
    pmName: "David Chen"
  },
  {
    id: "6",
    number: "23T006",
    name: "Coastal Erosion Control",
    description: "Construction of breakwaters and beach renourishment along the southern coastline.",
    status: "Complete",
    budget: 1800000,
    startDate: "2023-01-15",
    endDate: "2023-11-30",
    pmName: "John Smith"
  }
];

export const MOCK_CHANGE_REQUESTS: ChangeRequest[] = [
  {
    id: "101",
    crNumber: "CR-001",
    projectId: "1",
    type: "Scope Change",
    amount: 150000,
    submittedBy: "John Smith",
    date: "2024-02-10",
    status: "Pending"
  },
  {
    id: "102",
    crNumber: "CR-002",
    projectId: "2",
    type: "Budget Increase",
    amount: 75000,
    submittedBy: "Sarah Jenkins",
    date: "2024-01-25",
    status: "Approved"
  },
  {
    id: "103",
    crNumber: "CR-003",
    projectId: "4",
    type: "Schedule Extension",
    amount: 0,
    submittedBy: "Elena Rodriguez",
    date: "2024-02-05",
    status: "Under Review"
  },
  {
    id: "104",
    crNumber: "CR-004",
    projectId: "3",
    type: "Material Cost",
    amount: 210000,
    submittedBy: "Marcus Thorne",
    date: "2024-01-18",
    status: "Rejected"
  },
  {
    id: "105",
    crNumber: "CR-005",
    projectId: "1",
    type: "Labor Rate Adjustment",
    amount: 45000,
    submittedBy: "John Smith",
    date: "2024-02-12",
    status: "Pending"
  }
];
