import { supabase } from '@/services/supabase';
import type {
  PosCartItem,
  PosCategorySummary,
  PosProduct,
  PosProductDraft,
  PosTemplateOption,
} from '../types';
import { uploadPosImageToStorage } from './imageUploadService';

export const DEFAULT_POS_CATEGORY = 'General';

export const POS_CATEGORY_PRESETS: readonly string[] = [
  'Tacos',
  'Bebidas',
  'Antojitos',
  'Postres',
  'General',
];

export const POS_TEMPLATES: readonly PosTemplateOption[] = [
  {
    id: 'taqueria',
    label: 'Taquería',
    items: [
      {
        name: 'Tacos de bistec',
        priceCents: 2800,
        category: 'Tacos',
        description: 'Tortilla recién hecha con bistec al carbón',
      },
      {
        name: 'Tacos al pastor',
        priceCents: 2500,
        category: 'Tacos',
        description: 'Con piña, cilantro y cebolla',
      },
      {
        name: 'Refresco',
        priceCents: 2200,
        category: 'Bebidas',
        description: 'Refresco bien frío de 355 ml',
      },
      {
        name: 'Agua de horchata',
        priceCents: 2500,
        category: 'Bebidas',
        description: 'Vaso grande de 500 ml',
      },
    ],
  },
  {
    id: 'tienda',
    label: 'Tienda',
    items: [
      {
        name: 'Agua 600ml',
        priceCents: 1500,
        category: 'Bebidas',
        description: 'Agua purificada fría de 600 ml',
      },
      {
        name: 'Refresco 600ml',
        priceCents: 2200,
        category: 'Bebidas',
        description: 'Refresco frío de 600 ml',
      },
      {
        name: 'Pan dulce',
        priceCents: 1800,
        category: 'Postres',
        description: 'Pieza recién horneada',
      },
      {
        name: 'Leche 1L',
        priceCents: 2800,
        category: 'General',
        description: 'Leche entera en envase de 1 litro',
      },
    ],
  },
  {
    id: 'fruteria',
    label: 'Frutería',
    items: [
      {
        name: 'Vaso chico',
        priceCents: 3500,
        category: 'Postres',
        description: 'Fruta picada fresca de temporada',
      },
      {
        name: 'Vaso grande',
        priceCents: 5000,
        category: 'Postres',
        description: 'Porción grande con chile y limón',
      },
      {
        name: 'Charola preparada',
        priceCents: 7500,
        category: 'Antojitos',
        description: 'Charola mixta con toppings al gusto',
      },
      {
        name: 'Jugo natural 500ml',
        priceCents: 4000,
        category: 'Bebidas',
        description: 'Jugo recién exprimido de 500 ml',
      },
    ],
  },
];

const PRODUCT_EXTENDED_SELECT =
  'id, name, price_cents, description, category, category_id, image_url';
const PRODUCT_BASE_SELECT = 'id, name, price_cents';

interface ProductRowExtended {
  id: string;
  name: string;
  price_cents: number;
  description?: string | null;
  category?: string | null;
  category_id?: string | null;
  image_url?: string | null;
}

function mapProductRow(row: ProductRowExtended): PosProduct {
  return {
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    description: row.description ?? null,
    category: row.category?.trim() || DEFAULT_POS_CATEGORY,
    categoryId: row.category_id ?? null,
    imageUrl: row.image_url ?? null,
  };
}

function isMissingExtendedColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('description') ||
    lower.includes('category') ||
    lower.includes('category_id') ||
    lower.includes('image_url') ||
    lower.includes('schema cache')
  );
}

function normalizeCategory(category?: string | null): string {
  const trimmed = category?.trim() ?? '';
  return trimmed.length > 0 ? trimmed.slice(0, 32) : DEFAULT_POS_CATEGORY;
}

function normalizeDescription(description?: string | null): string | null {
  const trimmed = description?.trim() ?? '';
  return trimmed.length > 0 ? trimmed.slice(0, 160) : null;
}

export async function uploadProductImage(
  merchantId: string,
  draft: Pick<PosProductDraft, 'imageUri' | 'imageBase64' | 'imageMimeType'>,
  productIdHint?: string
): Promise<string | null> {
  return uploadPosImageToStorage(merchantId, 'products', draft, productIdHint);
}

export async function fetchActiveProducts(): Promise<PosProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_EXTENDED_SELECT)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingExtendedColumnError(error.message)) {
      const fallback = await supabase
        .from('products')
        .select(PRODUCT_BASE_SELECT)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (fallback.error) {
        throw new Error(fallback.error.message);
      }

      return (fallback.data ?? []).map((row) => mapProductRow(row));
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapProductRow(row));
}

