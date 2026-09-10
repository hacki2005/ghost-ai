"use client";

import { MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MockProject } from "@/components/editor/use-project-dialogs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: MockProject[];
  onCreate: () => void;
  onRename: (project: MockProject) => void;
  onDelete: (project: MockProject) => void;
}

export function ProjectSidebar({
  isOpen,
  onClose,
  projects,
  onCreate,
  onRename,
  onDelete,
}: ProjectSidebarProps) {
  return (
    <>
      <div
        className={[
          "fixed inset-0 z-30 bg-black/30 transition-opacity duration-200 md:hidden",
          isOpen ? "block opacity-100" : "hidden opacity-0",
        ].join(" ")}
        onClick={onClose}
      />

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
                <div className="space-y-2">
                  {projects
                    .filter((project) => project.owner)
                    .map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2"
                      >
                        <span className="text-sm text-foreground">
                          {project.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Rename ${project.name}`}
                            onClick={() => onRename(project)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${project.name}`}
                            onClick={() => onDelete(project)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  {projects.filter((project) => project.owner).length === 0 && (
                    <div className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground">
                      No projects yet.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="shared" className="mt-4 flex-1">
                <div className="space-y-2">
                  {projects
                    .filter((project) => !project.owner)
                    .map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2"
                      >
                        <span className="text-sm text-foreground">
                          {project.name}
                        </span>
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border">
                          <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                        </span>
                      </div>
                    ))}
                  {projects.filter((project) => !project.owner).length ===
                    0 && (
                    <div className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground">
                      No shared projects.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="border-t border-border p-3">
            <Button
              type="button"
              className="w-full justify-center gap-2"
              onClick={onCreate}
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
