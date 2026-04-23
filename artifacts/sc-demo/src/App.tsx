import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import ProjectList from "@/pages/ProjectList";
import ProjectPlanning from "@/pages/ProjectPlanning";
import ProjectSettings from "@/pages/ProjectSettings";
import ChangeRequests from "@/pages/ChangeRequests";
import SetupQueue from "@/pages/SetupQueue";
import ProjectSetup from "@/pages/ProjectSetup";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/projects" component={ProjectList} />
      <Route path="/projects/:id/planning" component={ProjectPlanning} />
      <Route path="/projects/:id/settings" component={ProjectSettings} />
      <Route path="/change-requests" component={ChangeRequests} />
      <Route path="/setup" component={SetupQueue} />
      <Route path="/setup/:id" component={ProjectSetup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
