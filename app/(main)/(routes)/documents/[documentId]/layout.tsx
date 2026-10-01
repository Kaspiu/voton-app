import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Document - Voton" },
};

export default function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
