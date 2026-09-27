import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { deleteDocument, listDocuments, type DocStatus, type DocumentRow } from "@/lib/api";
import { cn } from "@/lib/utils";

const TITLE = "Документы AI-Mall — договоры и спецификации";
const DESCRIPTION =
  "Все документы, сгенерированные ИИ-агентами: договоры, спецификации и коммерческие предложения.";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Documents,
});

const STATUS_STYLE: Record<DocStatus, string> = {
  Подписан: "bg-brand/10 text-brand",
  "Ожидает подписи": "bg-gold/15 text-gold",
  Черновик: "bg-foreground/5 text-dim",
};

function download(doc: DocumentRow) {
  const blob = new Blob([doc.body ?? doc.title], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.title}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function Documents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const docsQuery = useQuery({
    queryKey: ["documents", user?.id],
    queryFn: () => listDocuments(user!.id),
    enabled: !!user,
  });
  const docs = docsQuery.data ?? [];

  const remove = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Документ удалён");
    },
    onError: () => toast.error("Не удалось удалить документ"),
  });

  return (
    <AppShell title="Документы">
      <section className="glass-panel overflow-hidden rounded-2xl">
        {docsQuery.isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-5 animate-spin text-brand" />
          </div>
        ) : docs.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-dim">
            Документов пока нет. Они появятся после согласования сделки в переговорах.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {docs.map((d) => (
              <li key={d.$id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground/5 text-dim">
                  <FileText className="size-4.5" />
                </span>
                <div className="min-w-48 flex-1">
                  <div className="text-sm font-medium text-ink">{d.title}</div>
                  <div className="text-xs text-dim">
                    {d.counterparty} ·{" "}
                    {new Date(d.createdAt ?? d.$createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <span className={cn("rounded-full px-3 py-1 text-xs", STATUS_STYLE[d.status])}>
                  {d.status}
                </span>
                <Button variant="outline" className="rounded-full" onClick={() => download(d)}>
                  <Download className="size-4" />
                  Скачать
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Удалить"
                  onClick={() => remove.mutate(d.$id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
