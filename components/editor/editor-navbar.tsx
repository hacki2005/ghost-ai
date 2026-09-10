import { UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
}: EditorNavbarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 h-14 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center justify-between px-4">
        <div className="flex w-1/3 items-center justify-start">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            className="text-foreground hover:bg-muted"
            aria-label={
              isSidebarOpen ? "Close project sidebar" : "Open project sidebar"
            }
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex w-1/3 items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground">
            Workspace
          </span>
        </div>

        <div className="flex w-1/3 items-center justify-end">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
