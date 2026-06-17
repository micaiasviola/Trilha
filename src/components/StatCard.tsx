export function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg-card p-4 text-center">
      <div className="bg-gradient-to-br from-accent to-accent-cyan bg-clip-text text-3xl font-bold text-transparent">
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wide text-ink-faint">
        {label}
      </div>
    </div>
  );
}
