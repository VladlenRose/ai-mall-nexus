import { supabase } from "@/integrations/supabase/client";

export type ProductStatus = "Активен" | "На модерации" | "Завершён";
export type NegotiationStage = "Торг идёт" | "Согласовано" | "Документы готовы";
export type DocStatus = "Подписан" | "Ожидает подписи" | "Черновик";

export type Product = {
  $id: string;
  $createdAt: string;
  ownerId: string;
  title: string;
  description?: string;
  supplier?: string;
  category?: string;
  price: number;
  unit?: string;
  rating: number;
  imageId?: string | null;
  status: ProductStatus;
};

export type Profile = {
  $id: string;
  $createdAt: string;
  userId: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  inn?: string;
};

export type Thread = {
  $id: string;
  $createdAt: string;
  buyerId: string;
  sellerId?: string;
  productId?: string;
  company?: string;
  stage: NegotiationStage;
  preview?: string;
  lastAt?: string;
};

export type Message = {
  $id: string;
  $createdAt: string;
  threadId: string;
  author: "me" | "agent";
  text?: string;
  offerPrice?: string;
  offerTerm?: string;
  offerConditions?: string;
  createdAt?: string;
};

export type DocumentRow = {
  $id: string;
  $createdAt: string;
  ownerId: string;
  threadId?: string;
  title: string;
  counterparty?: string;
  status: DocStatus;
  body?: string;
  createdAt?: string;
};

export type ProductInput = {
  title: string;
  description?: string;
  supplier?: string;
  category?: string;
  price: number;
  unit?: string;
  rating: number;
  imageId?: string | null;
  status: ProductStatus;
};

export type ProfileInput = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  inn?: string;
};

export type ThreadInput = {
  sellerId?: string;
  productId?: string;
  company?: string;
  stage: NegotiationStage;
  preview?: string;
  lastAt?: string;
};

export type MessageInput = {
  threadId: string;
  author: "me" | "agent";
  text?: string;
  offerPrice?: string;
  offerTerm?: string;
  offerConditions?: string;
  createdAt?: string;
};

export type DocumentInput = {
  threadId?: string;
  title: string;
  counterparty?: string;
  status: DocStatus;
  body?: string;
  createdAt?: string;
};

/* ---------------- mappers ---------------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
function toProduct(r: any): Product {
  return {
    $id: r.id,
    $createdAt: r.created_at,
    ownerId: r.owner_id,
    title: r.title,
    description: r.description ?? undefined,
    supplier: r.supplier ?? undefined,
    category: r.category ?? undefined,
    price: Number(r.price ?? 0),
    unit: r.unit ?? undefined,
    rating: Number(r.rating ?? 0),
    imageId: r.image_id ?? null,
    status: r.status,
  };
}

function toProfile(r: any): Profile {
  return {
    $id: r.id,
    $createdAt: r.created_at,
    userId: r.user_id,
    name: r.name ?? undefined,
    company: r.company ?? undefined,
    email: r.email ?? undefined,
    phone: r.phone ?? undefined,
    inn: r.inn ?? undefined,
  };
}

function toThread(r: any): Thread {
  return {
    $id: r.id,
    $createdAt: r.created_at,
    buyerId: r.buyer_id,
    sellerId: r.seller_id ?? undefined,
    productId: r.product_id ?? undefined,
    company: r.company ?? undefined,
    stage: r.stage,
    preview: r.preview ?? undefined,
    lastAt: r.last_at ?? undefined,
  };
}

function toMessage(r: any): Message {
  return {
    $id: r.id,
    $createdAt: r.created_at,
    threadId: r.thread_id,
    author: r.author,
    text: r.text ?? undefined,
    offerPrice: r.offer_price ?? undefined,
    offerTerm: r.offer_term ?? undefined,
    offerConditions: r.offer_conditions ?? undefined,
    createdAt: r.created_at,
  };
}

function toDocument(r: any): DocumentRow {
  return {
    $id: r.id,
    $createdAt: r.created_at,
    ownerId: r.owner_id,
    threadId: r.thread_id ?? undefined,
    title: r.title,
    counterparty: r.counterparty ?? undefined,
    status: r.status,
    body: r.body ?? undefined,
    createdAt: r.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ---------------- products ---------------- */

export async function listProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map(toProduct);
}

export async function listMyProducts(userId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map(toProduct);
}

