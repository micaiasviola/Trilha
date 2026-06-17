import Link from "next/link";

const NAV = [
  { href: "/linha-do-tempo", label: "Linha do tempo" },
  { href: "/projetos", label: "Projetos" },
];

export function Header() {
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
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-bg-soft hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
