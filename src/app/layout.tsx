import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Thrive Aesthetics", template: "%s — Thrive Aesthetics" },
  description: "Clinic management system for Thrive Aesthetics Kenya",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  "border border-border bg-card text-card-foreground shadow-lg",
                title: "font-medium text-sm",
                description: "text-muted-foreground text-xs",
                success: "border-l-4 border-l-green-500",
                error: "border-l-4 border-l-destructive",
                warning: "border-l-4 border-l-yellow-500",
                info: "border-l-4 border-l-blue-500",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
