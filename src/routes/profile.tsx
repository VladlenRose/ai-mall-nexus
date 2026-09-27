import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { getProfile, saveProfile } from "@/lib/api";

const TITLE = "Профиль и настройки — AI-Mall";
const DESCRIPTION =
  "Редактирование профиля компании, контактных данных и оформления интерфейса AI-Mall.";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dark, setDark] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", inn: "" });

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (!user) return;
    const p = profileQuery.data;
    setForm({
      name: p?.name ?? user.name ?? "",
      company: p?.company ?? "",
      email: p?.email ?? user.email ?? "",
      phone: p?.phone ?? "",
      inn: p?.inn ?? "",
    });
  }, [profileQuery.data, user]);

  const save = useMutation({
    mutationFn: () => saveProfile(user!.id, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Профиль сохранён");
    },
    onError: () => toast.error("Не удалось сохранить профиль"),
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <AppShell title="Профиль и настройки">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form
          className="glass-panel rounded-2xl p-6"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <h2 className="text-base font-semibold text-ink">Данные компании</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input id="name" value={form.name} onChange={set("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Компания</Label>
              <Input id="company" value={form.company} onChange={set("company")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input id="phone" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="inn">ИНН</Label>
              <Input id="inn" value={form.inn} onChange={set("inn")} />
            </div>
          </div>
          <Button type="submit" variant="hero" className="mt-6 h-11" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : "Сохранить изменения"}
          </Button>
        </form>

        <section className="glass-panel h-fit rounded-2xl p-6">
          <h2 className="text-base font-semibold text-ink">Интерфейс</h2>
          <div className="mt-5 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-ink">Тёмная тема</div>
                <div className="text-xs text-dim">Ночной режим интерфейса</div>
              </div>
              <Switch checked={dark} onCheckedChange={setDark} />
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-6 h-11 w-full rounded-full"
            onClick={() => {
              void logout().then(() => navigate({ to: "/" }));
            }}
          >
            Выйти из аккаунта
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
