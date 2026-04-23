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
  // Charter fields
  dwgCoP: string;
  hqProponent: string;
  executingOrg: string;
  projectLead: string;
  needsContractSupport: boolean;
  specialFundingType: string;
  budgetAtSubmission: number;
  actualObligation: number;
  primaryCmsLink: string;
  cmsGuestLink: string;
  additionalCmsLinks: string;
}

export interface ChangeRequest {
  id: string;
  proposedNumber: string;
  proposedName: string;
  proposedDescription: string;
  category: "Labor" | "Travel";
  target: string;
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
    pmName: "John Smith",
    dwgCoP: "Transportation",
    hqProponent: "Joe Bush",
    executingOrg: "ERDC",
    projectLead: "John Smith",
    needsContractSupport: true,
    specialFundingType: "Resiliency",
    budgetAtSubmission: 2400000,
    actualObligation: 2358000,
    primaryCmsLink: "https://cms.wbdg.org/revisions/1317",
    cmsGuestLink: "https://cms.wbdg.org/s/wfRya",
    additionalCmsLinks: "",
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
    pmName: "Sarah Jenkins",
    dwgCoP: "Structural",
    hqProponent: "Marcus Thorne",
    executingOrg: "CERL",
    projectLead: "Sarah Jenkins",
    needsContractSupport: false,
    specialFundingType: "",
    budgetAtSubmission: 1200000,
    actualObligation: 0,
    primaryCmsLink: "https://cms.wbdg.org/revisions/2048",
    cmsGuestLink: "",
    additionalCmsLinks: "",
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
    pmName: "Marcus Thorne",
    dwgCoP: "Utilities",
    hqProponent: "Elena Rodriguez",
    executingOrg: "ERDC",
    projectLead: "Marcus Thorne",
    needsContractSupport: true,
    specialFundingType: "Critical Infrastructure",
    budgetAtSubmission: 3500000,
    actualObligation: 3212500,
    primaryCmsLink: "https://cms.wbdg.org/revisions/3091",
    cmsGuestLink: "https://cms.wbdg.org/s/aMkL2",
    additionalCmsLinks: "",
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
    pmName: "Elena Rodriguez",
    dwgCoP: "Facilities",
    hqProponent: "David Chen",
    executingOrg: "CERL",
    projectLead: "Elena Rodriguez",
    needsContractSupport: true,
    specialFundingType: "MILCON",
    budgetAtSubmission: 8500000,
    actualObligation: 0,
    primaryCmsLink: "https://cms.wbdg.org/revisions/4422",
    cmsGuestLink: "",
    additionalCmsLinks: "https://cms.wbdg.org/revisions/4423",
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
    pmName: "David Chen",
    dwgCoP: "Transportation",
    hqProponent: "Joe Bush",
    executingOrg: "ERDC",
    projectLead: "David Chen",
    needsContractSupport: false,
    specialFundingType: "",
    budgetAtSubmission: 500000,
    actualObligation: 0,
    primaryCmsLink: "",
    cmsGuestLink: "",
    additionalCmsLinks: "",
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
    pmName: "John Smith",
    dwgCoP: "Environmental",
    hqProponent: "Sarah Jenkins",
    executingOrg: "CERL",
    projectLead: "John Smith",
    needsContractSupport: false,
    specialFundingType: "Coastal Defense",
    budgetAtSubmission: 1800000,
    actualObligation: 1798400,
    primaryCmsLink: "https://cms.wbdg.org/revisions/6104",
    cmsGuestLink: "https://cms.wbdg.org/s/cE9xZ",
    additionalCmsLinks: "",
  },
];

export const MOCK_CHANGE_REQUESTS: ChangeRequest[] = [
  {
    id: "101",
    proposedNumber: "26A01",
    proposedName: "Veterans Memorial Restoration",
    proposedDescription: "Structural restoration and landscaping of the downtown veterans memorial park.",
    category: "Labor",
    target: "Nugent, Joseph Pat",
    direction: "Increase",
    amount: 148000,
    submittedBy: "John Smith",
    date: "2024-02-10",
    justification: "Initial labor estimate for design and survey work in FY26. Nugent, Joseph Pat assigned as primary engineer for site assessment phase.",
    status: "Pending"
  },
  {
    id: "102",
    proposedNumber: "26T02",
    proposedName: "Regional Highway Expansion",
    proposedDescription: "Widening of Route 9 from 2 to 4 lanes across a 12-mile corridor.",
    category: "Labor",
    target: "U435310",
    direction: "Increase",
    amount: 285000,
    submittedBy: "Sarah Jenkins",
    date: "2024-01-25",
    justification: "Org code U435310 to provide geotechnical survey and environmental compliance review in support of project initiation.",
    status: "Pending"
  },
  {
    id: "103",
    proposedNumber: "25T08",
    proposedName: "Airport Runway Safety Study",
    proposedDescription: "Feasibility and safety study for a third runway at the regional airport.",
    category: "Travel",
    target: "Site Visits",
    direction: "Increase",
    amount: 62000,
    submittedBy: "Elena Rodriguez",
    date: "2024-02-05",
    justification: "Three planned site visits to regional airport for runway alignment assessment. Covers airfare, ground transport, and per diem for two team members.",
    status: "Pending"
  },
  {
    id: "104",
    proposedNumber: "26A04",
    proposedName: "Urban Transit Modernization",
    proposedDescription: "Upgrade of transit control systems and passenger information displays across 14 stations.",
    category: "Labor",
    target: "Nugent, Joseph Pat",
    direction: "Increase",
    amount: 195000,
    submittedBy: "Marcus Thorne",
    date: "2024-01-18",
    justification: "Labor request for systems integration scoping. Estimate covers initial phase of transit control upgrades across 14 stations; Nugent, Joseph Pat assigned as lead engineer.",
    status: "Pending"
  },
  {
    id: "105",
    proposedNumber: "25A09",
    proposedName: "Water Treatment Upgrade",
    proposedDescription: "Modernization of filtration and chemical treatment systems at the North District water plant.",
    category: "Travel",
    target: "Equipment Transport",
    direction: "Increase",
    amount: 74000,
    submittedBy: "John Smith",
    date: "2024-02-12",
    justification: "Equipment transport for specialized filtration unit inspection tools from the regional depot. Required before site mobilization can begin.",
    status: "Pending"
  }
];
