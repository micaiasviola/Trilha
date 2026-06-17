export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-ink-faint sm:flex-row">
        <span>
          Trilhado Desenvolvimento — diário técnico de{" "}
          <span className="text-ink-muted">Micaías Viola</span>.
        </span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/micaiasviola"
            className="transition-colors hover:text-ink"
          >
            GitHub
          </a>
          <a
            href="https://micaiasviola.netlify.app"
            className="transition-colors hover:text-ink"
          >
            Portfólio
          </a>
        </div>
      </div>
    </footer>
  );
}
