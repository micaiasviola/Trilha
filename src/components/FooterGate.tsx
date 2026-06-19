"use client";

import { usePathname } from "next/navigation";

// Hides the footer on the home page (the full-height depth showcase) and on the
// project stage (/projetos/[slug]) so those stay header + main only. Footer is
// passed as children, so it remains a Server Component — this gate is the only
// client-side piece.
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/projetos")) return null;
  return <>{children}</>;
}
