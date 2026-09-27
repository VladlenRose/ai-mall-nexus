import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  product: z.string().default("товар"),
  supplier: z.string().default("поставщик"),
  price: z.number().default(0),
  stage: z.string().default("Торг идёт"),
  history: z
    .array(z.object({ author: z.enum(["me", "agent"]), text: z.string() }))
    .max(30)
    .default([]),
});

export type AgentReply = {
  text: string;
  stage: "Торг идёт" | "Согласовано" | "Документы готовы";
  offer?: { price: string; term: string; conditions: string } | null;
};

/** ИИ-агент продавца: ведёт торг и формирует предложение. */
export const negotiate = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<AgentReply> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const system = `Ты — ИИ-агент продавца на B2B-маркетплейсе AI-Mall.
Товар: ${data.product}. Поставщик: ${data.supplier}. Базовая цена: ${data.price} ₽.
Текущий статус переговоров: ${data.stage}.
Веди деловой торг по-русски, кратко (1-3 предложения). Можешь давать скидку до 12% при объёме.
Верни СТРОГО JSON без markdown:
{"text": "ответ покупателю", "stage": "Торг идёт" | "Согласовано" | "Документы готовы", "offer": {"price":"...","term":"...","conditions":"..."} | null}
Ставь stage "Согласовано", только когда условия действительно приняты обеими сторонами.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          ...data.history.map((m) => ({
            role: m.author === "me" ? ("user" as const) : ("assistant" as const),
            content: m.text,
          })),
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`AI gateway error ${res.status}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned) as AgentReply;
      return {
        text: parsed.text || "Уточняю условия у поставщика.",
        stage: parsed.stage ?? "Торг идёт",
        offer: parsed.offer ?? null,
      };
    } catch {
      return { text: cleaned || "Уточняю условия у поставщика.", stage: "Торг идёт", offer: null };
    }
  });
