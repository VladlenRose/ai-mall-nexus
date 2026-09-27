import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Каталог", href: "#catalog" },
  { label: "Как это работает", href: "#how" },
  { label: "Партнёрам", href: "#partners" },
  { label: "Документация", href: "#docs" },
];

export function SiteHeader() {
  return (
    <header className="glass-bar sticky top-0 z-50 border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-[9px] bg-brand text-[11px] font-bold text-brand-foreground ring-1 ring-inset ring-white/15">
            AI
          </span>
          <span className="text-[15px] font-semibold tracking-tight">AI-Mall</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-dim md:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="hidden rounded-full px-3.5 py-2 text-sm text-brand transition-colors hover:bg-brand/5 sm:block"
          >
            Войти
          </Link>
          <Button variant="pill" size="default" asChild>
            <Link to="/seller">Стать продавцом</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
