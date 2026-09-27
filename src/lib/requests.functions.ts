import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Extracted = {
  title: string | null;
  qtyMin: number | null;
  qtyMax: number | null;
  qtyUnit: string | null;
  priceMin: number | null;
  priceMax: number | null;
  termMin: number | null;
  termMax: number | null;
  payment: string | null;
  basis: string | null;
  warranty: string | null;
  regularity: string | null;
};

const SYSTEM = `Ты извлекаешь параметры торговой заявки из текста. Верни ТОЛЬКО JSON-объект с ключами:
title (строка), qtyMin, qtyMax (числа), qtyUnit (строка, ед. изм.), priceMin, priceMax (числа, рубли за всё или за единицу как в тексте), termMin, termMax (числа, дни поставки),
payment (одно из: "100% предоплата", "50/50", "постоплата", "отсрочка"), basis (одно из: "самовывоз", "доставка силами поставщика", "ТК"),
warranty (строка: условия гарантии и приемки), regularity (одно из: "разовая", "еженедельно", "ежемесячно").
Правила: если параметр не найден в тексте — ставь null. Ничего не выдумывай.
Если цена или количество указаны одним числом — ставь вилку ±10% (min = число*0.9, max = число*1.1).
Если срок указан одним числом — min = max = это число.`;

async function callGroq(model: string, text: string, key: string) {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: text },
      ],
    }),
  });
}

const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : null);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export const analyzeRequestText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ text: z.string().min(1).max(5000) }).parse(d))
  .handler(async ({ data }): Promise<Extracted> => {
    const key = process.env["GROQ_API_KEY"];
    if (!key) throw new Error("Ключ Groq не настроен");
    let res = await callGroq("openai/gpt-oss-120b", data.text, key);
    if (!res.ok && res.status !== 429) res = await callGroq("llama-3.3-70b-versatile", data.text, key);
    if (!res.ok) throw new Error(`Сервис анализа недоступен (${res.status})`);
    const json = await res.json();
    let p: Record<string, unknown> = {};
    try {
      p = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
    } catch {
      p = {};
    }
    return {
      title: str(p["title"]),
      qtyMin: num(p["qtyMin"]),
      qtyMax: num(p["qtyMax"]),
      qtyUnit: str(p["qtyUnit"]),
      priceMin: num(p["priceMin"]),
      priceMax: num(p["priceMax"]),
      termMin: num(p["termMin"]),
      termMax: num(p["termMax"]),
      payment: str(p["payment"]),
      basis: str(p["basis"]),
      warranty: str(p["warranty"]),
      regularity: str(p["regularity"]),
    };
  });
