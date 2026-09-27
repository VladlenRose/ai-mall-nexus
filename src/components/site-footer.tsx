const COLUMNS = [
  {
    title: "Платформа",
    links: [
      { label: "Каталог", href: "#catalog" },
      { label: "Как это работает", href: "#how" },
      { label: "Документация", href: "#docs" },
    ],
  },
  {
    title: "Партнёрам",
    links: [
      { label: "Стать продавцом", href: "#seller" },
      { label: "Интеграции", href: "#partners" },
      { label: "API", href: "#docs" },
    ],
  },
  {
    title: "Контакты",
    links: [
      { label: "hello@ai-mall.ru", href: "mailto:hello@ai-mall.ru" },
      { label: "+7 (495) 000-00-00", href: "tel:+74950000000" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-brand py-14 text-brand-foreground">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-10 px-6 md:flex-row">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-[10px] bg-white/10 text-xs font-bold ring-1 ring-inset ring-white/20">
              AI
            </span>
            <span className="text-lg font-semibold tracking-tight">AI-Mall</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-brand-foreground/55">
            Умный B2B-маркетплейс на базе ИИ-агентов для сделок между компаниями.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-brand-foreground/40">
                {col.title}
              </p>
              <ul className="mt-3 space-y-2 text-brand-foreground/75">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="transition-colors hover:text-brand-foreground">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 px-6 pt-6 text-xs text-brand-foreground/45">
        © <span className="font-mono">2026</span> AI-Mall · Проект для хакатона Росэлторг
      </div>
    </footer>
  );
}
