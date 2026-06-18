"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [{ href: "/", label: "Home" }];

export function Header() {
  const pathname = usePathname();

  return (
    <header
      data-site-header
      className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-cyan font-mono text-sm font-bold text-bg">
            T
          </span>
          <span className="font-semibold tracking-tight text-ink">
            Trilhado<span className="text-ink-faint">Dev</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-bg-soft font-medium text-ink"
                    : "text-ink-muted hover:bg-bg-soft hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
