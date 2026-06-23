export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>SnipShare · clean / fast / ad-free</span>
        <span>
          built by Aryan ·{" "}
          <a
            href="https://devbyaryan.me"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            devbyaryan.me
          </a>
        </span>
      </div>
    </footer>
  );
}
