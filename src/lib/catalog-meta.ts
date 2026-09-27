import linen from "@/assets/product-linen.jpg";
import mugs from "@/assets/product-mugs.jpg";
import tools from "@/assets/product-tools.jpg";

export const CATEGORIES = [
  "Все категории",
  "Посуда и HoReCa",
  "Текстиль",
  "Инструменты",
  "Упаковка",
  "Оборудование",
] as const;

const FALLBACKS = [mugs, linen, tools];

/** Стабильная картинка-заглушка, когда у товара нет загруженного фото. */
export function fallbackImage(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return FALLBACKS[sum % FALLBACKS.length]!;
}
