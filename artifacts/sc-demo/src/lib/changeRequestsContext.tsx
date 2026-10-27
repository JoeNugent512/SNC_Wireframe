import { createContext, useContext, useState, ReactNode } from "react";
import { ChangeRequest, MOCK_CHANGE_REQUESTS } from "./mockData";

interface CRContextValue {
  changeRequests: ChangeRequest[];
  addChangeRequest: (cr: ChangeRequest) => void;
}

const CRContext = createContext<CRContextValue | null>(null);

export function ChangeRequestsProvider({ children }: { children: ReactNode }) {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(MOCK_CHANGE_REQUESTS);

  const addChangeRequest = (cr: ChangeRequest) =>
    setChangeRequests((prev) => [cr, ...prev]);

  return (
    <CRContext.Provider value={{ changeRequests, addChangeRequest }}>
      {children}
    </CRContext.Provider>
  );
}

export function useChangeRequests(): CRContextValue {
  const ctx = useContext(CRContext);
  if (!ctx) throw new Error("useChangeRequests must be used within ChangeRequestsProvider");
  return ctx;
}
