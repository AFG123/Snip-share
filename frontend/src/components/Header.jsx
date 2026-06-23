import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary))]" />
          <span className="font-mono text-[17px] font-bold tracking-tight text-foreground">
            SnipShare
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href="https://github.com/AFG123/Snip-share"
            target="_blank"
            rel="noreferrer"
            className="hidden font-mono text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:block px-3 py-2"
          >
            github ↗
          </a>
          <Button asChild size="sm" variant="secondary" className="font-mono">
            <Link to="/">
              <Plus className="h-3.5 w-3.5" />
              new drop
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
