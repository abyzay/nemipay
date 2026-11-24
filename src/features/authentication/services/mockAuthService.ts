import mockUsersData from '../data/mockUsers.json';
import type { AuthUser } from '../types';

interface MockUserRecord extends AuthUser {
  password: string;
}

export type MockLoginResult =
  { success: true; user: AuthUser } | { success: false; errorMessage: string };

/**
 * Valida las credenciales contra el archivo JSON local de usuarios ficticios.
 * Solo para prototipo previo a la integración del backend.
 */
export function authenticateWithMockJson(identifier: string, password: string): MockLoginResult {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const normalizedDigits = identifier.replace(/\D/g, '');
  const records = mockUsersData.users as MockUserRecord[];

  const matchedRecord = records.find(
    (record) =>
      record.username.toLowerCase() === normalizedIdentifier ||
      record.email.toLowerCase() === normalizedIdentifier ||
      (normalizedDigits.length === 10 && record.phone === normalizedDigits)
  );

  if (!matchedRecord || matchedRecord.password !== password) {
    return {
      success: false,
      errorMessage: 'Usuario o contraseña incorrectos. Verifica tus credenciales.',
    };
  }

  const { password: _password, ...safeUser } = matchedRecord;
  return {
    success: true,
    user: safeUser,
  };
}
