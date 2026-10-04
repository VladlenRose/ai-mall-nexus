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

// Фокус 1: Суть сделки (предмет, объёмы, цены)
const PROMPT_CORE = `Ты извлекаешь предмет сделки, количество и цену из текста заявки.
Верни ТОЛЬКО JSON-объект:
{
  "title": строка или null (название товара или услуги),
  "qtyMin": число или null,
  "qtyMax": число или null,
  "qtyUnit": строка или null (ед. измерения: шт, кг, упак, тонн и т.д.),
  "priceMin": число или null (цена в рублях),
  "priceMax": число или null (цена в рублях)
}
Правила:
- Если количество указано одним числом, сделай вилку ±10% (qtyMin = qty * 0.9, qtyMax = qty * 1.1).
- Если цена указана одним числом, сделай вилку ±10% (priceMin = price * 0.9, priceMax = price * 1.1).
- Чего нет в тексте — ставь null. Ничего не выдумывай.`;

// Фокус 2: Условия исполнения (сроки поставки, оплата, доставка, гарантия)
const PROMPT_TERMS = `Ты извлекаешь условия исполнения сделки из текста заявки.
Верни ТОЛЬКО JSON-объект:
{
  "termMin": число или null (минимальный срок в ДНЯХ),
  "termMax": число или null (максимальный срок в ДНЯХ),
  "payment": строка или null (строго одно из: "100% предоплата", "50/50", "постоплата", "отсрочка"),
  "basis": строка или null (строго одно из: "самовывоз", "доставка силами поставщика", "ТК"),
  "warranty": строка или null (условия гарантии/приемки),
  "regularity": строка или null (строго одно из: "разовая", "еженедельно", "ежемесячно")
}
Правила конвертации сроков:
- Всегда переводи сроки в ДНИ: 1 неделя = 7 дней, 2-3 недели = termMin: 14, termMax: 21, 1 месяц = 30 дней.
- Если срок указан одним числом (например, "за 10 дней") — termMin = 10, termMax = 10.
- Чего нет в тексте — ставь null. Ничего не выдумывай.`;

async function callGroq(model: string, systemPrompt: string, userText: string, key: string) {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
    }),
  });
}

async function requestWithFallback(systemPrompt: string, text: string, key: string): Promise<Record<string, unknown>> {
  let res = await callGroq("openai/gpt-oss-120b", systemPrompt, text, key);
  if (!res.ok && res.status !== 429) {
    res = await callGroq("llama-3.3-70b-versatile", systemPrompt, text, key);
  }
  if (!res.ok) throw new Error(`Сервис анализа недоступен (${res.status})`);
  const json = await res.json();
  try {
    return JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return {};
  }
}

const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? Math.round(v * 100) / 100 : null);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export const analyzeRequestText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ text: z.string().min(1).max(5000) }).parse(d))
  .handler(async ({ data }): Promise<Extracted> => {
    const key = process.env["GROQ_API_KEY"];
    if (!key) throw new Error("Ключ Groq не настроен");

    // Запускаем оба подзапроса параллельно — время ответа не увеличивается
    const [core, terms] = await Promise.all([
      requestWithFallback(PROMPT_CORE, data.text, key),
      requestWithFallback(PROMPT_TERMS, data.text, key),
    ]);

    return {
      title: str(core["title"]),
      qtyMin: num(core["qtyMin"]),
      qtyMax: num(core["qtyMax"]),
      qtyUnit: str(core["qtyUnit"]),
      priceMin: num(core["priceMin"]),
      priceMax: num(core["priceMax"]),
      termMin: num(terms["termMin"]),
      termMax: num(terms["termMax"]),
      payment: str(terms["payment"]),
      basis: str(terms["basis"]),
      warranty: str(terms["warranty"]),
      regularity: str(terms["regularity"]),
    };
  });
