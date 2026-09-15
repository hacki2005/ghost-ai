import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { EditorWorkspace } from "@/components/editor/editor-workspace";
import { getEditorProjects } from "@/lib/project-data";
import {
  getCurrentClerkIdentity,
  getProjectAccess,
} from "@/lib/project-access";

interface EditorRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function EditorRoomPage({ params }: EditorRoomPageProps) {
  const { userId } = await getCurrentClerkIdentity();

  if (!userId) {
    redirect("/sign-in");
  }

  const { roomId } = await params;
  const project = await getProjectAccess(roomId);

  if (!project) {
    return <AccessDenied />;
  }

  const { ownedProjects, sharedProjects } = await getEditorProjects();
  const workspaceProject = {
    id: project.id,
    name: project.name,
    owner: project.ownerId === userId,
  };

  return (
    <EditorWorkspace
      project={workspaceProject}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}
