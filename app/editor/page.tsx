"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogHost } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { useProjectDialogs } from "@/components/editor/use-project-dialogs";
import { Button } from "@/components/ui/button";

const mockProjects = [
  { id: "project-1", name: "Architecture Workspace", owner: true },
  { id: "project-2", name: "Payments Platform", owner: false },
  { id: "project-3", name: "AI Operations", owner: true },
];

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [projects] = useState(mockProjects);
  const {
    dialog,
    createName,
    renameName,
    loading,
    setCreateName,
    setRenameName,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  } = useProjectDialogs();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={projects}
        onCreate={openCreate}
        onRename={openRename}
        onDelete={openDelete}
      />

      <main className="relative min-h-screen pt-14">
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
          <section className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Create a project or open an existing one
              </h1>
              <p className="text-sm text-muted-foreground">
                Start a new architecture workspace, or choose a project from the sidebar.
              </p>
            </div>

            <Button type="button" className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </section>
        </div>
      </main>

      <ProjectDialogHost
        dialog={dialog}
        createName={createName}
        renameName={renameName}
        loading={loading}
        setCreateName={setCreateName}
        setRenameName={setRenameName}
        closeDialog={closeDialog}
        submitCreate={submitCreate}
        submitRename={submitRename}
        submitDelete={submitDelete}
      />
    </div>
  );
}
