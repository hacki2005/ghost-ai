import { UserButton } from "@clerk/nextjs";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  projectName?: string;
  isSidebarOpen: boolean;
  isAiSidebarOpen?: boolean;
  onToggleSidebar: () => void;
  onToggleAiSidebar?: () => void;
  onShare?: () => void;
}

export function EditorNavbar({
  projectName = "Workspace",
  isSidebarOpen,
  isAiSidebarOpen = false,
  onToggleSidebar,
  onToggleAiSidebar = () => undefined,
  onShare = () => undefined,
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
          <span className="max-w-[240px] truncate text-sm font-medium text-foreground">
            {projectName}
          </span>
        </div>

        <div className="flex w-1/3 items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onShare}
            aria-label="Share project"
            className="text-foreground hover:bg-muted"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleAiSidebar}
            aria-label={
              isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"
            }
            className="text-foreground hover:bg-muted"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
