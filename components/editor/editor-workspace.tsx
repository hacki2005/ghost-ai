"use client";

import { Bot } from "lucide-react";
import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogHost } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import type { EditorProject } from "@/hooks/useProjectActions";
import { useProjectActions } from "@/hooks/useProjectActions";
import { useRouter } from "next/navigation";

interface EditorWorkspaceProps {
  project: EditorProject;
  ownedProjects: EditorProject[];
  sharedProjects: EditorProject[];
}

export function EditorWorkspace({
  project,
  ownedProjects,
  sharedProjects,
}: EditorWorkspaceProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const router = useRouter();
  const allProjects = [...ownedProjects, ...sharedProjects];
  const projectActions = useProjectActions(allProjects);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EditorNavbar
        projectName={project.name}
        isSidebarOpen={isSidebarOpen}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        onToggleAiSidebar={() => setIsAiSidebarOpen((current) => !current)}
        onShare={() => setIsShareDialogOpen(true)}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        activeProjectId={project.id}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onOpenProject={(nextProject) =>
          router.push(`/editor/${nextProject.id}`)
        }
        onCreate={projectActions.openCreate}
        onRename={projectActions.openRename}
        onDelete={projectActions.openDelete}
      />

      <main className="flex min-h-screen pt-14">
        <section className="flex min-w-0 flex-1 items-center justify-center bg-bg-base">
          <div className="flex flex-col items-center gap-3 text-center">
            <Bot className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-lg font-medium">Canvas workspace</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                The shared design canvas will appear here.
              </p>
            </div>
          </div>
        </section>

        {isAiSidebarOpen && (
          <aside className="w-[min(100%,360px)] shrink-0 border-l border-border bg-surface p-5">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-accent-ai-text" />
              <h2 className="text-sm font-medium">AI assistant</h2>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              AI chat will be available in this project workspace.
            </p>
          </aside>
        )}
      </main>

      <ProjectDialogHost {...projectActions} />
      <ShareDialog
        projectId={project.id}
        projectName={project.name}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />
    </div>
  );
}
