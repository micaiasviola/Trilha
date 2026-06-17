import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-32 text-center">
      <p className="font-mono text-5xl font-bold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink">Página não encontrada</h1>
      <p className="mt-2 text-ink-muted">
        Esse trecho da trilha ainda não existe.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg border border-line px-5 py-2.5 text-ink transition-colors hover:border-accent/40"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
