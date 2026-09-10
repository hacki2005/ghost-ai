import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description: "Collaborative system design workspace",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""}
      appearance={{
        theme: dark,
        variables: {
          colorPrimary: "var(--accent-primary)",
          colorPrimaryForeground: "var(--bg-base)",
          colorNeutral: "var(--text-muted)",
          colorForeground: "var(--text-primary)",
          colorMutedForeground: "var(--text-muted)",
          colorBackground: "var(--bg-surface)",
          colorInput: "var(--bg-base)",
          colorInputForeground: "var(--text-primary)",
          colorBorder: "var(--border-default)",
          colorSuccess: "var(--state-success)",
          colorDanger: "var(--state-error)",
          borderRadius: "0.75rem",
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
