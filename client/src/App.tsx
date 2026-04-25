import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";
import NetworkPage from "./pages/NetworkPage";
import CodePage from "./pages/CodePage";
import EngineeringPage from "./pages/EngineeringPage";
import AnalysisPage from "./pages/AnalysisPage";
import MemoryPage from "./pages/MemoryPage";
import PluginsPage from "./pages/PluginsPage";
import AuditPage from "./pages/AuditPage";
import DiscoverPage from "./pages/DiscoverPage";
import NewsPage from "./pages/NewsPage";
import WeatherPage from "./pages/WeatherPage";
import FlightsPage from "./pages/FlightsPage";
import SettingsPage from "./pages/SettingsPage";
import InstagramPage from "./pages/InstagramPage";

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/chat" component={ChatPage} />
        <Route path="/network" component={NetworkPage} />
        <Route path="/code" component={CodePage} />
        <Route path="/engineering" component={EngineeringPage} />
        <Route path="/analysis" component={AnalysisPage} />
        <Route path="/memory" component={MemoryPage} />
        <Route path="/plugins" component={PluginsPage} />
        <Route path="/audit" component={AuditPage} />
        <Route path="/discover" component={DiscoverPage} />
        <Route path="/news" component={NewsPage} />
        <Route path="/weather" component={WeatherPage} />
        <Route path="/flights" component={FlightsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/instagram" component={InstagramPage} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/404" component={NotFound} />
      {/* All dashboard routes */}
      <Route component={DashboardRouter} />
    </Switch>
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
