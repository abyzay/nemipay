import { supabase } from '@/services/supabase';
import type { PosCartItem, PosProduct, PosProductDraft, PosTemplateOption } from '../types';

export const POS_TEMPLATES: readonly PosTemplateOption[] = [
  {
    id: 'tienda',
    label: 'Tienda',
    items: [
      { name: 'Agua 600ml', priceCents: 1500 },
      { name: 'Refresco 600ml', priceCents: 2200 },
      { name: 'Pan dulce', priceCents: 1800 },
      { name: 'Leche 1L', priceCents: 2800 },
    ],
  },
  {
    id: 'taqueria',
    label: 'Taquería',
    items: [
      { name: 'Orden sencilla', priceCents: 6500 },
      { name: 'Orden especial', priceCents: 8500 },
      { name: 'Agua fresca', priceCents: 2500 },
      { name: 'Refresco', priceCents: 2200 },
    ],
  },
  {
    id: 'fruteria',
    label: 'Frutería',
    items: [
      { name: 'Vaso chico', priceCents: 3500 },
      { name: 'Vaso grande', priceCents: 5000 },
      { name: 'Charola preparada', priceCents: 7500 },
      { name: 'Jugo natural 500ml', priceCents: 4000 },
    ],
  },
  {
    id: 'peluqueria',
    label: 'Peluquería',
    items: [
      { name: 'Corte básico', priceCents: 12000 },
      { name: 'Corte y barba', priceCents: 18000 },
      { name: 'Afeitado', priceCents: 9000 },
      { name: 'Peinado', priceCents: 15000 },
    ],
  },
];

export async function fetchActiveProducts(): Promise<PosProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price_cents')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
  }));
}

export async function createProduct(
  merchantId: string,
  draft: PosProductDraft
): Promise<PosProduct> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      merchant_id: merchantId,
      name: draft.name.trim(),
      price_cents: draft.priceCents,
      active: true,
    })
    .select('id, name, price_cents')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo guardar el producto o servicio.');
  }

  return {
    id: data.id,
    name: data.name,
    priceCents: data.price_cents,
  };
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
        active: true,
      }))
    )
    .select('id, name, price_cents');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
  }));
}

export async function updateProduct(
  productId: string,
  draft: PosProductDraft
): Promise<PosProduct> {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: draft.name.trim(),
      price_cents: draft.priceCents,
    })
    .eq('id', productId)
    .select('id, name, price_cents')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo actualizar el producto o servicio.');
  }

  return {
    id: data.id,
    name: data.name,
    priceCents: data.price_cents,
  };
}

export async function archiveProduct(productId: string): Promise<void> {
  const { error } = await supabase.from('products').update({ active: false }).eq('id', productId);

  if (error) {
    throw new Error(error.message);
  }
}

export function calculateCartTotalCents(cartItems: readonly PosCartItem[]): number {
  return cartItems.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
}

export function calculateCartUnitsCount(cartItems: readonly PosCartItem[]): number {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0);
}
