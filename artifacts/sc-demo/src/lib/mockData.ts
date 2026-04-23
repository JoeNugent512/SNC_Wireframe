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
  projectId: string;
  category: "Labor" | "Travel";
  target: string;       // person name or org code (labor) / travel description
  direction: "Increase" | "Decrease";
  amount: number;
  submittedBy: string;
  date: string;
  justification: string;
  status: "Pending" | "Approved" | "Under Review" | "Rejected";
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    number: "25A01",
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
    number: "25T02",
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
    number: "24A03",
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
    number: "24T04",
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
    number: "25A05",
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
    number: "23T06",
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
    projectId: "1",
    category: "Labor",
    target: "Nugent, Joseph Pat",
    direction: "Increase",
    amount: 15000,
    submittedBy: "John Smith",
    date: "2024-02-10",
    justification: "Additional hours required to complete design review phase following scope clarification from the client. Estimate increased by 120 hrs.",
    status: "Pending"
  },
  {
    id: "102",
    projectId: "2",
    category: "Labor",
    target: "U435310",
    direction: "Decrease",
    amount: 8000,
    submittedBy: "Sarah Jenkins",
    date: "2024-01-25",
    justification: "Org code U435310 completed assigned deliverables ahead of schedule. Remaining planned hours are no longer needed this fiscal year.",
    status: "Approved"
  },
  {
    id: "103",
    projectId: "4",
    category: "Travel",
    target: "Site Visits",
    direction: "Increase",
    amount: 3400,
    submittedBy: "Elena Rodriguez",
    date: "2024-02-05",
    justification: "Two additional site visits required for terminal safety inspection following contractor request. Covers airfare and per diem.",
    status: "Under Review"
  },
  {
    id: "104",
    projectId: "3",
    category: "Labor",
    target: "Nugent, Joseph Pat",
    direction: "Increase",
    amount: 12000,
    submittedBy: "Marcus Thorne",
    date: "2024-01-18",
    justification: "Unforeseen subsurface conditions required extended survey work. Request denied pending revised scope documentation from engineering lead.",
    status: "Rejected"
  },
  {
    id: "105",
    projectId: "1",
    category: "Travel",
    target: "Equipment Transport",
    direction: "Decrease",
    amount: 2400,
    submittedBy: "John Smith",
    date: "2024-02-12",
    justification: "Local supplier arrangement eliminated need for long-haul equipment transport. Planned travel budget can be reduced accordingly.",
    status: "Pending"
  }
];
