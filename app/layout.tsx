import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TeamsApolloProvider } from "./_components/TeamsApolloProvider";
import { ErrorBoundary } from "./_components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RoosBoard",
  description: "your Online dashboard",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn(inter.className, "bg-neutral-900 text-white")}>
        <TeamsApolloProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
          <Toaster />
        </TeamsApolloProvider>
      </body>
    </html>
  );
}