export async function createProduct(
  merchantId: string,
  draft: PosProductDraft
): Promise<PosProduct> {
  const uploadedImageUrl = await uploadProductImage(merchantId, draft);

  const { data, error } = await supabase
    .from('products')
    .insert({
      merchant_id: merchantId,
      name: draft.name.trim(),
      price_cents: draft.priceCents,
      description: normalizeDescription(draft.description),
      category: normalizeCategory(draft.category),
      category_id: draft.categoryId ?? null,
      image_url: uploadedImageUrl,
      active: true,
    })
    .select(PRODUCT_EXTENDED_SELECT)
    .single();

  if (error) {
    if (isMissingExtendedColumnError(error.message)) {
      const fallback = await supabase
        .from('products')
        .insert({
          merchant_id: merchantId,
          name: draft.name.trim(),
          price_cents: draft.priceCents,
          active: true,
        })
        .select(PRODUCT_BASE_SELECT)
        .single();

      if (fallback.error || !fallback.data) {
        throw new Error(fallback.error?.message ?? 'No se pudo guardar el producto o servicio.');
      }

      return mapProductRow(fallback.data);
    }
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('No se pudo guardar el producto o servicio.');
  }

  return mapProductRow(data);
}

export async function createProductsBatch(
  merchantId: string,
  drafts: readonly PosProductDraft[]
): Promise<PosProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .insert(
      drafts.map((draft) => ({
        merchant_id: merchantId,
        name: draft.name.trim(),
        price_cents: draft.priceCents,
        description: normalizeDescription(draft.description),
        category: normalizeCategory(draft.category),
        category_id: draft.categoryId ?? null,
        image_url: draft.imageUri ?? null,
        active: true,
      }))
    )
    .select(PRODUCT_EXTENDED_SELECT);

  if (error) {
    if (isMissingExtendedColumnError(error.message)) {
      const fallback = await supabase
        .from('products')
        .insert(
          drafts.map((draft) => ({
            merchant_id: merchantId,
            name: draft.name.trim(),
            price_cents: draft.priceCents,
            active: true,
          }))
        )
        .select(PRODUCT_BASE_SELECT);

      if (fallback.error) {
        throw new Error(fallback.error.message);
      }

      return (fallback.data ?? []).map((row) => mapProductRow(row));
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapProductRow(row));
}

export async function updateProduct(
  productId: string,
  draft: PosProductDraft,
  merchantId?: string
): Promise<PosProduct> {
  let resolvedImageUrl: string | null | undefined;
  if (draft.imageUri !== undefined) {
    if (!draft.imageUri) {
      resolvedImageUrl = null;
    } else if (draft.imageUri.startsWith('http://') || draft.imageUri.startsWith('https://')) {
      resolvedImageUrl = draft.imageUri;
    } else {
      let ownerId = merchantId;
      if (!ownerId) {
        const { data: userData } = await supabase.auth.getUser();
        ownerId = userData.user?.id;
      }
      if (!ownerId) {
        throw new Error('Sesión requerida para subir la foto.');
      }
      resolvedImageUrl = await uploadProductImage(ownerId, draft, productId);
    }
  }

  const updatePayload: {
    name: string;
    price_cents: number;
    description: string | null;
    category: string;
    category_id?: string | null;
    image_url?: string | null;
  } = {
    name: draft.name.trim(),
    price_cents: draft.priceCents,
    description: normalizeDescription(draft.description),
    category: normalizeCategory(draft.category),
  };

  if (draft.categoryId !== undefined) {
    updatePayload.category_id = draft.categoryId;
  }

  if (resolvedImageUrl !== undefined) {
    updatePayload.image_url = resolvedImageUrl;
  }

  const { data, error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', productId)
    .select(PRODUCT_EXTENDED_SELECT)
    .single();

  if (error) {
    if (isMissingExtendedColumnError(error.message)) {
      const fallback = await supabase
        .from('products')
        .update({
          name: draft.name.trim(),
          price_cents: draft.priceCents,
        })
        .eq('id', productId)
        .select(PRODUCT_BASE_SELECT)
        .single();

      if (fallback.error || !fallback.data) {
        throw new Error(fallback.error?.message ?? 'No se pudo actualizar el producto o servicio.');
      }

      return mapProductRow(fallback.data);
    }
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('No se pudo actualizar el producto o servicio.');
  }

  return mapProductRow(data);
}

export async function archiveProduct(productId: string): Promise<void> {
  const { error } = await supabase.from('products').update({ active: false }).eq('id', productId);

  if (error) {
    throw new Error(error.message);
  }
}

export function extractProductCategories(products: readonly PosProduct[]): PosCategorySummary[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const category = normalizeCategory(product.category);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function calculateCartTotalCents(cartItems: readonly PosCartItem[]): number {
  return cartItems.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
}

export function calculateCartUnitsCount(cartItems: readonly PosCartItem[]): number {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0);
}
