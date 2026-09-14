"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export type ProjectDialogType = "create" | "rename" | "delete";

export interface EditorProject {
  id: string;
  name: string;
  owner: boolean;
}

export interface ProjectDialogState {
  type: ProjectDialogType;
  project?: EditorProject;
}

/** Converts a project name to a lowercase, hyphen-delimited slug. */
export function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Generates a short, non-cryptographic base-36 suffix for a room ID. */
export function makeRoomSuffix() {
  return Math.random().toString(36).slice(2, 7);
}

/** Extracts an API error message, with status-text and generic fallbacks. */
async function readErrorMessage(response: Response) {
  try {
    const payload = await response.json();
    return payload.error ?? "Failed";
  } catch {
    return response.statusText || "Failed";
  }
}

/**
 * Manages project dialogs and create, rename, and delete requests.
 * Successful requests navigate or refresh the editor as appropriate.
 */
export function useProjectActions(projects: EditorProject[] = []) {
  const router = useRouter();
  const pathname = usePathname();

  const [dialog, setDialog] = useState<ProjectDialogState | null>(null);
  const [createName, setCreateName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [loading, setLoading] = useState(false);

  const openCreate = () => {
    setDialog({ type: "create" });
    setCreateName("");
    setLoading(false);
  };

  const openRename = (project: EditorProject) => {
    setDialog({ type: "rename", project });
    setRenameName(project.name);
    setLoading(false);
  };

  const openDelete = (project: EditorProject) => {
    setDialog({ type: "delete", project });
    setLoading(false);
  };

  const closeDialog = () => {
    setDialog(null);
    setLoading(false);
  };

  const submitCreate = async () => {
    if (!createName.trim()) return;

    setLoading(true);

    const suffix = makeRoomSuffix();
    const slug = makeSlug(createName);
    const roomId = `${slug || "project"}-${suffix}`;

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim(), roomId }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
      }

      const project = await response.json();
      router.push(`/editor/${project.id}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    closeDialog();
  };

  const submitRename = async () => {
    const target = dialog?.project;

    if (!target || !renameName.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName.trim() }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    closeDialog();
  };

  const submitDelete = async () => {
    const target = dialog?.project;

    if (!target) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${target.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
      }

      const active = pathname === `/editor/${target.id}`;

      if (active) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    closeDialog();
  };

  return {
    dialog,
    createName,
    setCreateName,
    renameName,
    setRenameName,
    loading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  };
}
