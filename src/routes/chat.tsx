import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileSignature, Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  createDocument,
  createMessage,
  listMessages,
  listProducts,
  listThreads,
  updateThread,
  type NegotiationStage,
} from "@/lib/api";
import { negotiate } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

const TITLE = "Чат-переговоры с ИИ-агентом — AI-Mall";
const DESCRIPTION =
  "Переговоры с ИИ-агентами продавцов: предложения по цене и срокам, статусы сделки и автоматический договор.";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Chat,
});

const STAGES: NegotiationStage[] = ["Торг идёт", "Согласовано", "Документы готовы"];

function timeOf(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const runAgent = useServerFn(negotiate);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const threadsQuery = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: () => listThreads(user!.id),
    enabled: !!user,
  });
  const threads = threadsQuery.data ?? [];
  const active = threads.find((t) => t.$id === activeId) ?? threads[0] ?? null;

  useEffect(() => {
    if (!activeId && threads[0]) setActiveId(threads[0].$id);
  }, [activeId, threads]);

  const messagesQuery = useQuery({
    queryKey: ["messages", active?.$id],
    queryFn: () => listMessages(active!.$id),
    enabled: !!active,
  });
  const messages = messagesQuery.data ?? [];

  const productsQuery = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const product = productsQuery.data?.find((p) => p.$id === active?.productId) ?? null;

  const stageIndex = active ? STAGES.indexOf(active.stage) : 0;

  const send = useMutation({
    mutationFn: async (text: string) => {
      if (!user || !active) throw new Error("no-thread");
      await createMessage(user?.id, { threadId: active.$id, author: "me", text });
      await queryClient.invalidateQueries({ queryKey: ["messages", active.$id] });

      const history = [...messages.map((m) => ({ author: m.author, text: m.text ?? "" })), {
        author: "me" as const,
        text,
      }];

      const reply = await runAgent({
        data: {
          product: product?.title ?? active.preview ?? "товар",
          supplier: active.company ?? "поставщик",
          price: product?.price ?? 0,
          stage: active.stage,
          history,
        },
      });

      await createMessage(user?.id, {
        threadId: active.$id,
        author: "agent",
        text: reply.text,
        offerPrice: reply.offer?.price ?? "",
        offerTerm: reply.offer?.term ?? "",
        offerConditions: reply.offer?.conditions ?? "",
      });
      await updateThread(active.$id, {
        stage: reply.stage,
        preview: reply.text.slice(0, 120),
        lastAt: new Date().toISOString(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["messages"] });
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
    onError: () => toast.error("Агент недоступен, попробуйте ещё раз"),
  });

  const makeDoc = useMutation({
    mutationFn: async () => {
      if (!user || !active) throw new Error("no-thread");
      const lastOffer = [...messages].reverse().find((m) => m.offerPrice);
      const body = [
        `Договор поставки`,
        `Поставщик: ${active.company ?? "—"}`,
        `Товар: ${product?.title ?? active.preview ?? "—"}`,
        `Цена: ${lastOffer?.offerPrice || (product ? `${product.price} ₽` : "—")}`,
        `Сроки: ${lastOffer?.offerTerm || "по согласованию"}`,
        `Условия: ${lastOffer?.offerConditions || "по согласованию"}`,
        `Дата: ${new Date().toLocaleDateString("ru-RU")}`,
      ].join("\n");

      await createDocument(user?.id, {
        threadId: active.$id,
        title: `Договор · ${product?.title ?? active.company ?? "сделка"}`,
        counterparty: active.company ?? "",
        status: "Ожидает подписи",
        body,
      });
      await updateThread(active.$id, { stage: "Документы готовы" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Договор сформирован");
      void navigate({ to: "/documents" });
    },
    onError: () => toast.error("Не удалось сформировать договор"),
  });

  const submit = () => {
    const text = draft.trim();
    if (!text || send.isPending) return;
    setDraft("");
    send.mutate(text);
  };

  return (
    <AppShell title="Чат-переговоры">
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="glass-panel h-fit overflow-hidden rounded-2xl">
          {threadsQuery.isLoading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="size-5 animate-spin text-brand" />
            </div>
          ) : threads.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-dim">
              Переговоров пока нет. Запросите предложение в каталоге.
            </p>
          ) : (
            threads.map((t) => (
              <button
                key={t.$id}
                type="button"
                onClick={() => setActiveId(t.$id)}
                className={cn(
                  "flex w-full flex-col gap-1 border-b border-border px-4 py-3.5 text-left transition-colors last:border-0",
                  t.$id === active?.$id ? "bg-brand/6" : "hover:bg-foreground/4",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-ink">{t.company}</span>
                  <span className="shrink-0 font-mono text-[11px] text-dim">
                    {timeOf(t.lastAt ?? t.$createdAt)}
                  </span>
                </div>
                <span className="truncate text-xs text-dim">{t.preview}</span>
                <span className="mt-1 w-fit rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] text-dim">
                  {t.stage}
                </span>
              </button>
            ))
          )}
        </aside>

        <section className="glass-panel flex min-h-[70vh] flex-col overflow-hidden rounded-2xl">
          {!active ? (
            <div className="grid flex-1 place-items-center p-8 text-center text-sm text-dim">
              Выберите переговоры или начните новые из каталога.
            </div>
          ) : (
            <>
              <header className="border-b border-border px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-ink">{active.company}</div>
                    <div className="flex items-center gap-1.5 text-xs text-dim">
                      <Sparkles className="size-3.5 text-brand" />
                      ИИ-агент продавца
                    </div>
                  </div>
                  {stageIndex >= 1 && (
                    <Button
                      variant="hero"
                      className="h-10"
                      disabled={makeDoc.isPending}
                      onClick={() => makeDoc.mutate()}
                    >
                      <FileSignature className="size-4" />
                      Сформировать договор
                    </Button>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {STAGES.map((s, i) => (
                    <div key={s} className="flex-1">
                      <div
                        className={cn(
                          "h-1 rounded-full",
                          i <= stageIndex ? "bg-brand" : "bg-foreground/10",
                        )}
                      />
                      <div
                        className={cn("mt-1.5 text-[11px]", i <= stageIndex ? "text-ink" : "text-dim")}
                      >
                        {s}
                      </div>
                    </div>
                  ))}
                </div>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {messagesQuery.isLoading ? (
                  <div className="grid place-items-center py-10">
                    <Loader2 className="size-5 animate-spin text-brand" />
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.$id}
                      className={cn("flex", m.author === "me" ? "justify-end" : "justify-start")}
                    >
                      <div className="max-w-[80%] space-y-2">
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                            m.author === "me"
                              ? "rounded-br-md bg-brand text-brand-foreground"
                              : "rounded-bl-md bg-foreground/5 text-ink",
                          )}
                        >
                          {m.text}
                        </div>
                        {m.offerPrice ? (
                          <div className="rounded-2xl border border-border bg-background p-4">
                            <div className="text-[11px] uppercase tracking-wide text-dim">
                              Предложение
                            </div>
                            <div className="mt-1 font-mono text-base font-semibold text-ink">
                              {m.offerPrice}
                            </div>
                            <div className="mt-2 space-y-1 text-xs text-dim">
                              <div>{m.offerTerm}</div>
                              <div>{m.offerConditions}</div>
                            </div>
                          </div>
                        ) : null}
                        <div
                          className={cn(
                            "font-mono text-[11px] text-dim",
                            m.author === "me" ? "text-right" : "",
                          )}
                        >
                          {timeOf(m.createdAt ?? m.$createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {send.isPending && (
                  <div className="flex items-center gap-2 text-xs text-dim">
                    <Loader2 className="size-3.5 animate-spin" /> Агент печатает…
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-border p-4">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Напишите ИИ-агенту продавца…"
                  className="h-11 rounded-full"
                />
                <Button
                  variant="hero"
                  size="icon"
                  className="size-11 shrink-0"
                  aria-label="Отправить"
                  onClick={submit}
                  disabled={send.isPending}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
