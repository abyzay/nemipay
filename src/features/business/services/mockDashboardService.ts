import mockDashboard from '../data/mockDashboard.json';
import type { DashboardData } from '../types';

/**
 * Obtiene el resumen del comercio desde datos locales en JSON.
 * En etapas posteriores se conectará con el backend mediante TanStack Query.
 */
export function getMockDashboardData(): DashboardData {
  return mockDashboard as DashboardData;
}
