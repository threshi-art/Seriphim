import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 mb-2">Error 404</p>
        <h1 className="text-3xl font-bold text-foreground mb-2">Page Not Found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The requested resource does not exist or has been relocated.
        </p>
        <Button
          onClick={() => setLocation("/chat")}
          size="sm"
          className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Home className="h-3.5 w-3.5" />
          Return to Chat
        </Button>
      </div>
    </div>
  );
}
