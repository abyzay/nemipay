import mockMovements from '../data/mockMovements.json';
import type { ReceivedMovement } from '../types';

/**
 * Devuelve los cobros recibidos ficticios desde JSON.
 */
export function getMockMovements(): ReceivedMovement[] {
  return mockMovements.movements as ReceivedMovement[];
}

/**
 * Devuelve únicamente los últimos N movimientos para el resumen del Dashboard.
 */
export function getRecentMockMovements(limit = 3): ReceivedMovement[] {
  return getMockMovements().slice(0, limit);
}
