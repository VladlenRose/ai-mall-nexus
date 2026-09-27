import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Archive, ImagePlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  createProduct,
  deleteProduct,
  getProfile,
  imageUrl,
  listMyProducts,
  uploadProductImage,
  type Product,
  type ProductStatus,
} from "@/lib/api";

import { CATEGORIES, fallbackImage } from "@/lib/catalog-meta";
import { cn } from "@/lib/utils";

const TITLE = "Кабинет продавца AI-Mall — товары и модерация";
const DESCRIPTION =
  "Добавляйте товары, управляйте карточками и отслеживайте статусы: активен, на модерации, завершён.";

export const Route = createFileRoute("/seller")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Seller,
});

const STATUS_STYLE: Record<ProductStatus, string> = {
  Активен: "bg-brand/10 text-brand",
  "На модерации": "bg-gold/15 text-gold",
  Завершён: "bg-foreground/5 text-dim",
};

function Seller() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("шт");
  const [category, setCategory] = useState<string>(CATEGORIES[1]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const productsQuery = useQuery({
    queryKey: ["my-products", user?.id],
    queryFn: () => listMyProducts(user!.id),
    enabled: !!user,
  });
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });

  const items = productsQuery.data ?? [];

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const imageId = file ? await uploadProductImage(file) : null;
      return createProduct(user?.id, {
        title: title.trim(),
        description: description.trim(),
        supplier: profileQuery.data?.company || user.name || "Мой бизнес",
        category,
        price: Number(price) || 0,
        unit,
        rating: 0,
        imageId,
        status: "Активен",
      });
    },
    onSuccess: async () => {
      setTitle("");
      setPrice("");
      setDescription("");
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ["my-products"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Товар опубликован");
    },
    onError: () => toast.error("Не удалось сохранить товар"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-products"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Товар удалён");
    },
    onError: () => toast.error("Не удалось удалить товар"),
  });

  const imageOf = (p: Product) => imageUrl(p.imageId) ?? fallbackImage(p.$id);

  return (
    <AppShell title="Мои товары">
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          className="glass-panel h-fit rounded-2xl p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !price.trim()) {
              toast.error("Заполните название и цену");
              return;
            }
            create.mutate();
          }}
        >
          <h2 className="text-base font-semibold text-ink">Добавить товар</h2>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-title">Название</Label>
              <Input
                id="p-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Кружки с логотипом"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">Описание</Label>
              <Textarea
                id="p-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Материал, объём партии, сроки"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-price">Цена, ₽</Label>
                <Input
                  id="p-price"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="350"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-unit">Единица</Label>
                <Input id="p-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.slice(1).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/60 p-6 text-center transition-colors hover:border-brand/40">
              <ImagePlus className="size-5 text-dim" />
              <span className="text-sm text-dim">
                {file ? file.name : "Загрузить фото товара"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <Button type="submit" variant="hero" className="h-11 w-full" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : "Опубликовать"}
            </Button>
          </div>
        </form>

        <section className="glass-panel overflow-hidden rounded-2xl">
          <div className="border-b border-border px-6 py-4 text-base font-semibold text-ink">
            Список товаров · {items.length}
          </div>
          {productsQuery.isLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="size-5 animate-spin text-brand" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-dim">
              Пока нет товаров. Добавьте первый — он сразу появится в каталоге.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((p) => (
                <li key={p.$id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                  <img
                    src={imageOf(p)}
                    alt={p.title}
                    loading="lazy"
                    className="size-14 rounded-xl object-cover"
                  />
                  <div className="min-w-40 flex-1">
                    <div className="text-sm font-medium text-ink">{p.title}</div>
                    <div className="text-xs text-dim">
                      {p.category} · {p.price.toLocaleString("ru-RU")} ₽/{p.unit ?? "шт"}
                    </div>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-xs", STATUS_STYLE[p.status])}>
                    {p.status}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Удалить"
                    onClick={() => remove.mutate(p.$id)}
                  >
                    <Archive className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
