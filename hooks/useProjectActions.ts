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

export function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function makeRoomSuffix() {
  return Math.random().toString(36).slice(2, 7);
}

export function makeRoomId(name: string, suffix: string) {
  return `${makeSlug(name) || "project"}-${suffix}`;
}

async function readErrorMessage(response: Response) {
  try {
    const payload = await response.json();
    return payload.error ?? "Failed";
  } catch {
    return response.statusText || "Failed";
  }
}

export function useProjectActions(projects: EditorProject[] = []) {
  const router = useRouter();
  const pathname = usePathname();

  const [dialog, setDialog] = useState<ProjectDialogState | null>(null);
  const [createName, setCreateName] = useState("");
  const [createRoomSuffix, setCreateRoomSuffix] = useState("");
  const [renameName, setRenameName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setDialog({ type: "create" });
    setCreateName("");
    setCreateRoomSuffix(makeRoomSuffix());
    setLoading(false);
    setError(null);
  };

  const openRename = (project: EditorProject) => {
    setDialog({ type: "rename", project });
    setRenameName(project.name);
    setLoading(false);
    setError(null);
  };

  const openDelete = (project: EditorProject) => {
    setDialog({ type: "delete", project });
    setLoading(false);
    setError(null);
  };

  const closeDialog = () => {
    setDialog(null);
    setLoading(false);
    setError(null);
  };

  const submitCreate = async () => {
    if (!createName.trim()) return;

    setLoading(true);

    const roomId = makeRoomId(createName, createRoomSuffix);
    setError(null);

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
      setError(error instanceof Error ? error.message : "Failed to create project");
      setLoading(false);
      return;
    }

    closeDialog();
  };

  const submitRename = async () => {
    const target = dialog?.project;

    if (!target || !renameName.trim()) return;

    setLoading(true);
    setError(null);

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
      setError(error instanceof Error ? error.message : "Failed to rename project");
      setLoading(false);
      return;
    }

    closeDialog();
  };

  const submitDelete = async () => {
    const target = dialog?.project;

    if (!target) return;

    setLoading(true);
    setError(null);

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
      setError(error instanceof Error ? error.message : "Failed to delete project");
      setLoading(false);
      return;
    }

    closeDialog();
  };

  return {
    dialog,
    createName,
    createRoomId: makeRoomId(createName, createRoomSuffix),
    setCreateName,
    renameName,
    setRenameName,
    loading,
    error,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  };
}
