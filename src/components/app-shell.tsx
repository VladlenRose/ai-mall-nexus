import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Inbox,
  LayoutGrid,
  Loader2,
  MessagesSquare,
  Package,
  Settings,
  Store,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { getProfile } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Главная", to: "/dashboard", icon: LayoutGrid },
  { label: "Каталог", to: "/catalog", icon: Store },
  { label: "Торговые заявки", to: "/requests", icon: Inbox },
  { label: "Мои товары", to: "/seller", icon: Package },
  { label: "Чат-переговоры", to: "/chat", icon: MessagesSquare },
  { label: "Документы", to: "/documents", icon: FileText },
  { label: "Настройки", to: "/profile", icon: Settings },
] as const;

function initials(name?: string | null) {
  if (!name) return "AI";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function AppShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { user, loading } = useRequireAuth();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-mist/60">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist/60">
      <header className="glass-bar sticky top-0 z-50 border-b border-border">
        <div className="flex h-14 items-center gap-3 px-4 md:px-6">
          <button
            type="button"
            aria-label="Меню"
            onClick={() => setOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-lg text-dim transition-colors hover:bg-foreground/5 lg:hidden"
          >
            <Menu className="size-4.5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-[9px] bg-brand text-[11px] font-bold text-brand-foreground ring-1 ring-inset ring-white/15">
              AI
            </span>
            <span className="hidden text-[15px] font-semibold tracking-tight sm:block">
              AI-Mall
            </span>
          </Link>

          <div className="ml-auto" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-border bg-background/70 py-1 pl-1 pr-3 transition-colors hover:bg-background"
              >
                <span className="grid size-7 place-items-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">
                  {initials(user.name || user.email)}
                </span>
                <span className="hidden max-w-32 truncate text-sm text-ink md:block">
                  {user.name || user.email}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="truncate text-sm font-medium text-ink">
                  {user.name || "Пользователь"}
                </div>
                <div className="truncate text-xs text-dim">
                  {profileQuery.data?.company || user.email}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Профиль и настройки</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/documents">Документы</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  void logout().then(() => navigate({ to: "/" }));
                }}
              >
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            "fixed inset-y-14 left-0 z-40 w-60 shrink-0 border-r border-border bg-background/85 p-3 backdrop-blur-xl transition-transform lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-brand text-brand-foreground"
                      : "text-dim hover:bg-foreground/5 hover:text-ink",
                  )}
                >
                  <item.icon className="size-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 md:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            {title}
          </h1>
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export { Inbox };
