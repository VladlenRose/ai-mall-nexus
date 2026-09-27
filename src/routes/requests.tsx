import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search, Sparkles, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { uploadProductImage } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { analyzeRequestText } from "@/lib/requests.functions";
import { cn } from "@/lib/utils";

const TITLE = "Торговые заявки AI-Mall — купить или продать с ИИ";
const DESCRIPTION =
  "Создайте заявку на покупку или продажу: ИИ разберёт текст, а система подберёт встречные предложения.";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestsPage,
});

type Kind = "sell" | "buy";
type ParamKey = "qty" | "price" | "term" | "payment" | "basis" | "warranty" | "regularity";
type Param = {
  priority: number;
  ignore: boolean;
  min: string;
  max: string;
  unit: string;
  value: string;
};
type Params = Record<ParamKey, Param>;

const LABELS: Record<ParamKey, string> = {
  qty: "Количество",
  price: "Цена",
  term: "Сроки поставки",
  payment: "Условия оплаты",
  basis: "Базис поставки",
  warranty: "Гарантия и приемка",
  regularity: "Регулярность",
};
const OPTIONS: Partial<Record<ParamKey, string[]>> = {
  payment: ["100% предоплата", "50/50", "постоплата", "отсрочка"],
  basis: ["самовывоз", "доставка силами поставщика", "ТК"],
  regularity: ["разовая", "еженедельно", "ежемесячно"],
};
const RANGE: Partial<Record<ParamKey, string>> = { qty: "", price: "₽", term: "дней" };
const KEYS = Object.keys(LABELS) as ParamKey[];

const emptyParam = (): Param => ({ priority: 50, ignore: false, min: "", max: "", unit: "", value: "" });
const emptyParams = (): Params =>
  Object.fromEntries(KEYS.map((k) => [k, emptyParam()])) as Params;

type Stored = { id: string; owner_id: string; kind: Kind; title: string; params: Params; extra: string | null; created_at: string };
type Match = { req: Stored; score: number; zone: "green" | "yellow" | "red" };

const n = (s: string) => (s.trim() === "" ? null : Number(s));

function overlapScore(a: Param, b: Param, key: ParamKey): number | null {
  if (a.ignore || b.ignore) return null;
  if (RANGE[key] !== undefined) {
    const [a1, a2, b1, b2] = [n(a.min), n(a.max), n(b.min), n(b.max)];
    if ([a1, a2, b1, b2].some((v) => v === null || Number.isNaN(v))) return null;
    const lo = Math.max(a1!, b1!);
    const hi = Math.min(a2!, b2!);
    if (hi >= lo) return 1;
    const span = Math.max(a2! - a1!, b2! - b1!, 1);
    return Math.max(0, 1 - (lo - hi) / span);
  }
  if (!a.value.trim() || !b.value.trim()) return null;
  return a.value.trim().toLowerCase() === b.value.trim().toLowerCase() ? 1 : 0;
}

function matchScore(mine: Params, other: Params) {
  let wsum = 0;
  let total = 0;
  for (const k of KEYS) {
    const s = overlapScore(mine[k], other[k], k);
    if (s === null) continue;
    const w = Math.max(mine[k].priority, 1);
    wsum += w;
    total += w * s;
  }
  return wsum === 0 ? 0.5 : total / wsum;
}

