import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/lib/userContext";
import { ChangeRequestsProvider } from "@/lib/changeRequestsContext";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import ProjectList from "@/pages/ProjectList";
import PlanningDashboard from "@/pages/PlanningDashboard";
import ProjectPlanning from "@/pages/ProjectPlanning";
import ProjectRequest from "@/pages/ProjectRequest";
import ProjectSettings from "@/pages/ProjectSettings";
import ChangeRequests from "@/pages/ChangeRequests";
import ChangeRequestDetail from "@/pages/ChangeRequestDetail";
import SetupQueue from "@/pages/SetupQueue";
import ProjectSetup from "@/pages/ProjectSetup";
import ProjectSchedule from "@/pages/ProjectSchedule";
import ScratchPlanner from "@/pages/ScratchPlanner";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/projects" component={ProjectList} />
      <Route path="/projects/:id/planning/legacy" component={ProjectPlanning} />
      <Route path="/projects/:id/planning" component={PlanningDashboard} />
      <Route path="/projects/:id/request" component={ProjectRequest} />
      <Route path="/projects/:id/settings" component={ProjectSettings} />
      <Route path="/change-requests" component={ChangeRequests} />
      <Route path="/change-requests/:id" component={ChangeRequestDetail} />
      <Route path="/setup" component={SetupQueue} />
      <Route path="/setup/new/schedule" component={ProjectSchedule} />
      <Route path="/setup/new" component={ProjectSetup} />
      <Route path="/setup/:id/schedule" component={ProjectSchedule} />
      <Route path="/setup/:id" component={ProjectSetup} />
      <Route path="/scratch" component={ScratchPlanner} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <ChangeRequestsProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </ChangeRequestsProvider>
        </UserProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
