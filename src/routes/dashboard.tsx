import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, MessagesSquare, Package, Store } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { listDocuments, listMyProducts, listProducts, listThreads } from "@/lib/api";

const TITLE = "Дашборд AI-Mall — заявки, переговоры и документы";
const DESCRIPTION =
  "Личный кабинет AI-Mall: статистика заявок, сообщения ИИ-агентов и лента активности по сделкам.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const threads = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: () => listThreads(user!.id),
    enabled: !!user,
  });
  const docs = useQuery({
    queryKey: ["documents", user?.id],
    queryFn: () => listDocuments(user!.id),
    enabled: !!user,
  });
  const mine = useQuery({
    queryKey: ["my-products", user?.id],
    queryFn: () => listMyProducts(user!.id),
    enabled: !!user,
  });
  const all = useQuery({ queryKey: ["products"], queryFn: listProducts });

  const stats = [
    {
      label: "Активные переговоры",
      value: (threads.data ?? []).filter((t) => t.stage !== "Документы готовы").length,
      icon: MessagesSquare,
      to: "/chat" as const,
    },
    {
      label: "Документы",
      value: (docs.data ?? []).length,
      icon: FileText,
      to: "/documents" as const,
    },
    { label: "Мои товары", value: (mine.data ?? []).length, icon: Package, to: "/seller" as const },
    { label: "Товаров в каталоге", value: (all.data ?? []).length, icon: Store, to: "/catalog" as const },
  ];

  const activity = [...(threads.data ?? [])]
    .sort((a, b) => (b.lastAt ?? b.$createdAt).localeCompare(a.lastAt ?? a.$createdAt))
    .slice(0, 6);

  return (
    <AppShell title={`Добрый день, ${user?.name?.split(" ")[0] ?? ""}`.trim()}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="glass-panel block rounded-2xl p-5 transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-dim">{s.label}</span>
              <s.icon className="size-4 text-brand" />
            </div>
            <div className="mt-3 font-mono text-2xl font-semibold text-ink">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-ink">Последние активности</h2>
          {activity.length === 0 ? (
            <p className="mt-5 text-sm text-dim">
              Активности пока нет — начните с поиска товаров в каталоге.
            </p>
          ) : (
            <ol className="mt-5 space-y-5">
              {activity.map((t) => (
                <li key={t.$id} className="flex gap-4">
                  <div className="w-16 shrink-0 pt-0.5 font-mono text-xs text-dim">
                    {new Date(t.lastAt ?? t.$createdAt).toLocaleDateString("ru-RU")}
                  </div>
                  <div className="relative border-l border-border pl-5">
                    <span className="absolute -left-[4.5px] top-1.5 size-2 rounded-full bg-brand" />
                    <div className="text-sm font-medium text-ink">
                      {t.company} · {t.stage}
                    </div>
                    <div className="mt-0.5 text-sm text-dim">{t.preview}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <h2 className="text-base font-semibold text-ink">Быстрые действия</h2>
          <div className="mt-5 flex flex-col gap-3">
            <Button variant="hero" className="h-11 w-full" asChild>
              <Link to="/requests">Создать ИИ-заявку</Link>
            </Button>
            <Button variant="outline" className="h-11 w-full rounded-full" asChild>
              <Link to="/catalog">Найти товары</Link>
            </Button>
            <Button variant="outline" className="h-11 w-full rounded-full" asChild>
              <Link to="/seller">Добавить товар</Link>
            </Button>
            <Button variant="outline" className="h-11 w-full rounded-full" asChild>
              <Link to="/chat">Открыть переговоры</Link>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
