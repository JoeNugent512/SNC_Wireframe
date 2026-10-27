import { createContext, useContext, useState, ReactNode } from "react";
import { Project } from "./mockData";

export type Role = "Project Lead" | "Admin" | "Proponent" | "Budget Analyst" | "Program Team";

export interface DemoUser {
  name: string;
  role: Role;
  canEdit: (project: Project) => boolean;
}

export const DEMO_USERS: DemoUser[] = [
  {
    name: "John Smith",
    role: "Project Lead",
    canEdit: (p) => p.projectLead === "John Smith",
  },
  {
    name: "Brandon Martin",
    role: "Project Lead",
    canEdit: p => p.projectLead === "Brandon Martin",
  },
  {
    name: "Jansen Moon",
    role: "Admin",
    canEdit: () => true,
  },
  {
    name: "Joe Bush",
    role: "Proponent",
    canEdit: () => true,
  },
  {
    name: "Tracy Woodcox",
    role: "Program Team",
    canEdit: () => false,
  },
];

interface UserContextValue {
  user: DemoUser;
  users: readonly DemoUser[];
  setUser: (u: DemoUser) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser>(DEMO_USERS[0]);
  return (
    <UserContext.Provider value={{ user, users: DEMO_USERS, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
