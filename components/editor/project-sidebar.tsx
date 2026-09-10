import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Renders project navigation, disabling interaction while the sidebar is closed. */
export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 w-[320px] border-r border-border bg-background/95 shadow-lg shadow-black/10 backdrop-blur-sm transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
      inert={!isOpen}
      aria-label="Project sidebar"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">Projects</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close projects sidebar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 flex-col px-3 py-3">
          <Tabs defaultValue="my-projects" className="flex h-full flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="mt-4 flex-1">
              <div className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground">
                No projects yet.
              </div>
            </TabsContent>

            <TabsContent value="shared" className="mt-4 flex-1">
              <div className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground">
                No shared projects.
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-border p-3">
          <Button type="button" className="w-full justify-center gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>
    </aside>
  );
}
