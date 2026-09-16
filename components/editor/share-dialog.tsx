"use client";

import {
  Check,
  Clipboard,
  Loader2,
  Mail,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

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

interface Collaborator {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ShareDialogProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    async function loadCollaborators() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/projects/${projectId}/collaborators`,
        );
        const data = (await response.json()) as {
          error?: string;
          owner?: boolean;
          collaborators?: Collaborator[];
        };
        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load collaborators");
        }
        if (!cancelled) {
          setIsOwner(data.owner === true);
          setCollaborators(data.collaborators ?? []);
        }
      } catch (fetchError: unknown) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load collaborators",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCollaborators();

    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  async function inviteCollaborator() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Enter an email address");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = (await response.json()) as {
        error?: string;
        id?: string;
        email?: string;
        displayName?: string | null;
        avatarUrl?: string | null;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to invite collaborator");
      }

      setCollaborators((current) => [
        ...current,
        {
          id: data.id ?? normalizedEmail,
          email: data.email ?? normalizedEmail,
          displayName: data.displayName ?? null,
          avatarUrl: data.avatarUrl ?? null,
        },
      ]);
      setEmail("");
    } catch (inviteError: unknown) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Unable to invite collaborator",
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeCollaborator(collaboratorEmail: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: collaboratorEmail }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to remove collaborator");
      }
      setCollaborators((current) =>
        current.filter(
          ({ email: currentEmail }) => currentEmail !== collaboratorEmail,
        ),
      );
    } catch (removeError: unknown) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove collaborator",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyProjectLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-border bg-surface p-0 text-foreground shadow-2xl">
        <div className="p-5">
          <DialogHeader className="gap-3">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Share {projectName}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Invite people to collaborate on this workspace.
            </DialogDescription>
          </DialogHeader>

          {isOwner && (
            <div className="mt-5 flex gap-2">
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void inviteCollaborator();
                  }
                }}
                placeholder="collaborator@example.com"
                type="email"
                aria-label="Collaborator email"
              />
              <Button
                type="button"
                onClick={() => void inviteCollaborator()}
                disabled={loading}
                className="shrink-0 gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            </div>
          )}

          <div className="mt-5 space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Collaborators
            </div>
            {loading && collaborators.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading collaborators...
              </div>
            ) : collaborators.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                No collaborators yet.
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2"
                  >
                    {collaborator.avatarUrl ? (
                      <img
                        src={collaborator.avatarUrl}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent-foreground">
                        <Mail className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {collaborator.displayName ?? collaborator.email}
                      </div>
                      {collaborator.displayName && (
                        <div className="truncate text-xs text-muted-foreground">
                          {collaborator.email}
                        </div>
                      )}
                    </div>
                    {isOwner && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          void removeCollaborator(collaborator.email)
                        }
                        disabled={loading}
                        aria-label={`Remove ${collaborator.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="mt-5 flex-row justify-between gap-2 border-0 bg-transparent p-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyProjectLink()}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy link"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
