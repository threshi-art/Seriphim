import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import TopNav from "./components/TopNav";
import LandingPage from "./pages/LandingPage";
import CommandDeckPage from "./pages/CommandDeckPage";
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
import MarineTrafficPage from "./pages/MarineTrafficPage";
import SettingsPage from "./pages/SettingsPage";
import InstagramPage from "./pages/InstagramPage";
import SentinelPage from "./pages/SentinelPage";
import NetworkIntelPage from "./pages/NetworkIntelPage";
import ArgusVigilPage from "./pages/ArgusVigilPage";
import ComponentShowcase from "./pages/ComponentShowcase";
import ArgusTerraPage from "./pages/ArgusTerraPage";

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/chat" component={ChatPage} />
        <Route path="/network" component={NetworkPage} />
        <Route path="/argus-vigil" component={ArgusVigilPage} />
        <Route path="/argus-terra" component={ArgusTerraPage} />
        <Route path="/argus-terra/session/:id" component={ArgusTerraPage} />
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
        <Route path="/marine-traffic" component={MarineTrafficPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/instagram" component={InstagramPage} />
        <Route path="/sentinel" component={SentinelPage} />
        <Route path="/netintel" component={NetworkIntelPage} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/deck" component={CommandDeckPage} />
      <Route path="/components" component={ComponentShowcase} />
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
          <TopNav />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
