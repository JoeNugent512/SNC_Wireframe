export interface ScheduleMilestone {
  key: string;
  label: string;
  pct: number;
  required: boolean;
  planned: string;
  actual: string;
}

export interface MilestoneDefinition {
  key: string;
  label: string;
  pct: number;
  required: boolean;
}

export const ALL_MILESTONE_DEFS: MilestoneDefinition[] = [
  { key: "awarded",       label: "Awarded / Started",                   pct: 0,   required: true },
  { key: "kickoff",       label: "Kickoff Meeting",                      pct: 1,   required: false },
  { key: "outline",       label: "Outline / Concept Review",             pct: 10,  required: false },
  { key: "outline_res",   label: "Outline / Concept Comments Resolved",  pct: 15,  required: false },
  { key: "rev35",         label: "35% Review",                           pct: 30,  required: false },
  { key: "res35",         label: "35% Comments Resolved",                pct: 35,  required: false },
  { key: "interim",       label: "Interim Review",                       pct: 60,  required: false },
  { key: "interim_res",   label: "Interim Review Comments Resolved",     pct: 85,  required: false },
  { key: "pre_final",     label: "Pre Final Review",                     pct: 90,  required: true },
  { key: "pre_final_res", label: "Pre Final Review Comments Resolved",   pct: 95,  required: false },
  { key: "final_coord",   label: "Final Review & Coordination",          pct: 97,  required: false },
  { key: "final_dwg",     label: "Final to DWG",                         pct: 98,  required: true },
  { key: "dvg_res",       label: "DVG Comments Resolved",                pct: 99,  required: false },
  { key: "complete",      label: "Complete",                             pct: 100, required: true },
];
