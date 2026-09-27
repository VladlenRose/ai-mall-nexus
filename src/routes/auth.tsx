import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const TITLE = "Вход и регистрация — AI-Mall";
const DESCRIPTION =
  "Войдите в AI-Mall или создайте аккаунт компании, чтобы вести переговоры с ИИ-агентами и подписывать документы.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "register";

function errorText(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "EMAIL_CONFIRM_REQUIRED")
    return "Мы отправили письмо с подтверждением — перейдите по ссылке и войдите";
  if (/Invalid login credentials/i.test(message)) return "Неверный email или пароль";
  if (/Invalid credentials/i.test(message)) return "Неверный email или пароль";
  if (/User already registered/i.test(message)) return "Пользователь с таким email уже зарегистрирован";
  if (/already exists/i.test(message)) return "Пользователь с таким email уже зарегистрирован";
  if (/Password must be/i.test(message)) return "Пароль должен содержать минимум 8 символов";
  if (/Invalid `email`/i.test(message)) return "Введите корректный email";
  if (/Rate limit/i.test(message)) return "Слишком много попыток, попробуйте через минуту";
  return message || "Не удалось выполнить запрос";
}

function AuthPage() {
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (!email.trim() || !password) {
      toast.error("Заполните email и пароль");
      return;
    }
    if (password.length < 8) {
      toast.error("Пароль должен содержать минимум 8 символов");
      return;
    }
    if (mode === "register" && !name.trim()) {
      toast.error("Укажите имя");
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
        toast.success("Добро пожаловать");
      } else {
        await register({
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          password,
        });
        toast.success("Аккаунт создан");
      }
      await navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-mist/60 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto flex w-fit items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-[10px] bg-brand text-xs font-bold text-brand-foreground">
            AI
          </span>
          <span className="text-base font-semibold tracking-tight text-ink">AI-Mall</span>
        </Link>

        <div className="glass-panel mt-6 rounded-2xl p-7">
          <div className="flex gap-1 rounded-full bg-foreground/5 p-1">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-full px-4 py-2 text-sm transition-colors",
                  mode === m ? "bg-background text-ink shadow-sm" : "text-dim hover:text-ink",
                )}
              >
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>

          <h1 className="mt-6 text-xl font-semibold tracking-tight text-ink">
            {mode === "login" ? "Вход в кабинет" : "Создание аккаунта"}
          </h1>
          <p className="mt-1.5 text-sm text-dim">
            {mode === "login"
              ? "Продолжите переговоры и работу с документами."
              : "Зарегистрируйте компанию и подключите ИИ-агента."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="a-name">Имя</Label>
                  <Input
                    id="a-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Иван Петров"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a-company">Компания</Label>
                  <Input
                    id="a-company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    autoComplete="organization"
                    placeholder="ООО «Гранит Трейд»"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="a-email">Email</Label>
              <Input
                id="a-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="ivan@company.ru"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="a-password">Пароль</Label>
              <Input
                id="a-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="Минимум 8 символов"
              />
            </div>

            <Button type="submit" variant="hero" className="h-11 w-full" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" ? "Войти" : "Зарегистрироваться"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
