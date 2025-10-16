import type { ProviderDTO } from "../../types";

/**
 * Mock data for providers (Internet Service Providers)
 * Used for testing building associations and filters
 *
 * Note: Actual database schema is simple:
 * - id: number (serial)
 * - name: string (unique)
 * - technology: string (e.g., "Fiber", "DSL", "5G")
 * - bandwidth: number (Mbps)
 */

/**
 * Mock Provider: Orange Polska (Fiber, 1000 Mbps)
 */
export const mockProviderOrange: ProviderDTO = {
  id: 1,
  name: "Orange Polska S.A.",
  technology: "Fiber",
  bandwidth: 1000,
};

/**
 * Mock Provider: T-Mobile (5G, 600 Mbps)
 */
export const mockProviderTMobile: ProviderDTO = {
  id: 2,
  name: "T-Mobile Polska S.A.",
  technology: "5G",
  bandwidth: 600,
};

/**
 * Mock Provider: Play (LTE, 300 Mbps)
 */
export const mockProviderPlay: ProviderDTO = {
  id: 3,
  name: "Play Sp. z o.o.",
  technology: "LTE",
  bandwidth: 300,
};

/**
 * Mock Provider: Netia (DSL, 100 Mbps)
 */
export const mockProviderNetia: ProviderDTO = {
  id: 4,
  name: "Netia S.A.",
  technology: "DSL",
  bandwidth: 100,
};

/**
 * Mock Provider: UPC (Cable, 500 Mbps)
 */
export const mockProviderUPC: ProviderDTO = {
  id: 5,
  name: "UPC Polska Sp. z o.o.",
  technology: "Cable",
  bandwidth: 500,
};

/**
 * Array of all mock providers
 */
export const mockProviders: ProviderDTO[] = [
  mockProviderOrange,
  mockProviderTMobile,
  mockProviderPlay,
  mockProviderNetia,
  mockProviderUPC,
];

/**
 * Array of high-speed providers (>= 500 Mbps)
 */
export const mockHighSpeedProviders: ProviderDTO[] = [mockProviderOrange, mockProviderTMobile, mockProviderUPC];

/**
 * Array of fiber providers
 */
export const mockFiberProviders: ProviderDTO[] = [mockProviderOrange];

/**
 * Generate a mock provider with custom properties
 *
 * @param overrides - Properties to override in the mock provider
 * @returns Mock provider with overridden properties
 */
export function createMockProvider(overrides: Partial<ProviderDTO> = {}): ProviderDTO {
  return {
    id: 999,
    name: "Test Provider",
    technology: "Fiber",
    bandwidth: 1000,
    ...overrides,
  };
}
