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

// Фокус 1: Точное каноническое наименование товара или услуги
const PROMPT_TITLE = `Ты — эксперт по товарной номенклатуре. Твоя задача: найти в тексте заявки товар или услугу и нормализовать его.
Верни ТОЛЬКО JSON:
{
  "title": строка или null
}
Правила:
- Приведи строго к ИМЕНИТЕЛЬНОМУ ПАДЕЖУ, ЕДИНСТВЕННОМУ ЧИСЛУ (например: "офисные кресла" -> "офисное кресло", "арматуры" -> "арматура").
- Убери все глаголы, предлоги и вводные слова (никаких "хочу купить", "продажа", "поставка").
- Исправь опечатки, если они есть (например: "керамогронит" -> "керамогранит").
- Если товаров несколько, выдели главное общее наименование.
- Если товар не упомянут — верни null.`;

// Фокус 2: Объёмы, единицы измерения и бюджет
const PROMPT_QUANTITY_PRICE = `Ты извлекаешь количество и цену из текста заявки.
Верни ТОЛЬКО JSON:
{
  "qtyMin": число или null,
  "qtyMax": число или null,
  "qtyUnit": строка или null (ед. измерения: шт, кг, т, упак, м2 и т.д.),
  "priceMin": число или null (цена в рублях),
  "priceMax": число или null (цена в рублях)
}
Правила:
- Если количество указано одним числом, сделай вилку ±10% (qtyMin = число * 0.9, qtyMax = число * 1.1).
- Если цена указана одним числом, сделай вилку ±10% (priceMin = число * 0.9, priceMax = число * 1.1).
- Чего нет в тексте — ставь null.`;

// Фокус 3: Сроки, логистика, оплата и условия
const PROMPT_TERMS = `Ты извлекаешь сроки и условия исполнения из текста заявки.
Верни ТОЛЬКО JSON:
{
  "termMin": число или null (минимальный срок в ДНЯХ),
  "termMax": число или null (максимальный срок в ДНЯХ),
  "payment": строка или null (строго одно из: "100% предоплата", "50/50", "постоплата", "отсрочка"),
  "basis": строка или null (строго одно из: "самовывоз", "доставка силами поставщика", "ТК"),
  "warranty": строка или null (условия гарантии/приемки),
  "regularity": строка или null (строго одно из: "разовая", "еженедельно", "ежемесячно")
}
Правила конвертации сроков:
- Всегда переводи в ДНИ: 1 неделя = 7 дней, "2-3 недели" -> termMin: 14, termMax: 21, 1 месяц = 30 дней.
- Если срок одним числом (например, "за 5 дней") -> termMin: 5, termMax: 5.
- Чего нет в тексте — ставь null.`;

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

    // Запускаем 3 микро-запроса параллельно
    const [titleRes, qtyPriceRes, termsRes] = await Promise.all([
      requestWithFallback(PROMPT_TITLE, data.text, key),
      requestWithFallback(PROMPT_QUANTITY_PRICE, data.text, key),
      requestWithFallback(PROMPT_TERMS, data.text, key),
    ]);

    return {
      title: str(titleRes["title"]),
      qtyMin: num(qtyPriceRes["qtyMin"]),
      qtyMax: num(qtyPriceRes["qtyMax"]),
      qtyUnit: str(qtyPriceRes["qtyUnit"]),
      priceMin: num(qtyPriceRes["priceMin"]),
      priceMax: num(qtyPriceRes["priceMax"]),
      termMin: num(termsRes["termMin"]),
      termMax: num(termsRes["termMax"]),
      payment: str(termsRes["payment"]),
      basis: str(termsRes["basis"]),
      warranty: str(termsRes["warranty"]),
      regularity: str(termsRes["regularity"]),
    };
  });
