// Ambient declarations for TypeScript IDE support in Supabase Edge Functions (Deno runtime).
// Intentionally unreferenced by deno.json so Deno's own type-checker uses its native types.

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  };

  export function serve(handler: (req: Request) => Response | Promise<Response>): unknown;
  export function serve(
    options: Record<string, unknown>,
    handler: (req: Request) => Response | Promise<Response>
  ): unknown;

  export function test(name: string, fn: () => void | Promise<void>): void;
  export function test(options: Record<string, unknown>): void;
}

interface ImportMeta {
  main?: boolean;
}

declare module 'npm:zod@3.24.2' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export interface ZodSchema<T = any> {
    uuid(): ZodSchema<string>;
    trim(): ZodSchema<string>;
    min(length: number): ZodSchema<T>;
    max(length: number): ZodSchema<T>;
    int(): ZodSchema<number>;
    optional(): ZodSchema<T | undefined>;
    strict(): ZodSchema<T>;
    passthrough(): ZodSchema<T>;
    extend(shape: Record<string, ZodSchema>): ZodSchema<T>;
    transform<U>(fn: (data: T) => U): ZodSchema<U>;
    parse(data: unknown): T;
    safeParse(
      data: unknown
    ): { success: true; data: T } | { success: false; error: { issues: unknown[] } };
  }

  export const z: {
    string(): ZodSchema<string>;
    number(): ZodSchema<number>;
    undefined(): ZodSchema<undefined>;
    literal<T extends string | number | boolean>(value: T): ZodSchema<T>;
    enum<const T extends readonly [string, ...string[]]>(values: T): ZodSchema<T[number]>;
    object(shape: Record<string, ZodSchema>): ZodSchema;
    array(item: ZodSchema): ZodSchema;
    union(options: ZodSchema[]): ZodSchema;
    discriminatedUnion(discriminator: string, options: ZodSchema[]): ZodSchema;
  };
}

declare module 'jsr:@std/assert@1' {
  export function assertEquals(actual: unknown, expected: unknown, msg?: string): void;
  export function assertThrows(fn: () => unknown, ...args: unknown[]): unknown;
}

declare module 'npm:@supabase/supabase-js@2' {
  export interface SupabaseError {
    message: string;
    code?: string;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export interface SupabaseQueryResult<T = any> {
    data: T;
    count?: number | null;
    error: SupabaseError | null;
  }

  export interface SupabaseQueryBuilder extends PromiseLike<SupabaseQueryResult> {
    select(columns?: string, options?: Record<string, unknown>): SupabaseQueryBuilder;
    insert(values: unknown): SupabaseQueryBuilder;
    update(values: unknown): SupabaseQueryBuilder;
    eq(column: string, value: unknown): SupabaseQueryBuilder;
    gte(column: string, value: unknown): SupabaseQueryBuilder;
    in(column: string, values: unknown[]): SupabaseQueryBuilder;
    or(filters: string): SupabaseQueryBuilder;
    order(column: string, options?: Record<string, unknown>): SupabaseQueryBuilder;
    limit(count: number): SupabaseQueryBuilder;
    maybeSingle(): PromiseLike<SupabaseQueryResult>;
    single(): PromiseLike<SupabaseQueryResult>;
  }

  export interface SupabaseClient {
    auth: {
      getUser(jwt: string): Promise<{
        data: { user: { id: string; email?: string | null } | null };
        error: SupabaseError | null;
      }>;
    };
    from(table: string): SupabaseQueryBuilder;
    rpc(fn: string, params?: Record<string, unknown>): Promise<SupabaseQueryResult>;
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>
  ): SupabaseClient;
}
