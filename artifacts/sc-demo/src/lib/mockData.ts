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
  needsContractSupport: "" | "Yes" | "No" | "N/A";
  specialFundingType: string;
  budgetAtSubmission: number;
  actualObligation: number;
  primaryCmsLink: string;
  cmsGuestLink: string;
  additionalCmsLinks: string;
}

export interface SetupProject {
  id: string;
  number: string;
  name: string;
  description: string;
  estimatedBudget: number;
  pmName: string;
  dwgCoP: string;
  hqProponent: string;
  executingOrg: string;
  projectLead: string;
  needsContractSupport: "" | "Yes" | "No" | "N/A";
  specialFundingType: string;
  budgetAtSubmission: number;
  startDate: string;
  endDate: string;
  primaryCmsLink: string;
  cmsGuestLink: string;
  additionalCmsLinks: string;
  sourceRef: string;
  submittedBy: string;
  receivedDate: string;
}

export const PENDING_SETUP_PROJECTS: SetupProject[] = [
  {
    id: "setup-1",
    number: "26A05",
    name: "Levee Reinforcement Study",
    description: "Structural assessment and reinforcement of aging levee segments along the southern flood basin.",
    estimatedBudget: 1850000,
    pmName: "John Smith",
    dwgCoP: "",
    hqProponent: "Patricia Moore",
    executingOrg: "ERDC",
    projectLead: "",
    needsContractSupport: "",
    specialFundingType: "",
    budgetAtSubmission: 1850000,
    startDate: "",
    endDate: "",
    primaryCmsLink: "",
    cmsGuestLink: "",
    additionalCmsLinks: "",
    sourceRef: "CR-26A05",
    submittedBy: "Patricia Moore",
    receivedDate: "2024-03-01",
  },
  {
    id: "setup-2",
    number: "26T04",
    name: "Pavement Condition Assessment",
    description: "Network-wide pavement distress survey and condition index scoring for prioritization of rehabilitation.",
    estimatedBudget: 420000,
    pmName: "",
    dwgCoP: "Transportation",
    hqProponent: "Joe Bush",
    executingOrg: "",
    projectLead: "",
    needsContractSupport: "Yes",
    specialFundingType: "",
    budgetAtSubmission: 420000,
    startDate: "2024-04-01",
    endDate: "",
    primaryCmsLink: "",
    cmsGuestLink: "",
    additionalCmsLinks: "",
    sourceRef: "CR-26T04",
    submittedBy: "Joe Bush",
    receivedDate: "2024-03-05",
  },
  {
    id: "setup-3",
    number: "26A06",
    name: "Dam Spillway Repair",
    description: "Emergency repair and seismic retrofitting of the main spillway gate assembly at Ridgecrest Dam.",
    estimatedBudget: 3200000,
    pmName: "",
    dwgCoP: "",
    hqProponent: "",
    executingOrg: "",
    projectLead: "",
    needsContractSupport: "",
    specialFundingType: "Emergency",
    budgetAtSubmission: 3200000,
    startDate: "",
    endDate: "",
    primaryCmsLink: "",
    cmsGuestLink: "",
    additionalCmsLinks: "",
    sourceRef: "CR-26A06",
    submittedBy: "Marcus Thorne",
    receivedDate: "2024-03-10",
  },
];

export interface CRTravelDetails {
  poc?: string;
  travelers?: string;
  dates?: string;
  purpose?: string;
}

export interface CRResourceDetails {
  pop?: string;
  poc?: string;
  purpose?: string;
}

export interface CRLineItem {
  direction: "Increase" | "Decrease";
  type: "Labor" | "Travel" | "Materials" | "Contracting";
  orgCode: string;
  resource: string;
  amount: number;
  from: number;
  to: number;
  travelDetails?: CRTravelDetails;
  resourceDetails?: CRResourceDetails;
}

