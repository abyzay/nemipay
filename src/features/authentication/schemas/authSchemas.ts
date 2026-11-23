import { z } from 'zod';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidMexicanPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10;
}

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Ingresa tu celular o correo electrónico.')
    .refine(
      (value) => isValidEmail(value) || isValidMexicanPhone(value),
      'Ingresa un correo electrónico válido o un celular de 10 dígitos.'
    ),
  password: z
    .string()
    .min(1, 'Ingresa tu contraseña.')
    .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Ingresa tu nombre completo.')
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .refine(
      (value) => value.split(/\s+/).filter(Boolean).length >= 2,
      'Ingresa tu nombre y apellido.'
    ),
  phone: z
    .string()
    .trim()
    .min(1, 'Ingresa tu número de celular.')
    .refine(isValidMexicanPhone, 'Ingresa un número de celular válido de 10 dígitos.'),
  email: z
    .string()
    .trim()
    .min(1, 'Ingresa tu correo electrónico.')
    .refine(isValidEmail, 'Ingresa un correo electrónico válido.'),
  password: z
    .string()
    .min(1, 'Crea una contraseña.')
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .refine(
      (value) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(value) && /\d/.test(value),
      'Incluye al menos una letra y un número.'
    ),
  acceptTerms: z
    .boolean()
    .refine((value) => value === true, 'Debes aceptar los Términos y el Aviso de privacidad.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
