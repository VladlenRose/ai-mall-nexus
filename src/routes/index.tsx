import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSignature, MessagesSquare, Search } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import mugs from "@/assets/product-mugs.jpg";
import linen from "@/assets/product-linen.jpg";
import tools from "@/assets/product-tools.jpg";

const TITLE = "AI-Mall — умный B2B маркетплейс с ИИ-агентами";
const DESCRIPTION =
  "ИИ-агенты помогают продавцам и покупателям находить друг друга, вести переговоры и автоматизировать документы.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

const BENEFITS = [
  {
    icon: Search,
    title: "ИИ-поиск",
    text: "Агент понимает коммерческий запрос и подбирает поставщиков по спецификации, а не по ключевым словам.",
  },
  {
    icon: MessagesSquare,
    title: "Умные переговоры",
    text: "ИИ ведёт торг по вашей стратегии, удерживает выгоду и фиксирует согласованные условия.",
  },
  {
    icon: FileSignature,
    title: "Автоматические документы",
    text: "Договор, счёт и спецификация собираются сами — без ручного переноса цифр.",
  },
];

const PRODUCTS = [
  {
    image: mugs,
    alt: "Керамические кружки на стальной поверхности",
    label: "Оригинал" as const,
    meta: "Посуда · 240 шт",
    title: "Керамические кружки «Монолит»",
    price: "от 340 ₽",
    rating: "4.9",
    delay: "120ms",
  },
  {
    image: linen,
    alt: "Рулоны льняной ткани на стеллаже",
    label: "Премиум" as const,
    meta: "Текстиль · 1 200 м",
    title: "Льняная ткань «Атлас»",
    price: "от 890 ₽/м",
    rating: "5.0",
    delay: "200ms",
  },
  {
    image: tools,
    alt: "Набор алюминиевых инструментов на верстаке",
    label: "Оригинал" as const,
    meta: "Инструменты · 64 шт",
    title: "Алюминиевый набор «Квант»",
    price: "от 12 400 ₽",
    rating: "4.8",
    delay: "280ms",
  },
];

const STEPS = [
  { n: 1, title: "Заявка", text: "Опишите потребность — агент разберёт параметры." },
  { n: 2, title: "Поиск", text: "Подбор проверенных поставщиков из каталога." },
  { n: 3, title: "Переговоры", text: "Агенты согласуют цену, сроки и условия." },
  { n: 4, title: "Документы", text: "Договор и спецификация формируются автоматически." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-100/40 blur-3xl" />
            <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-20 md:pb-24 md:pt-28">



            <h1 className="text-balance text-5xl font-extrabold leading-[1.02] tracking-[-0.03em] md:text-7xl">
              <span className="animate-word-up inline-block [animation-delay:60ms]">AI-Mall —</span>
              <br />
              <span className="animate-word-up inline-block [animation-delay:160ms]">Умный</span>{" "}
              <span className="animate-word-up inline-block [animation-delay:260ms]">B2B</span>{" "}
              <span className="animate-word-up inline-block text-brand [animation-delay:360ms]">
                маркетплейс
              </span>
            </h1>

            <p className="animate-rise mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-dim [animation-delay:440ms]">
              {DESCRIPTION}
            </p>

            <div className="animate-rise mt-9 flex flex-wrap items-center gap-4 [animation-delay:520ms]">
              <Button variant="hero" size="xl" asChild>
                <Link to="/seller">
                  <span className="relative z-10">Стать продавцом</span>
                  <span aria-hidden className="sheen" />
                </Link>
              </Button>
              <Button variant="heroGhost" size="xl" asChild>
                <Link to="/catalog">
                  <span className="relative z-10">Найти товары</span>
                  <span aria-hidden className="sheen" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="partners" className="border-t border-border py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-dim">Возможности</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Три агента внутри платформы</h2>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-2xl bg-card p-6 ring-1 ring-border transition duration-300 hover:ring-brand/25"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-mist text-brand">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-dim">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Catalog */}
        <section id="catalog" className="border-t border-border bg-mist/60 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-dim">Каталог</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Предложения, подобранные агентом
                </h2>
              </div>
              <Link
                to="/catalog"
                className="hidden text-sm text-brand transition-colors hover:underline sm:block"
              >
                Смотреть все
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PRODUCTS.map((p) => (
                <article
                  key={p.title}
                  className="animate-rise overflow-hidden rounded-2xl bg-card ring-1 ring-border transition duration-300 hover:ring-brand/25"
                  style={{ animationDelay: p.delay }}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.alt}
                      loading="lazy"
                      width={1024}
                      height={768}
                      className="aspect-[4/3] w-full object-cover"
                    />
                    {p.label === "Оригинал" ? (
                      <span className="absolute left-3 top-3 rounded-full bg-exclusive px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-exclusive-foreground">
                        Оригинал
                      </span>
                    ) : (
                      <span className="absolute left-3 top-3 rounded-full border border-gold/60 bg-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold">
                        Премиум
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-dim">
                      {p.meta}
                    </p>
                    <h3 className="mt-1.5 text-base font-semibold tracking-tight">{p.title}</h3>
                    <div className="mt-3 flex items-end justify-between">
                      <span className="text-lg font-semibold">{p.price}</span>
                      <span className="font-mono text-xs text-dim">{p.rating}</span>
                    </div>
                    <Button variant="pill" className="mt-4 w-full">
                      Запросить предложение
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
              <div className="animate-rise">
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-dim">
                  Как это работает
                </p>
                <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">
                  Четыре шага до подписанного договора
                </h2>
                <p className="mt-4 max-w-md text-pretty text-dim">
                  Агент ведёт сделку от первого запроса до пакета документов. Вы наблюдаете за
                  процессом в реальном времени.
                </p>

                <ol className="mt-9 space-y-6">
                  {STEPS.map((s) => (
                    <li key={s.n} className="flex gap-4">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
                        {s.n}
                      </span>
                      <div>
                        <p className="font-semibold">{s.title}</p>
                        <p className="text-sm text-dim">{s.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div
                id="docs"
                className="glass-panel animate-rise overflow-hidden rounded-3xl p-5 [animation-delay:140ms]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Переговор · «Атлас»</p>
                    <p className="font-mono text-[11px] text-dim">Агент продавца · онлайн</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-medium text-brand">
                    <span className="animate-pulse-dot size-1.5 rounded-full bg-gold" />
                    Торг идёт
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-start">
                    <p className="max-w-[80%] rounded-2xl rounded-tl-sm bg-mist px-3.5 py-2.5 text-sm">
                      Здравствуйте! По льну «Атлас» от 1 км — 890 ₽/м. Рассчитываем сроки 14 дней.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <p className="max-w-[75%] rounded-2xl rounded-tr-sm bg-brand px-3.5 py-2.5 text-sm text-brand-foreground">
                      Нужно 1 200 м. Есть ли скидка при полном объёме?
                    </p>
                  </div>
                  <div className="flex justify-start">
                    <p className="max-w-[80%] rounded-2xl rounded-tl-sm bg-mist px-3.5 py-2.5 text-sm">
                      Фиксируем 840 ₽/м при 1 200 м. Сформировать договор?
                    </p>
                  </div>
                </div>

                <Button variant="hero" className="mt-4 h-11 w-full">
                  <span className="relative z-10">Сформировать договор</span>
                  <span aria-hidden className="sheen" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
