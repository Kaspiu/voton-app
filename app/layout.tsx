import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import logo from "@/public/logo.svg";
import logoDark from "@/public/logo-dark.svg";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Voton",
    template: "%s - Voton",
  },
  description:
    "Private note-taking app with hierarchical organization and rich text editing. Your notes stay in your browser.",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: logo.src,
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: logoDark.src,
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-[#1F1F1F]`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="voton-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
