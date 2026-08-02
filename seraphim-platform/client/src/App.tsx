import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import TopNav from "./components/TopNav";
import { NavigationCommandPalette } from "./components/NavigationCommandPalette";
import LandingPage from "./pages/LandingPage";
import CommandDeckPage from "./pages/CommandDeckPage";
import ComponentShowcase from "./pages/ComponentShowcase";
import {
  AnalysisPage,
  ArgusTerraPage,
  ArgusVigilPage,
  AuditPage,
  ChatPage,
  CodePage,
  DiscoverPage,
  EngineeringPage,
  FlightsPage,
  InsightForgePage,
  InstagramPage,
  LocalAgentPage,
  MarineTrafficPage,
  MemoryPage,
  NetworkIntelPage,
  NetworkPage,
  NewsPage,
  PluginsPage,
  SentinelPage,
  SettingsPage,
  TeamDashboardPage,
  WeatherPage,
} from "./pages/dashboard";
import { SeraphimChatSheet } from "./components/chat/SeraphimChatSheet";

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={TeamDashboardPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/agent" component={LocalAgentPage} />
        <Route path="/network" component={NetworkPage} />
        <Route path="/argus-vigil" component={ArgusVigilPage} />
        <Route path="/argus-terra" component={ArgusTerraPage} />
        <Route path="/argus-terra/session/:id" component={ArgusTerraPage} />
        <Route path="/code" component={CodePage} />
        <Route path="/engineering" component={EngineeringPage} />
        <Route path="/analysis" component={AnalysisPage} />
        <Route path="/insightforge" component={InsightForgePage} />
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
          <SeraphimChatSheet />
          <NavigationCommandPalette />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
