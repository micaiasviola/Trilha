import Link from "next/link";

export function TechBadge({ name, href }: { name: string; href?: string }) {
  const className =
    "inline-flex items-center rounded-full border border-line bg-bg-soft px-2.5 py-0.5 text-xs font-medium text-ink-muted transition-colors hover:border-accent/50 hover:text-ink";
  if (href) {
    return (
      <Link href={href} className={className}>
        {name}
      </Link>
    );
  }
  return <span className={className}>{name}</span>;
}

const STATUS_STYLE: Record<string, string> = {
  "in-progress": "border-accent-cyan/40 text-accent-cyan",
  shipped: "border-accent/40 text-accent",
  paused: "border-ink-faint/40 text-ink-faint",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLE[status] ?? STATUS_STYLE.paused
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
