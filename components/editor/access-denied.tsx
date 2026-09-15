import { LockKeyhole } from "lucide-react";
import Link from "next/link";

export function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Project access denied</h1>
          <p className="text-sm text-muted-foreground">
            This project does not exist or you do not have access to it.
          </p>
        </div>
        <Link
          href="/editor"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to projects
        </Link>
      </section>
    </main>
  );
}
