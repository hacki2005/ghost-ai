import { SignIn } from "@clerk/nextjs";

import { clerkAppearance } from "@/lib/clerk-appearance";

/** Renders the Clerk sign-in flow inside the Ghost AI authentication shell. */
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="w-full max-w-[1360px] overflow-hidden rounded-[30px] border border-border bg-background shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="grid min-h-[760px] w-full lg:grid-cols-2">
          <aside className="flex flex-col justify-between border-b border-border bg-[var(--bg-elevated)] p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-base)] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
                G
              </div>
              <div className="text-[1.125rem] font-medium tracking-[-0.02em] text-foreground">
                Ghost AI
              </div>
            </div>

            <div className="space-y-8 pt-16">
              <div className="space-y-5">
                <h1 className="max-w-[440px] text-[clamp(2.75rem,4vw,4rem)] font-medium leading-[1.02] tracking-[-0.06em] text-foreground">
                  Design systems at the speed of thought.
                </h1>

                <p className="max-w-[480px] text-base leading-7 text-muted-foreground">
                  Describe your architecture in plain English. Ghost AI maps it
                  to a shared canvas where your team can refine it in real time.
                </p>
              </div>

              <ul className="space-y-5 text-[1.05rem] text-foreground/90">
                {[
                  {
                    title: "AI Architecture Generation",
                    description:
                      "Describe your system, AI maps it to nodes and edges on a live canvas.",
                  },
                  {
                    title: "Real-time Collaboration",
                    description:
                      "Live cursors, presence indicators, and shared node editing across your team.",
                  },
                  {
                    title: "Instant Spec Generation",
                    description:
                      "Export a complete Markdown technical spec directly from the canvas graph.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-4">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-[var(--bg-base)] text-[0.65rem] text-foreground">
                      ✓
                    </span>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">
                        {item.title}
                      </div>
                      <div className="text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <main className="flex items-center justify-center bg-[var(--bg-base)] px-4 py-8 sm:px-8 lg:px-12">
            <div className="w-full max-w-[520px] rounded-[26px] border border-border bg-[var(--bg-surface)] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.01)] sm:p-6">
              <SignIn
                appearance={clerkAppearance}
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
