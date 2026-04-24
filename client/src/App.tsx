import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import ChatPage from "./pages/ChatPage";
import NetworkPage from "./pages/NetworkPage";
import CodePage from "./pages/CodePage";
import EngineeringPage from "./pages/EngineeringPage";
import AnalysisPage from "./pages/AnalysisPage";
import MemoryPage from "./pages/MemoryPage";
import PluginsPage from "./pages/PluginsPage";
import AuditPage from "./pages/AuditPage";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={ChatPage} />
        <Route path="/network" component={NetworkPage} />
        <Route path="/code" component={CodePage} />
        <Route path="/engineering" component={EngineeringPage} />
        <Route path="/analysis" component={AnalysisPage} />
        <Route path="/memory" component={MemoryPage} />
        <Route path="/plugins" component={PluginsPage} />
        <Route path="/audit" component={AuditPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
