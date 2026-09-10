"use client";

import { AlertTriangle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ProjectDialogState } from "@/components/editor/use-project-dialogs";

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ProjectDialogHostProps {
  dialog: ProjectDialogState | null;
  createName: string;
  renameName: string;
  loading: boolean;
  setCreateName: (name: string) => void;
  setRenameName: (name: string) => void;
  closeDialog: () => void;
  submitCreate: () => void;
  submitRename: () => void;
  submitDelete: () => void;
}

export function ProjectDialogHost({
  dialog,
  createName,
  renameName,
  loading,
  setCreateName,
  setRenameName,
  closeDialog,
  submitCreate,
  submitRename,
  submitDelete,
}: ProjectDialogHostProps) {
  const project = dialog?.project;

  return (
    <>
      <Dialog
        open={dialog?.type === "create"}
        onOpenChange={(next) => {
          if (!next) closeDialog();
        }}
      >
        <DialogContent className="max-w-md rounded-3xl border border-border bg-surface p-0 text-foreground shadow-2xl">
          <div className="p-5">
            <DialogHeader className="gap-3">
              <DialogTitle className="text-lg font-semibold text-foreground">
                Create Project
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Create a new architecture workspace.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Project name
                </label>
                <Input
                  autoFocus
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  placeholder="Project name"
                />
              </div>

              <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Slug preview
                </div>
                <div className="mt-1 font-mono text-sm text-foreground">
                  /{makeSlug(createName) || "project-name"}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-5 flex-row justify-end gap-2 border-0 bg-transparent p-0">
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitCreate}
                className="gap-2"
                disabled={loading || createName.trim().length === 0}
              >
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog?.type === "rename"}
        onOpenChange={(next) => {
          if (!next) closeDialog();
        }}
      >
        <DialogContent className="max-w-md rounded-3xl border border-border bg-surface p-0 text-foreground shadow-2xl">
          <div className="p-5">
            <DialogHeader className="gap-3">
              <DialogTitle className="text-lg font-semibold text-foreground">
                Rename Project
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Current project name: {project?.name ?? "Untitled project"}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Project name
                </label>
                <Input
                  autoFocus
                  value={renameName}
                  onChange={(event) => setRenameName(event.target.value)}
                  placeholder="Project name"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitRename();
                    }
                  }}
                />
              </div>
            </div>

            <DialogFooter className="mt-5 flex-row justify-end gap-2 border-0 bg-transparent p-0">
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitRename}
                disabled={loading || renameName.trim().length === 0}
              >
                Save
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog?.type === "delete"}
        onOpenChange={(next) => {
          if (!next) closeDialog();
        }}
      >
        <DialogContent className="max-w-md rounded-3xl border border-border bg-surface p-0 text-foreground shadow-2xl">
          <div className="p-5">
            <DialogHeader className="gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Delete Project
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-semibold text-foreground">{project?.name}</span>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-5 flex-row justify-end gap-2 border-0 bg-transparent p-0">
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={submitDelete}
                disabled={loading}
              >
                Delete Project
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
