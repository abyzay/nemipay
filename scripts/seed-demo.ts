/**
 * Script local para crear la cuenta demo de NemiPay, su comercio y productos/servicios de ejemplo.
 *
 * Uso (con variables de entorno locales, nunca en EXPO_PUBLIC_*):
 *   npx tsx scripts/seed-demo.ts
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

const SAMPLE_PRODUCTS: ReadonlyArray<{ name: string; price_cents: number }> = [
  { name: 'Agua natural 600ml', price_cents: 1500 },
  { name: 'Refresco 600ml', price_cents: 2200 },
  { name: 'Orden de fruta picada', price_cents: 4500 },
  { name: 'Café americano', price_cents: 3500 },
  { name: 'Corte básico', price_cents: 12000 },
  { name: 'Servicio express', price_cents: 8000 },
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
  const merchantName = process.env.DEMO_MERCHANT_NAME?.trim() || 'Puesto Demo NemiPay';

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

  const { data: existingProducts, error: productsError } = await supabase
    .from('products')
    .select('id, name')
    .eq('merchant_id', userId)
    .eq('active', true);

  if (productsError) {
    throw new Error(`Error consultando productos: ${productsError.message}`);
  }

  if (!existingProducts || existingProducts.length === 0) {
    const { error: insertError } = await supabase.from('products').insert(
      SAMPLE_PRODUCTS.map((item) => ({
        merchant_id: userId,
        name: item.name,
        price_cents: item.price_cents,
        active: true,
      }))
    );

    if (insertError) {
      throw new Error(`Error sembrando productos: ${insertError.message}`);
    }

    console.log(`Sembrados ${SAMPLE_PRODUCTS.length} productos/servicios de ejemplo.`);
  } else {
    console.log(`El comercio ya tiene ${existingProducts.length} productos activos; sin cambios.`);
  }

  console.log('Seed demo completado.');
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
