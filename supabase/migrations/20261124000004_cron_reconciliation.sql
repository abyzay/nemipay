-- NemiPay: extensiones para Cron de reconciliación y helper para programar el job con Vault

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Función auxiliar que lee `reconcile_charges_url` y `cron_secret` desde Vault
-- y ejecuta net.http_post hacia la Edge Function reconcile-charges.
create or replace function public.trigger_reconcile_charges()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
  v_request_id bigint;
begin
  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'reconcile_charges_url'
  limit 1;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'cron_secret'
  limit 1;

  if v_url is null or v_secret is null then
    return null;
  end if;

  select net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := '{}'::jsonb
  ) into v_request_id;

  return v_request_id;
end;
$$;

revoke execute on function public.trigger_reconcile_charges() from public, anon, authenticated;

-- Programa el job cada 30 segundos (o cada minuto si el proveedor no permite segundos).
-- En Supabase Cloud, crea antes los secretos en Vault:
--   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/reconcile-charges', 'reconcile_charges_url');
--   select vault.create_secret('<CRON_SECRET>', 'cron_secret');
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'nemipay-reconcile-charges';

    begin
      perform cron.schedule(
        'nemipay-reconcile-charges',
        '30 seconds',
        'select public.trigger_reconcile_charges();'
      );
    exception when others then
      perform cron.schedule(
        'nemipay-reconcile-charges',
        '* * * * *',
        'select public.trigger_reconcile_charges();'
      );
    end;
  end if;
end;
$$;
