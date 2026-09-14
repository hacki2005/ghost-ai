import { EditorHome } from "@/components/editor/editor-home";
import { getEditorProjects } from "@/lib/project-data";

/** Loads the current user's projects and renders the editor home screen. */
export default async function EditorPage() {
  const { ownedProjects, sharedProjects } = await getEditorProjects();

  return (
    <EditorHome ownedProjects={ownedProjects} sharedProjects={sharedProjects} />
  );
}
