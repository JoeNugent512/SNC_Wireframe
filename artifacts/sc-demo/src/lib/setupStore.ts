export interface Deliverable {
  id: string;
  type: string;
  numDesc: string;
}

export interface CharterStoreData {
  projectId: string;
  projectNumber: string;
  projectName: string;
  deliverables: Deliverable[];
  needsContractSupport?: "" | "Yes" | "No" | "N/A";
  contractSupportOrganization?: string;
}

const _store: CharterStoreData = {
  projectId: "",
  projectNumber: "",
  projectName: "",
  deliverables: [],
};

export function saveCharterData(data: CharterStoreData) {
  Object.assign(_store, data);
}

export function getCharterData(): CharterStoreData {
  return { ..._store, deliverables: [..._store.deliverables] };
}