export async function createProduct(userId: string, data: ProductInput) {
  const { data: row, error } = await supabase
    .from("products")
    .insert({
      owner_id: userId,
      title: data.title,
      description: data.description ?? null,
      supplier: data.supplier ?? null,
      category: data.category ?? null,
      price: data.price,
      unit: data.unit ?? null,
      rating: data.rating,
      image_id: data.imageId ?? null,
      status: data.status,
    })
    .select()
    .single();
  if (error) throw error;
  return toProduct(row);
}

export async function updateProduct(id: string, data: Partial<ProductInput>) {
  const patch: {
    title?: string;
    description?: string | null;
    supplier?: string | null;
    category?: string | null;
    price?: number;
    unit?: string | null;
    rating?: number;
    image_id?: string | null;
    status?: string;
  } = {};
  if (data.title !== undefined) patch["title"] = data.title;
  if (data.description !== undefined) patch["description"] = data.description;
  if (data.supplier !== undefined) patch["supplier"] = data.supplier;
  if (data.category !== undefined) patch["category"] = data.category;
  if (data.price !== undefined) patch["price"] = data.price;
  if (data.unit !== undefined) patch["unit"] = data.unit;
  if (data.rating !== undefined) patch["rating"] = data.rating;
  if (data.imageId !== undefined) patch["image_id"] = data.imageId;
  if (data.status !== undefined) patch["status"] = data.status;
  const { data: row, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toProduct(row);
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

const IMAGE_BUCKET = "product-images";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year

export async function uploadProductImage(file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file);
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signError) throw signError;
  return data.signedUrl;
}

/** imageId хранит готовую подписанную ссылку — возвращаем как есть. */
export function imageUrl(imageId?: string | null) {
  return imageId || null;
}

/* ---------------- profile ---------------- */

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toProfile(data) : null;
}

export async function saveProfile(userId: string, data: ProfileInput) {
  const existing = await getProfile(userId);
  if (existing) {
    const { data: row, error } = await supabase
      .from("profiles")
      .update({
        name: data.name ?? null,
        company: data.company ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        inn: data.inn ?? null,
      })
      .eq("id", existing.$id)
      .select()
      .single();
    if (error) throw error;
    return toProfile(row);
  }
  const { data: row, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      name: data.name ?? null,
      company: data.company ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      inn: data.inn ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toProfile(row);
}

/* ---------------- threads & messages ---------------- */

export async function listThreads(userId: string) {
  const { data, error } = await supabase
    .from("threads")
    .select("*")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map(toThread);
}

export async function createThread(userId: string, data: ThreadInput) {
  const { data: row, error } = await supabase
    .from("threads")
    .insert({
      buyer_id: userId,
      seller_id: data.sellerId ?? null,
      product_id: data.productId ?? null,
      company: data.company ?? null,
      stage: data.stage,
      preview: data.preview ?? null,
      last_at: data.lastAt ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toThread(row);
}

export async function updateThread(id: string, data: Partial<ThreadInput>) {
  const patch: {
    seller_id?: string | null;
    product_id?: string | null;
    company?: string | null;
    stage?: string;
    preview?: string | null;
    last_at?: string | null;
  } = {};
  if (data.sellerId !== undefined) patch["seller_id"] = data.sellerId;
  if (data.productId !== undefined) patch["product_id"] = data.productId;
  if (data.company !== undefined) patch["company"] = data.company;
  if (data.stage !== undefined) patch["stage"] = data.stage;
  if (data.preview !== undefined) patch["preview"] = data.preview;
  if (data.lastAt !== undefined) patch["last_at"] = data.lastAt;
  const { data: row, error } = await supabase
    .from("threads")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toThread(row);
}

export async function listMessages(threadId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map(toMessage);
}

export async function createMessage(_userId: string, data: MessageInput) {
  const { data: row, error } = await supabase
    .from("messages")
    .insert({
      thread_id: data.threadId,
      author: data.author,
      text: data.text ?? null,
      offer_price: data.offerPrice ?? null,
      offer_term: data.offerTerm ?? null,
      offer_conditions: data.offerConditions ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toMessage(row);
}

/* ---------------- documents ---------------- */

export async function listDocuments(userId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map(toDocument);
}

export async function createDocument(userId: string, data: DocumentInput) {
  const { data: row, error } = await supabase
    .from("documents")
    .insert({
      owner_id: userId,
      thread_id: data.threadId ?? null,
      title: data.title,
      counterparty: data.counterparty ?? null,
      status: data.status,
      body: data.body ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toDocument(row);
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}
