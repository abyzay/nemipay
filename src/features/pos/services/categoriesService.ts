import { supabase } from '@/services/supabase';
import type { PosCategory, PosCategoryDraft } from '../types';
import { uploadPosImageToStorage } from './imageUploadService';

const CATEGORY_SELECT = 'id, name, description, image_url';

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

function mapCategoryRow(row: CategoryRow): PosCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    imageUrl: row.image_url ?? null,
  };
}

function normalizeDescription(description?: string | null): string | null {
  const trimmed = description?.trim() ?? '';
  return trimmed.length > 0 ? trimmed.slice(0, 160) : null;
}

export async function fetchActiveCategories(): Promise<PosCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_SELECT)
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapCategoryRow(row));
}

export async function createCategory(
  merchantId: string,
  draft: PosCategoryDraft
): Promise<PosCategory> {
  const uploadedImageUrl = await uploadPosImageToStorage(merchantId, 'categories', draft);

  const { data, error } = await supabase
    .from('categories')
    .insert({
      merchant_id: merchantId,
      name: draft.name.trim(),
      description: normalizeDescription(draft.description),
      image_url: uploadedImageUrl,
      active: true,
    })
    .select(CATEGORY_SELECT)
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      throw new Error('Ya existe una categoría activa con ese nombre.');
    }
    throw new Error(error?.message ?? 'No se pudo crear la categoría.');
  }

  return mapCategoryRow(data);
}

export async function updateCategory(
  categoryId: string,
  draft: PosCategoryDraft,
  merchantId?: string
): Promise<PosCategory> {
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
      resolvedImageUrl = await uploadPosImageToStorage(ownerId, 'categories', draft, categoryId);
    }
  }

  const trimmedName = draft.name.trim();
  const updatePayload: {
    name: string;
    description: string | null;
    image_url?: string | null;
  } = {
    name: trimmedName,
    description: normalizeDescription(draft.description),
  };

  if (resolvedImageUrl !== undefined) {
    updatePayload.image_url = resolvedImageUrl;
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updatePayload)
    .eq('id', categoryId)
    .select(CATEGORY_SELECT)
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      throw new Error('Ya existe una categoría activa con ese nombre.');
    }
    throw new Error(error?.message ?? 'No se pudo actualizar la categoría.');
  }

  // Mantener sincronizado el texto de categoría en productos vinculados
  await supabase.from('products').update({ category: trimmedName }).eq('category_id', categoryId);

  return mapCategoryRow(data);
}

export async function archiveCategory(categoryId: string): Promise<void> {
  await supabase
    .from('products')
    .update({ category_id: null, category: 'General' })
    .eq('category_id', categoryId);

  const { error } = await supabase
    .from('categories')
    .update({ active: false })
    .eq('id', categoryId);

  if (error) {
    throw new Error(error.message);
  }
}
