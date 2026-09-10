"use client";

import { useState } from "react";

export type ProjectDialogType = "create" | "rename" | "delete";

export interface MockProject {
  id: string;
  name: string;
  owner: boolean;
}

export interface ProjectDialogState {
  type: ProjectDialogType;
  project?: MockProject;
}

export function useProjectDialogs() {
  const [dialog, setDialog] = useState<ProjectDialogState | null>(null);
  const [createName, setCreateName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [loading, setLoading] = useState(false);

  const openCreate = () => {
    setDialog({ type: "create" });
    setCreateName("");
    setLoading(false);
  };

  const openRename = (project: MockProject) => {
    setDialog({ type: "rename", project });
    setRenameName(project.name);
    setLoading(false);
  };

  const openDelete = (project: MockProject) => {
    setDialog({ type: "delete", project });
    setLoading(false);
  };

  const closeDialog = () => {
    setDialog(null);
    setLoading(false);
  };

  const submitCreate = () => {
    setLoading(true);
    closeDialog();
  };

  const submitRename = () => {
    setLoading(true);
    closeDialog();
  };

  const submitDelete = () => {
    setLoading(true);
    closeDialog();
  };

  return {
    dialog,
    createName,
    setCreateName,
    renameName,
    setRenameName,
    loading,
    setLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  };
}
