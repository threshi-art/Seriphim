import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings, Save, RotateCcw, MapPin, Brain, Compass,
  MessageSquare, Cpu, Scale, Globe, Users, Pen, Flame,
  BookOpen, FileText, ShieldAlert, LayoutDashboard, X, Plus,
} from "lucide-react";

const MODES = [
  { id: "standard", label: "Standard", icon: MessageSquare },
  { id: "eiram", label: "EiRAM Full Analysis", icon: Brain },
  { id: "legal", label: "Legal Analysis", icon: Scale },
  { id: "technical", label: "Technical Architecture", icon: Cpu },
  { id: "political", label: "Political & Ideological", icon: Globe },
  { id: "behavioral", label: "Personality & Behavioral", icon: Users },
  { id: "writing", label: "Writing & Rhetoric", icon: Pen },
  { id: "mythic", label: "Creative Mythic", icon: Flame },
  { id: "homework", label: "Homework Mode", icon: BookOpen },
  { id: "briefing", label: "Executive Briefing", icon: FileText },
  { id: "redteam", label: "Red Team Analysis", icon: ShieldAlert },
  { id: "dashboard", label: "Dashboard Output", icon: LayoutDashboard },
];

export default function SettingsPage() {
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const updateSettings = trpc.settings.update.useMutation();
  const utils = trpc.useUtils();

  const [defaultMode, setDefaultMode] = useState("standard");
  const [weatherCity, setWeatherCity] = useState("Seattle");
  const [formality, setFormality] = useState(50);
  const [humor, setHumor] = useState(30);
  const [depth, setDepth] = useState(70);
  const [interests, setInterests] = useState<string[]>(["aerospace", "technology", "science"]);
  const [newInterest, setNewInterest] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setDefaultMode(settings.defaultMode || "standard");
      setWeatherCity(settings.weatherCity || "Seattle");
      const pt = settings.personalityTuning as any;
      if (pt) {
        setFormality(pt.formality ?? 50);
        setHumor(pt.humor ?? 30);
        setDepth(pt.depth ?? 70);
      }
      const di = settings.discoverInterests as any;
      if (Array.isArray(di)) setInterests(di);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        defaultMode,
        weatherCity,
        personalityTuning: { formality, humor, depth },
        discoverInterests: interests,
      });
      utils.settings.get.invalidate();
      setDirty(false);
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error("Failed to save settings: " + (e.message || "Unknown error"));
    }
  };

  const handleReset = () => {
    setDefaultMode("standard");
    setWeatherCity("Seattle");
    setFormality(50);
    setHumor(30);
    setDepth(70);
    setInterests(["aerospace", "technology", "science"]);
    setDirty(true);
  };

  const addInterest = () => {
    const trimmed = newInterest.trim().toLowerCase();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setNewInterest("");
      setDirty(true);
    }
  };

  const removeInterest = (i: string) => {
    setInterests(interests.filter(x => x !== i));
    setDirty(true);
  };

  const markDirty = () => setDirty(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Settings className="h-5 w-5 animate-spin" />
          <span className="text-sm font-mono">Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Configuration</h1>
              <p className="text-sm text-muted-foreground">Seraphim operating parameters</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending} className="gap-1.5 text-xs">
              <Save className="h-3.5 w-3.5" />
              {updateSettings.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {dirty && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-2 text-xs text-yellow-400 font-mono">
            Unsaved changes detected
          </div>
        )}

        {/* Default Mode */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> Default Operating Mode
            </CardTitle>
            <CardDescription className="text-xs">Sets the default mode when opening a new chat conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={defaultMode} onValueChange={v => { setDefaultMode(v); markDirty(); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{m.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Weather Location */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Default Weather Location
            </CardTitle>
            <CardDescription className="text-xs">Preferred city for the Weather module on load</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={weatherCity}
                onChange={e => { setWeatherCity(e.target.value); markDirty(); }}
                placeholder="City name..."
                className="flex-1"
              />
            </div>
            <div className="flex gap-2 mt-3">
              {["Seattle", "Los Angeles", "New York", "London", "Tokyo"].map(city => (
                <button
                  key={city}
                  onClick={() => { setWeatherCity(city); markDirty(); }}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    weatherCity === city
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Personality Tuning */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> Personality Tuning
            </CardTitle>
            <CardDescription className="text-xs">Adjust Seraphim's communication style parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono text-muted-foreground">FORMALITY</Label>
                <span className="text-xs font-mono text-primary">{formality}%</span>
              </div>
              <Slider
                value={[formality]}
                onValueChange={v => { setFormality(v[0]); markDirty(); }}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/60">
                <span>Casual</span>
                <span>Formal</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono text-muted-foreground">HUMOR</Label>
                <span className="text-xs font-mono text-primary">{humor}%</span>
              </div>
              <Slider
                value={[humor]}
                onValueChange={v => { setHumor(v[0]); markDirty(); }}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/60">
                <span>Serious</span>
                <span>Witty</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono text-muted-foreground">DEPTH</Label>
                <span className="text-xs font-mono text-primary">{depth}%</span>
              </div>
              <Slider
                value={[depth]}
                onValueChange={v => { setDepth(v[0]); markDirty(); }}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/60">
                <span>Concise</span>
                <span>Comprehensive</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discover Interests */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" /> Discover Interests
            </CardTitle>
            <CardDescription className="text-xs">Default interests for the Discover (StumbleUpon) module</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {interests.map(i => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1 text-xs">
                  {i}
                  <button onClick={() => removeInterest(i)} className="ml-1 hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {interests.length === 0 && (
                <span className="text-xs text-muted-foreground italic">No interests configured</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={e => setNewInterest(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addInterest(); } }}
                placeholder="Add interest..."
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={addInterest} className="gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" /> System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Version</span>
                <span className="text-foreground">5.0.0</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Modules</span>
                <span className="text-foreground">15</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Engine</span>
                <span className="text-foreground">LLM v4</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">EiRAM</span>
                <span className="text-foreground">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
