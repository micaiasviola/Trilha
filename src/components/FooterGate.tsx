"use client";

import { usePathname } from "next/navigation";

// Hides the footer on the home page (the full-height depth showcase) so it
// stays header + main only. Footer is passed as children, so it remains a
// Server Component — this gate is the only client-side piece.
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <>{children}</>;
}
