/**
 * Script para crear/actualizar la cuenta demo de NemiPay, sus 4 categorías de taquería
 * y 10 productos de taquería en Supabase.
 *
 * Uso (con variables de entorno locales, nunca en EXPO_PUBLIC_*):
 *   npx tsx scripts/seed-demo.ts
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

interface SeedCategory {
  name: string;
  description: string;
}

interface SeedProduct {
  name: string;
  price_cents: number;
  category: string;
  description: string;
}

const TAQUERIA_CATEGORIES: readonly SeedCategory[] = [
  {
    name: 'Tacos',
    description: 'Tacos al carbón y a la plancha recién hechos',
  },
  {
    name: 'Bebidas',
    description: 'Refrescos bien fríos y aguas frescas del día',
  },
  {
    name: 'Antojitos',
    description: 'Quesadillas, tostadas y gringas al momento',
  },
  {
    name: 'Postres',
    description: 'Dulces tradicionales para cerrar tu comida',
  },
];

const TAQUERIA_PRODUCTS: readonly SeedProduct[] = [
  {
    name: 'Tacos de bistec',
    price_cents: 2800,
    category: 'Tacos',
    description: 'Bistec asado al carbón en tortilla caliente',
  },
  {
    name: 'Tacos al pastor',
    price_cents: 2500,
    category: 'Tacos',
    description: 'Pastor con piña asada, cilantro y cebolla',
  },
  {
    name: 'Tacos de suadero',
    price_cents: 2600,
    category: 'Tacos',
    description: 'Suadero doradito con salsa verde o roja',
  },
  {
    name: 'Tacos de chorizo',
    price_cents: 2500,
    category: 'Tacos',
    description: 'Chorizo artesanal con cebolla caramelizada',
  },
  {
    name: 'Quesadilla',
    price_cents: 3500,
    category: 'Antojitos',
    description: 'Tortilla recién hecha con queso Oaxaca fundido',
  },
  {
    name: 'Tostadas',
    price_cents: 3000,
    category: 'Antojitos',
    description: 'Tostada crujiente preparada al gusto',
  },
  {
    name: 'Gringa al pastor',
    price_cents: 5500,
    category: 'Antojitos',
    description: 'Doble tortilla de harina con queso y pastor',
  },
  {
    name: 'Refresco',
    price_cents: 2200,
    category: 'Bebidas',
    description: 'Refresco bien frío en botella de 355 ml',
  },
  {
    name: 'Agua de horchata',
    price_cents: 2500,
    category: 'Bebidas',
    description: 'Vaso grande de 500 ml con canela',
  },
  {
    name: 'Flan napolitano',
    price_cents: 3500,
    category: 'Postres',
    description: 'Rebanada casera con caramelo suave',
  },
];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta variable de entorno requerida: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const demoEmail = requireEnv('DEMO_EMAIL');
  const demoPassword = requireEnv('DEMO_PASSWORD');
  const merchantName = process.env.DEMO_MERCHANT_NAME?.trim() || 'Taquería Demo NemiPay';

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: usersList, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (listError) {
    throw new Error(`Error listando usuarios: ${listError.message}`);
  }

  let userId = usersList.users.find((u) => u.email?.toLowerCase() === demoEmail.toLowerCase())?.id;

  if (!userId) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        merchant_name: merchantName,
      },
    });

    if (createError || !created.user) {
      throw new Error(`Error creando usuario demo: ${createError?.message ?? 'desconocido'}`);
    }

    userId = created.user.id;
    console.log(`Usuario demo creado: ${demoEmail} (${userId})`);
  } else {
    console.log(`Usuario demo ya existe: ${demoEmail} (${userId})`);
  }

  const { error: merchantError } = await supabase.from('merchants').upsert(
    {
      id: userId,
      name: merchantName,
    },
    { onConflict: 'id' }
  );

  if (merchantError) {
    throw new Error(`Error guardando merchant: ${merchantError.message}`);
  }

  const { data: existingCategories, error: catFetchError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('merchant_id', userId)
    .eq('active', true);

  if (catFetchError) {
    throw new Error(`Error consultando categorías: ${catFetchError.message}`);
  }

  const categoryIdByName = new Map<string, string>();
  for (const cat of existingCategories ?? []) {
    categoryIdByName.set(cat.name.trim().toLowerCase(), cat.id);
  }

  const missingCategories = TAQUERIA_CATEGORIES.filter(
    (cat) => !categoryIdByName.has(cat.name.toLowerCase())
  );

  if (missingCategories.length > 0) {
    const { data: insertedCategories, error: catInsertError } = await supabase
      .from('categories')
      .insert(
        missingCategories.map((cat) => ({
          merchant_id: userId,
          name: cat.name,
          description: cat.description,
          active: true,
        }))
      )
      .select('id, name');

    if (catInsertError) {
      throw new Error(`Error sembrando categorías: ${catInsertError.message}`);
    }

    for (const cat of insertedCategories ?? []) {
      categoryIdByName.set(cat.name.trim().toLowerCase(), cat.id);
    }
    console.log(`Sembradas ${missingCategories.length} categorías de taquería.`);
  } else {
    console.log('Las 4 categorías de taquería ya existían.');
  }

  const { data: existingProducts, error: productsError } = await supabase
    .from('products')
    .select('id, name')
    .eq('merchant_id', userId)
    .eq('active', true);

  if (productsError) {
    throw new Error(`Error consultando productos: ${productsError.message}`);
  }

  const existingByName = new Map<string, string>();
  for (const prod of existingProducts ?? []) {
    existingByName.set(prod.name.trim().toLowerCase(), prod.id);
  }

  const missingProducts = TAQUERIA_PRODUCTS.filter(
    (item) => !existingByName.has(item.name.toLowerCase())
  );

  if (missingProducts.length > 0) {
    const { error: insertError } = await supabase.from('products').insert(
      missingProducts.map((item) => ({
        merchant_id: userId,
        name: item.name,
        price_cents: item.price_cents,
        category: item.category,
        category_id: categoryIdByName.get(item.category.toLowerCase()) ?? null,
        description: item.description,
        active: true,
      }))
    );

    if (insertError) {
      throw new Error(`Error sembrando productos: ${insertError.message}`);
    }

    console.log(`Sembrados ${missingProducts.length} productos de taquería.`);
  } else {
    console.log('Los 10 productos de taquería ya existían.');
  }

  console.log('Seed taquería completado.');
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
