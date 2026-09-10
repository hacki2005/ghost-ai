import { dark } from "@clerk/ui/themes";

export const clerkAppearance = {
  theme: dark,
  variables: {
    colorPrimary: "var(--accent-ai)",
    colorPrimaryForeground: "var(--text-primary)",
    colorNeutral: "var(--text-muted)",
    colorForeground: "var(--text-primary)",
    colorMutedForeground: "var(--text-muted)",
    colorBackground: "var(--bg-surface)",
    colorInput: "var(--bg-subtle)",
    colorInputForeground: "var(--text-primary)",
    colorBorder: "var(--border-default)",
    colorSuccess: "var(--state-success)",
    colorDanger: "var(--state-error)",
    borderRadius: "0.875rem",
  },
  elements: {
    card: "border-0 bg-transparent shadow-none",
    rootBox: "w-full max-w-[480px] mx-auto",
    headerTitle: "text-foreground text-[2rem] font-medium tracking-[-0.05em]",
    headerSubtitle: "text-muted-foreground text-base",
    formButtonPrimary:
      "h-12 rounded-xl bg-[var(--accent-ai)] text-white hover:bg-[var(--accent-ai)]/90 text-base font-medium",
    footerActionLink: "text-[var(--accent-ai)]",
    socialButtonsBlockButton:
      "h-12 rounded-xl border border-border bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-foreground",
    formFieldInput:
      "h-12 rounded-xl border border-border bg-[var(--bg-subtle)] text-foreground placeholder:text-muted-foreground text-base",
    formFieldLabel: "text-foreground text-sm font-medium",
    formFieldContainer: "gap-2",
    socialButtonsIconButton: "rounded-xl",
    footer: "mt-5 text-center",
    dividerRow: "my-5",
    dividerText: "text-muted-foreground text-sm",
    fieldErrorText: "text-red-400",
  },
} as const;