export interface ChangeRequest {
  id: string;
  projectNumber: string;
  projectName: string;
  projectDescription: string;
  submittedBy: string;
  date: string;
  justification: string;
  typeJustifications?: Partial<Record<string, string>>;
  status: "First Request" | "Pending" | "Approved" | "Under Review" | "Rejected";
  lineItems: CRLineItem[];
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
    needsContractSupport: "Yes",
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
    needsContractSupport: "No",
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
    needsContractSupport: "Yes",
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
    needsContractSupport: "Yes",
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
    needsContractSupport: "No",
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
    needsContractSupport: "No",
    specialFundingType: "Coastal Defense",
    budgetAtSubmission: 1800000,
    actualObligation: 1798400,
    primaryCmsLink: "https://cms.wbdg.org/revisions/6104",
    cmsGuestLink: "https://cms.wbdg.org/s/cE9xZ",
    additionalCmsLinks: "",
  },
  {
    id: "7",
    number: "26D01",
    name: "New Project",
    description: "Demo project",
    status: "Planning",
    budget: 2500000,
    startDate: "2026-01-15",
    endDate: "2030-12-31",
    pmName: "Joseph Nugent",
    dwgCoP: "Facilities",
    hqProponent: "Joe Bush",
    executingOrg: "ERDC",
    projectLead: "Joseph Nugent",
    needsContractSupport: "Yes",
    specialFundingType: "Resiliency",
    budgetAtSubmission: 2500000,
    actualObligation: 0,
    primaryCmsLink: "",
    cmsGuestLink: "",
    additionalCmsLinks: "",
  },
];

