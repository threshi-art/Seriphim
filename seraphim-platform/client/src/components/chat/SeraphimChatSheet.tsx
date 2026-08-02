import { useChatSession } from "@/contexts/ChatSessionContext";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Right-side slide-over for Seraphim chat. Shares session state with the full Chat page.
 */
export function SeraphimChatSheet() {
  const { sidePanelOpen, setSidePanelOpen } = useChatSession();

  return (
    <Sheet open={sidePanelOpen} onOpenChange={setSidePanelOpen}>
      <SheetContent
        side="right"
        className={cn(
          "flex w-full flex-col gap-0 border-l border-border/60 bg-background p-0",
          "sm:max-w-none md:w-[min(100vw-2rem,720px)]",
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Seraphim</SheetTitle>
          <SheetDescription>AI assistant chat panel</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col pt-10">
          <ChatWorkspace variant="sheet" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
