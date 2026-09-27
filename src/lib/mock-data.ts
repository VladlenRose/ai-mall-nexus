import mugs from "@/assets/product-mugs.jpg";
import linen from "@/assets/product-linen.jpg";
import tools from "@/assets/product-tools.jpg";

export type ProductStatus = "Активен" | "На модерации" | "Завершён";

export type Product = {
  id: string;
  title: string;
  supplier: string;
  category: string;
  price: number;
  unit: string;
  rating: number;
  image: string;
  badge?: "Оригинал" | "Премиум";
  status: ProductStatus;
};

export const CATEGORIES = [
  "Все категории",
  "Посуда и HoReCa",
  "Текстиль",
  "Инструменты",
] as const;

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    title: "Керамические кружки, корпоративная серия",
    supplier: "ООО «Керамика Урал»",
    category: "Посуда и HoReCa",
    price: 348,
    unit: "шт, от 200 шт",
    rating: 4.9,
    image: mugs,
    badge: "Оригинал",
    status: "Активен",
  },
  {
    id: "p2",
    title: "Льняной текстиль для отелей, комплект",
    supplier: "Фабрика «Северный лён»",
    category: "Текстиль",
    price: 2740,
    unit: "комплект",
    rating: 4.8,
    image: linen,
    badge: "Премиум",
    status: "Активен",
  },
  {
    id: "p3",
    title: "Набор профессионального инструмента",
    supplier: "ТД «Промтех»",
    category: "Инструменты",
    price: 12490,
    unit: "набор",
    rating: 4.7,
    image: tools,
    status: "На модерации",
  },
  {
    id: "p4",
    title: "Фарфор для ресторанов, белая линия",
    supplier: "ООО «Керамика Урал»",
    category: "Посуда и HoReCa",
    price: 890,
    unit: "шт, от 50 шт",
    rating: 4.6,
    image: mugs,
    badge: "Премиум",
    status: "Активен",
  },
  {
    id: "p5",
    title: "Махровые полотенца 500 г/м²",
    supplier: "Фабрика «Северный лён»",
    category: "Текстиль",
    price: 620,
    unit: "шт",
    rating: 4.4,
    image: linen,
    status: "Завершён",
  },
  {
    id: "p6",
    title: "Ручной инструмент для сервисных центров",
    supplier: "ТД «Промтех»",
    category: "Инструменты",
    price: 5340,
    unit: "набор",
    rating: 4.5,
    image: tools,
    badge: "Оригинал",
    status: "Активен",
  },
];

export const SEARCH_SUGGESTIONS = [
  "кружки корпоративные",
  "лён для отелей",
  "инструмент профессиональный",
  "фарфор ресторанный",
  "полотенца махровые",
  "поставщики Свердловской области",
];

export type NegotiationStage = "Торг идёт" | "Согласовано" | "Документы готовы";

export type ChatMessage = {
  id: string;
  from: "me" | "agent";
  text: string;
  time: string;
  offer?: { price: string; term: string; conditions: string };
};

export type Thread = {
  id: string;
  company: string;
  agent: string;
  preview: string;
  time: string;
  unread: number;
  stage: NegotiationStage;
  messages: ChatMessage[];
};

export const THREADS: Thread[] = [
  {
    id: "t1",
    company: "ООО «Керамика Урал»",
    agent: "AI-агент продавца",
    preview: "Готовы зафиксировать 331 ₽ при объёме 500 шт",
    time: "10:24",
    unread: 2,
    stage: "Согласовано",
    messages: [
      {
        id: "m1",
        from: "me",
        text: "Нужны кружки с логотипом, 500 штук, доставка в Екатеринбург до 20 октября.",
        time: "10:02",
      },
      {
        id: "m2",
        from: "agent",
        text: "Принял. Проверяю склад и загрузку печати. Объём 500 шт даёт скидку 5%.",
        time: "10:05",
      },
      {
        id: "m3",
        from: "agent",
        text: "Сформировал предложение:",
        time: "10:18",
        offer: {
          price: "331 ₽ / шт · 165 500 ₽",
          term: "Отгрузка 14 дней",
          conditions: "Постоплата 30 дней, доставка включена",
        },
      },
      {
        id: "m4",
        from: "me",
        text: "Согласны, если постоплата 45 дней.",
        time: "10:21",
      },
      {
        id: "m5",
        from: "agent",
        text: "Условие принято. Статус переговоров — «Согласовано», можно формировать договор.",
        time: "10:24",
      },
    ],
  },
  {
    id: "t2",
    company: "Фабрика «Северный лён»",
    agent: "AI-агент продавца",
    preview: "Предлагаю 2 610 ₽ за комплект при 120 комплектах",
    time: "Вчера",
    unread: 0,
    stage: "Торг идёт",
    messages: [
      {
        id: "m1",
        from: "me",
        text: "Интересует льняной комплект для отеля, 120 комплектов.",
        time: "16:40",
      },
      {
        id: "m2",
        from: "agent",
        text: "Могу предложить 2 610 ₽ за комплект при предоплате 50%.",
        time: "16:44",
        offer: {
          price: "2 610 ₽ / комплект",
          term: "Отгрузка 21 день",
          conditions: "Предоплата 50%",
        },
      },
    ],
  },
  {
    id: "t3",
    company: "ТД «Промтех»",
    agent: "AI-агент продавца",
    preview: "Договор №2481 подписан обеими сторонами",
    time: "28 авг",
    unread: 0,
    stage: "Документы готовы",
    messages: [
      {
        id: "m1",
        from: "agent",
        text: "Договор №2481 сформирован и подписан. Спецификация во вложении.",
        time: "12:10",
      },
    ],
  },
];

export type DocItem = {
  id: string;
  title: string;
  counterparty: string;
  date: string;
  status: "Подписан" | "Ожидает подписи" | "Черновик";
  size: string;
};

export const DOCUMENTS: DocItem[] = [
  {
    id: "d1",
    title: "Договор поставки №2481",
    counterparty: "ТД «Промтех»",
    date: "28.08.2026",
    status: "Подписан",
    size: "312 КБ",
  },
  {
    id: "d2",
    title: "Спецификация №2481-1",
    counterparty: "ТД «Промтех»",
    date: "28.08.2026",
    status: "Подписан",
    size: "128 КБ",
  },
  {
    id: "d3",
    title: "Договор поставки №2506",
    counterparty: "ООО «Керамика Урал»",
    date: "01.09.2026",
    status: "Ожидает подписи",
    size: "296 КБ",
  },
  {
    id: "d4",
    title: "Коммерческое предложение",
    counterparty: "Фабрика «Северный лён»",
    date: "31.08.2026",
    status: "Черновик",
    size: "84 КБ",
  },
];

export const ACTIVITY = [
  {
    time: "10:24",
    title: "AI-агент согласовал условия",
    detail: "ООО «Керамика Урал» — 331 ₽ / шт, постоплата 45 дней",
  },
  {
    time: "09:50",
    title: "Новая заявка от покупателя",
    detail: "Сеть отелей «Гранит» — льняные комплекты, 120 шт",
  },
  {
    time: "Вчера",
    title: "Документ ожидает подписи",
    detail: "Договор поставки №2506",
  },
  {
    time: "28 авг",
    title: "Сделка завершена",
    detail: "ТД «Промтех» — 5 наборов инструмента",
  },
];
