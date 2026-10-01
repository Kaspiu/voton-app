import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Write and organize notes locally in your browser with Voton.",
  robots: { index: false, follow: false },
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