export const MOCK_CHANGE_REQUESTS: ChangeRequest[] = [
  {
    id: "101",
    projectNumber: "25A01",
    projectName: "Highway 45 Expansion",
    projectDescription: "Adding 2 lanes to the northbound and southbound sections of Highway 45.",
    submittedBy: "John Smith",
    date: "2024-02-10",
    justification: "Labor reallocation needed after geotechnical scope expanded. Nugent picked up additional survey tasks; offsetting by reducing planned site visits that can be combined into fewer trips.",
    typeJustifications: {
      Labor:  "Nugent took on additional geotechnical survey tasks beyond original scope agreement. Rate increase approved by PM on 2024-02-08.",
      Travel: "Two previously separate site visits consolidated into a single trip to reduce per-diem and mileage costs.",
    },
    status: "Pending",
    lineItems: [
      { direction: "Increase", type: "Labor",  orgCode: "U435310", resource: "Nugent, Joseph Pat",  amount: 22000, from: 215000, to: 237000 },
      { direction: "Decrease", type: "Travel", orgCode: "U435310", resource: "CERL", amount: 22000, from: 48000, to: 26000,
        travelDetails: { poc: "John Smith", travelers: "Nugent, Joseph Pat", dates: "12–14 Mar 2024", purpose: "Geotechnical site inspection; combined with scheduled survey to reduce trip count." } },
    ],
  },
  {
    id: "102",
    projectNumber: "25T02",
    projectName: "Bridge Rehabilitation",
    projectDescription: "Structural reinforcement and resurfacing of the downtown suspension bridge.",
    submittedBy: "Sarah Jenkins",
    date: "2024-01-25",
    justification: "Additional org-code labor is required for the extended environmental compliance phase. Equipment transport trips have been consolidated and steel fasteners sourced locally, freeing those funds.",
    typeJustifications: {
      Labor:     "Environmental compliance phase extended by 6 weeks per regulatory review outcome dated 2024-01-20. Additional org-code hours required.",
      Travel:    "Equipment transport consolidated; single-carrier arrangement reduces trips from 4 to 2.",
      Materials: "Steel fasteners sourced from local supplier at 22% lower unit cost; quantity unchanged.",
    },
    status: "Pending",
    lineItems: [
      { direction: "Increase", type: "Labor",  orgCode: "U435310", resource: "U435310", amount: 45000, from: 280000, to: 325000 },
      { direction: "Decrease", type: "Travel", orgCode: "U435310", resource: "USACE Chicago District", amount: 47000, from: 155000, to: 108000,
        travelDetails: { poc: "Sarah Jenkins", travelers: "Jenkins, Sarah; Okafor, Chioma", dates: "18–19 Feb 2024", purpose: "Equipment transport coordination; consolidated from 4 trips to 2 via single-carrier arrangement." } },
      { direction: "Increase", type: "Labor",     orgCode: "U719203", resource: "Chen, David",         amount: 15000, from: 195000, to: 210000 },
      { direction: "Decrease", type: "Materials", orgCode: "U719203", resource: "Steel Fasteners",     amount: 13000, from: 45000, to: 32000,
        resourceDetails: { pop: "01 Jan 2024 – 30 Jun 2024", poc: "David Chen", purpose: "Steel fasteners sourced from local supplier at 22% lower unit cost; quantity and spec unchanged." } },
    ],
  },
  {
    id: "103",
    projectNumber: "24A03",
    projectName: "Downtown Water Main",
    projectDescription: "Replacement of 100-year-old water main infrastructure in the central business district.",
    submittedBy: "Elena Rodriguez",
    date: "2024-02-05",
    justification: "Adding Park, Jennifer to support excavation coordination. Funded by trimming Contractor Pool and Okafor hours. Small Cold Regions Research Lab site visit added by pulling remaining labor from Contractor Pool.",
    typeJustifications: {
      Labor:  "Park, Jennifer added for excavation coordination per field director request 2024-01-30. Offset by scope reduction for Okafor and Contractor Pool.",
      Travel: "Cold Regions Research Lab site visit added at request of technical advisor to assess soil conditions.",
    },
    status: "First Request",
    lineItems: [
      { direction: "Increase", type: "Labor",  orgCode: "U601847", resource: "Park, Jennifer",            amount:  9000, from:  145000, to:  154000 },
      { direction: "Decrease", type: "Labor",  orgCode: "U601847", resource: "Okafor, Chioma",             amount:  7000, from:   98000, to:   91000 },
      { direction: "Increase", type: "Travel", orgCode: "U601847", resource: "Cold Regions Research Lab", amount: 2000, from: 12000, to: 14000,
        travelDetails: { poc: "Elena Rodriguez", travelers: "Rodriguez, Elena", dates: "05–06 Mar 2024", purpose: "Soil condition assessment requested by technical advisor prior to excavation phase start." } },
      { direction: "Decrease", type: "Labor",  orgCode: "U601847", resource: "Contractor Pool",            amount:  4000, from:  412000, to:  408000 },
    ],
  },
  {
    id: "104",
    projectNumber: "24T04",
    projectName: "Airport Terminal Upgrade",
    projectDescription: "Modernization of Terminal B including new security checkpoints and concession areas.",
    submittedBy: "Marcus Thorne",
    date: "2024-01-18",
    justification: "Additional senior labor required for systems integration across all checkpoints. Value-engineered panel selection reduces materials spend to offset the labor increase.",
    typeJustifications: {
      Labor:     "Senior systems integration expertise required across all 7 checkpoint lanes; Rodriguez and Thorne are sole qualified resources on contract.",
      Materials: "Value-engineered composite panel selected over original steel/glass spec; equivalent structural rating at 35% lower cost per unit.",
    },
    status: "Pending",
    lineItems: [
      { direction: "Increase", type: "Labor",     orgCode: "U920183", resource: "Rodriguez, Elena",    amount: 75000,  from: 1125000, to: 1200000 },
      { direction: "Increase", type: "Labor",     orgCode: "U582094", resource: "Thorne, Marcus",       amount: 25000,  from: 625000,  to: 650000  },
      { direction: "Decrease", type: "Materials", orgCode: "U582094", resource: "Steel & Glass Panels", amount: 100000, from: 2850000, to: 2750000,
        resourceDetails: { pop: "15 Jan 2024 – 31 Oct 2024", poc: "Marcus Thorne", purpose: "Value-engineered composite panel replaces original steel/glass spec; equivalent structural rating at 35% lower cost per unit." } },
    ],
  },
  {
    id: "105",
    projectNumber: "25A05",
    projectName: "Metro Rail Extension",
    projectDescription: "Feasibility study and initial planning for the Westside light rail extension.",
    submittedBy: "David Chen",
    date: "2024-02-12",
    justification: "Chen, David absorbing additional feasibility tasks as Torres' scope is reduced. Pacific Ocean Division trip consolidated with ERDC visit, freeing those funds back into labor.",
    status: "First Request",
    lineItems: [
      { direction: "Increase", type: "Labor",  orgCode: "U334567", resource: "Chen, David",             amount: 4500, from:  84000, to:  88500 },
      { direction: "Decrease", type: "Labor",  orgCode: "U334567", resource: "Torres, Miguel A.",        amount: 3000, from:  62000, to:  59000 },
      { direction: "Decrease", type: "Travel", orgCode: "U334567", resource: "Pacific Ocean Division",   amount: 1500, from:  18000, to:  16500 },
    ],
  },
];
