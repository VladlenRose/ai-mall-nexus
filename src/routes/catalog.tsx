import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/use-auth";
import { createMessage, createThread, imageUrl, listProducts, type Product } from "@/lib/api";

import { CATEGORIES, fallbackImage } from "@/lib/catalog-meta";
import { cn } from "@/lib/utils";

const TITLE = "Каталог AI-Mall — товары от проверенных поставщиков";
const DESCRIPTION =
  "Умный поиск и фильтры по категориям, цене и рейтингу. Запросите предложение — ИИ-агент продавца ответит сразу.";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [maxPrice, setMaxPrice] = useState(200000);
  const [minRating, setMinRating] = useState(0);

  const productsQuery = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const products = productsQuery.data ?? [];

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = Array.from(
      new Set(products.flatMap((p) => [p.title, p.supplier ?? "", p.category ?? ""])),
    ).filter(Boolean);
    return (q ? pool.filter((s) => s.toLowerCase().includes(q)) : pool).slice(0, 5);
  }, [products, query]);

  const items = products.filter(
    (p) =>
      p.status !== "Завершён" &&
      (category === CATEGORIES[0] || p.category === category) &&
      p.price <= maxPrice &&
      (p.rating ?? 0) >= minRating &&
      (query.trim() === "" ||
        p.title.toLowerCase().includes(query.trim().toLowerCase()) ||
        (p.supplier ?? "").toLowerCase().includes(query.trim().toLowerCase())),
  );

  const requestOffer = useMutation({
    mutationFn: async (product: Product) => {
      if (!user) throw new Error("auth");
      const thread = await createThread(user?.id, {
        sellerId: product.ownerId,
        productId: product.$id,
        company: product.supplier || "Поставщик",
        stage: "Торг идёт",
        preview: `Запрос по «${product.title}»`,
        lastAt: new Date().toISOString(),
      });
      await createMessage(user?.id, {
        threadId: thread.$id,
        author: "me",
        text: `Здравствуйте! Интересует «${product.title}». Расскажите об условиях поставки и скидке при объёме.`,
      });
      return thread;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Переговоры начаты");
      void navigate({ to: "/chat" });
    },
    onError: (error: Error) => {
      if (error.message === "auth") {
        toast.error("Войдите, чтобы запросить предложение");
        void navigate({ to: "/auth" });
        return;
      }
      toast.error("Не удалось начать переговоры");
    },
  });

  const maxAvailable = Math.max(200000, ...products.map((p) => p.price ?? 0));

  return (
    <AppShell title="Каталог товаров">
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="glass-panel h-fit rounded-2xl p-5">
          <div className="text-sm font-semibold text-ink">Фильтры</div>

          <div className="mt-5 space-y-2">
            <div className="text-xs uppercase tracking-wide text-dim">Категория</div>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  category === c ? "bg-brand text-brand-foreground" : "text-dim hover:bg-foreground/5",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-dim">
              <span>Цена до</span>
              <span className="font-mono text-ink">{maxPrice.toLocaleString("ru-RU")} ₽</span>
            </div>
            <Slider
              className="mt-3"
              value={[maxPrice]}
              min={100}
              max={maxAvailable}
              step={100}
              onValueChange={(v) => setMaxPrice(v[0] ?? maxAvailable)}
            />
          </div>

          <div className="mt-6">
            <div className="text-xs uppercase tracking-wide text-dim">Рейтинг</div>
            <div className="mt-3 flex gap-2">
              {[0, 4, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMinRating(r)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    minRating === r
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border text-dim hover:text-ink",
                  )}
                >
                  {r === 0 ? "Все" : `${r}+`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-dim" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 150)}
              placeholder="Например: кружки корпоративные"
              className="h-12 rounded-full border-border bg-background pl-11"
            />
            {focused && suggestions.length > 0 && (
              <div className="glass-panel absolute z-20 mt-2 w-full overflow-hidden rounded-2xl p-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => setQuery(s)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-dim transition-colors hover:bg-foreground/5 hover:text-ink"
                  >
                    <Search className="size-3.5" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-dim">
            {productsQuery.isLoading ? "Загружаем товары…" : `Найдено позиций: ${items.length}`}
          </div>

          {!productsQuery.isLoading && items.length === 0 && (
            <div className="glass-panel mt-4 rounded-2xl p-8 text-center text-sm text-dim">
              Товары не найдены. Опубликуйте первый товар в кабинете продавца.
            </div>
          )}

          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((p) => (
              <article key={p.$id} className="glass-panel group flex flex-col overflow-hidden rounded-2xl">
                <div className="relative aspect-4/3 overflow-hidden bg-mist">
                  <img
                    src={imageUrl(p.imageId) ?? fallbackImage(p.$id)}
                    alt={p.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {p.status === "На модерации" && (
                    <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[11px] font-medium text-exclusive-foreground">
                      На модерации
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-xs text-dim">{p.supplier}</div>
                  <h3 className="mt-1.5 text-sm font-medium leading-snug text-ink">{p.title}</h3>
                  {p.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-dim">{p.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Star className="size-3.5 fill-gold text-gold" />
                    <span className="font-mono text-xs text-dim">{p.rating || "—"}</span>
                  </div>
                  <div className="mt-auto pt-4">
                    <div className="font-mono text-lg font-semibold text-ink">
                      {(p.price ?? 0).toLocaleString("ru-RU")} ₽
                    </div>
                    <div className="text-xs text-dim">{p.unit}</div>
                    <Button
                      variant="hero"
                      className="mt-4 h-11 w-full"
                      disabled={requestOffer.isPending}
                      onClick={() => requestOffer.mutate(p)}
                    >
                      {requestOffer.isPending && <Loader2 className="size-4 animate-spin" />}
                      Запросить предложение
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