function RequestsPage() {
  const { user } = useAuth();
  const analyze = useServerFn(analyzeRequestText);
  const [kind, setKind] = useState<Kind>("buy");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [params, setParams] = useState<Params>(emptyParams);
  const [extra, setExtra] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () => [...KEYS].sort((a, b) => params[b].priority - params[a].priority),
    [params],
  );

  const setP = (k: ParamKey, patch: Partial<Param>) =>
    setParams((p) => ({ ...p, [k]: { ...p[k], ...patch } }));

  async function runAnalyze() {
    if (!text.trim()) { toast.error("Введите текст заявки"); return; }
    setAnalyzing(true);
    try {
      const r = await analyze({ data: { text } });
      const s = (v: number | null) => (v === null ? "" : String(Math.round(v * 100) / 100));
      setTitle(r.title ?? "");
      setParams((p) => ({
        ...p,
        qty: { ...p.qty, min: s(r.qtyMin), max: s(r.qtyMax), unit: r.qtyUnit ?? "" },
        price: { ...p.price, min: s(r.priceMin), max: s(r.priceMax) },
        term: { ...p.term, min: s(r.termMin), max: s(r.termMax) },
        payment: { ...p.payment, value: r.payment ?? "" },
        basis: { ...p.basis, value: r.basis ?? "" },
        warranty: { ...p.warranty, value: r.warranty ?? "" },
        regularity: { ...p.regularity, value: r.regularity ?? "" },
      }));
      toast.success("Поля заполнены по тексту");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось проанализировать");
    } finally {
      setAnalyzing(false);
    }
  }

  async function search() {
    if (!user) return;
    if (!title.trim()) { toast.error("Укажите название товара или услуги"); return; }
    setSearching(true);
    try {
      let attachment: string | null = null;
      if (file) attachment = await uploadProductImage(file);
      const { error } = await supabase.from("trade_requests").insert({
        owner_id: user.id,
        kind,
        title: title.trim(),
        params: params as never,
        extra: extra || null,
        attachment_url: attachment,
      });
      if (error) throw error;

      const words = title.trim().split(/\s+/).filter((w) => w.length > 2).slice(0, 3);
      let q = supabase
        .from("trade_requests")
        .select("id, owner_id, kind, title, params, extra, created_at")
        .eq("kind", kind === "buy" ? "sell" : "buy")
        .neq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (words.length) q = q.or(words.map((w) => `title.ilike.%${w.replace(/[,%()]/g, "")}%`).join(","));
      const { data, error: e2 } = await q;
      if (e2) throw e2;
      const res = ((data ?? []) as unknown as Stored[])
        .map((req) => {
          const score = matchScore(params, { ...emptyParams(), ...req.params });
          const zone: Match["zone"] = score >= 0.75 ? "green" : score >= 0.4 ? "yellow" : "red";
          return { req, score, zone };
        })
        .sort((a, b) => b.score - a.score);
      setMatches(res);
      toast.success("Заявка сохранена");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSearching(false);
    }
  }

  return (
    <AppShell title="Торговые заявки">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="inline-flex rounded-full border border-border bg-background p-1">
          {(["sell", "buy"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "rounded-full px-6 py-2 text-sm font-medium transition-colors",
                kind === k ? "bg-brand text-brand-foreground" : "text-dim hover:text-ink",
              )}
            >
              {k === "sell" ? "Продать" : "Купить"}
            </button>
          ))}
        </div>

        <section className="glass-panel space-y-3 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-ink">Текст заявки</h2>
          <Textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Например: Купим 500 кружек с логотипом по 250 ₽, поставка за 14 дней, оплата 50/50, доставка ТК"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setText("")}>Очистить текст</Button>
            <Button onClick={runAnalyze} disabled={analyzing}>
              {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Анализировать текст
            </Button>
          </div>
        </section>

        <section className="glass-panel space-y-4 rounded-2xl p-6">
          <div>
            <label className="text-sm font-medium text-ink">Название товара или услуги</label>
            <Input className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-3">
            {sorted.map((k) => {
              const p = params[k];
              return (
                <div key={k} className="grid gap-4 rounded-xl border border-border bg-background/60 p-4 md:grid-cols-[180px_1fr]">
                  <div>
                    <div className="flex items-center justify-between text-xs text-dim">
                      <span>Приоритет</span>
                      <span className="font-mono text-ink">{p.priority}%</span>
                    </div>
                    <Slider
                      className="mt-3"
                      min={0}
                      max={100}
                      step={5}
                      value={[p.priority]}
                      onValueChange={([v]) => setP(k, { priority: v ?? 0 })}
                    />
                  </div>
                  <div className={cn("space-y-2", p.ignore && "opacity-50")}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">{LABELS[k]}</span>
                      <label className="flex items-center gap-2 text-xs text-dim">
                        <Checkbox checked={p.ignore} onCheckedChange={(v) => setP(k, { ignore: v === true })} />
                        Не важно
                      </label>
                    </div>
                    {RANGE[k] !== undefined ? (
                      <div className="flex items-center gap-2">
                        <Input disabled={p.ignore} type="number" placeholder="Мин" value={p.min} onChange={(e) => setP(k, { min: e.target.value })} />
                        <span className="text-dim">—</span>
                        <Input disabled={p.ignore} type="number" placeholder="Макс" value={p.max} onChange={(e) => setP(k, { max: e.target.value })} />
                        {k === "qty" ? (
                          <Input disabled={p.ignore} className="w-28" placeholder="ед. изм." value={p.unit} onChange={(e) => setP(k, { unit: e.target.value })} />
                        ) : (
                          <span className="w-12 text-sm text-dim">{RANGE[k]}</span>
                        )}
                      </div>
                    ) : OPTIONS[k] ? (
                      <div className="flex flex-wrap gap-2">
                        {OPTIONS[k]!.map((o) => (
                          <button
                            key={o}
                            type="button"
                            disabled={p.ignore}
                            onClick={() => setP(k, { value: p.value === o ? "" : o })}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs transition-colors",
                              p.value === o ? "border-brand bg-brand text-brand-foreground" : "border-border text-dim hover:text-ink",
                            )}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Input disabled={p.ignore} value={p.value} onChange={(e) => setP(k, { value: e.target.value })} placeholder="Условия гарантии и приемки" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-ink">Дополнительная информация</label>
              <Button variant="ghost" size="sm" onClick={() => setExtra("")}>
                <X className="size-4" /> Очистить
              </Button>
            </div>
            <Textarea className="mt-2" rows={3} value={extra} onChange={(e) => setExtra(e.target.value)} />
            <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <div className="mt-2 flex items-center gap-3">
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" /> Загрузить фото / спецификацию
              </Button>
              {file && <span className="truncate text-xs text-dim">{file.name}</span>}
            </div>
          </div>

          <Button variant="hero" className="h-12 w-full" onClick={search} disabled={searching}>
            {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Искать предложения
          </Button>
        </section>

        {matches && (
          <section className="glass-panel rounded-2xl p-6">
            <h2 className="text-base font-semibold text-ink">Встречные предложения</h2>
            {matches.length === 0 ? (
              <p className="mt-4 text-sm text-dim">
                Пока нет встречных предложений по данному товару. Ваша заявка сохранена и ожидает контрагентов.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {(["green", "yellow", "red"] as const).map((z) => (
                  <div key={z}>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
                      <span className={cn("size-2.5 rounded-full", z === "green" ? "bg-emerald-500" : z === "yellow" ? "bg-amber-400" : "bg-destructive")} />
                      {z === "green" ? "Подходят" : z === "yellow" ? "Частично" : "Слабо"}
                    </div>
                    <div className="space-y-2">
                      {matches.filter((m) => m.zone === z).map((m) => (
                        <div key={m.req.id} className="rounded-xl border border-border bg-background/60 p-3">
                          <div className="text-sm font-medium text-ink">{m.req.title}</div>
                          <div className="mt-1 font-mono text-xs text-dim">Совпадение {Math.round(m.score * 100)}%</div>
                          {m.req.extra && <div className="mt-1 line-clamp-2 text-xs text-dim">{m.req.extra}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
