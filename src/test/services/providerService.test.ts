import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderService } from '../../lib/services/providerService';
import type { SupabaseClient, PostgrestResponse } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { ProviderDTO, CreateProviderInput, UpdateProviderInput } from '../../types';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        neq: vi.fn(() => ({
          single: vi.fn(),
        })),
        limit: vi.fn(),
        range: vi.fn(),
        order: vi.fn(() => ({
          range: vi.fn(),
        })),
      })),
      ilike: vi.fn(() => ({
        range: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
} as unknown as SupabaseClient<Database>;

describe('ProviderService', () => {
  let service: ProviderService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProviderService(mockSupabase);
  });

  describe('getProviders', () => {
    it('should fetch providers with pagination and filters', async () => {
      const mockData: ProviderDTO[] = [
        {
          id: 1,
          name: 'Provider A',
          technology: 'Fiber',
          bandwidth: 100,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as ProviderDTO,
      ];
      const mockResponse: PostgrestResponse<ProviderDTO[]> = {
        data: mockData,
        error: null,
        count: 1,
        status: 200,
        statusText: 'OK',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue(mockResponse),
        }),
      });

      const result = await service.getProviders({
        page: 1,
        pageSize: 10,
        search: 'Provider',
        technology: 'Fiber',
      });

      expect(result).toEqual({
        data: mockData,
        page: 1,
        pageSize: 10,
        total: 1,
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('providers');
    });

    it('should handle search filter', async () => {
      const mockResponse: PostgrestResponse<ProviderDTO[]> = {
        data: [],
        error: null,
        count: 0,
        status: 200,
        statusText: 'OK',
      };

      const mockQuery = {
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue(mockResponse),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await service.getProviders({
        search: 'test provider',
      });

      expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%test provider%');
    });

    it('should handle technology filter', async () => {
      const mockResponse: PostgrestResponse<ProviderDTO[]> = {
        data: [],
        error: null,
        count: 0,
        status: 200,
        statusText: 'OK',
      };

      const mockQuery = {
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue(mockResponse),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await service.getProviders({
        technology: 'DSL',
      });

      expect(mockQuery.ilike).toHaveBeenCalledWith('technology', '%DSL%');
    });

    it('should throw error for page out of range', async () => {
      const mockResponse: PostgrestResponse<ProviderDTO[]> = {
        data: [],
        error: null,
        count: 3, // Total 3 records
        status: 200,
        statusText: 'OK',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue(mockResponse),
        }),
      });

      await expect(service.getProviders({
        page: 3, // Page 3 with pageSize 10 would be offset 20, but only 3 records exist
        pageSize: 10,
      })).rejects.toThrow('Page out of range');
    });

    it('should handle database errors', async () => {
      const mockResponse: PostgrestResponse<ProviderDTO[]> = {
        data: null,
        error: { message: 'Database connection failed' } as any,
        count: null,
        status: 500,
        statusText: 'Internal Server Error',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue(mockResponse),
        }),
      });

      await expect(service.getProviders({})).rejects.toThrow('Failed to fetch providers: Database connection failed');
    });
  });

  describe('createProvider', () => {
    const validProviderData: CreateProviderInput = {
      name: 'New Provider',
      technology: 'Fiber',
      bandwidth: 1000,
    };

    it('should create provider successfully', async () => {
      const mockProvider: ProviderDTO = {
        id: 1,
        ...validProviderData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock duplicate check (no duplicate)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any, // No rows returned
          }),
        }),
      });

      // Mock insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProvider,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.createProvider(validProviderData, 'user1');

      expect(result).toEqual(mockProvider);
    });

    it('should throw error for duplicate provider name', async () => {
      // Mock duplicate check (duplicate found)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 1 },
            error: null,
          }),
        }),
      });

      await expect(service.createProvider(validProviderData, 'user1'))
        .rejects.toThrow('Provider with this name already exists');
    });

    it('should handle database unique constraint violation', async () => {
      // Mock duplicate check (no duplicate)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      // Mock insert with unique constraint violation
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '23505' } as any, // unique_violation
            }),
          }),
        }),
      });

      await expect(service.createProvider(validProviderData, 'user1'))
        .rejects.toThrow('Provider with this name already exists');
    });

    it('should handle other database errors during creation', async () => {
      // Mock duplicate check (no duplicate)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      // Mock insert with other error
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' } as any,
            }),
          }),
        }),
      });

      await expect(service.createProvider(validProviderData, 'user1'))
        .rejects.toThrow('Failed to create provider: Insert failed');
    });
  });

  describe('getById', () => {
    it('should return provider by ID', async () => {
      const mockProvider: ProviderDTO = {
        id: 1,
        name: 'Provider A',
        technology: 'Fiber',
        bandwidth: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockProvider,
            error: null,
          }),
        }),
      });

      const result = await service.getById(1);

      expect(result).toEqual(mockProvider);
    });

    it('should throw error for non-existent provider', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      await expect(service.getById(999)).rejects.toThrow('Provider not found');
    });
  });

  describe('updateProvider', () => {
    const updateData: UpdateProviderInput = {
      name: 'Updated Provider',
      technology: 'DSL',
      bandwidth: 50,
    };

    it('should update provider successfully', async () => {
      const existingProvider: ProviderDTO = {
        id: 1,
        name: 'Old Provider',
        technology: 'Fiber',
        bandwidth: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock getById
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingProvider,
            error: null,
          }),
        }),
      });

      // Mock name conflict check (no conflict)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      // Mock update
      const updatedProvider = { ...existingProvider, ...updateData };
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: updatedProvider,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.updateProvider(1, updateData, 'user2');

      expect(result.name).toBe('Updated Provider');
      expect(result.technology).toBe('DSL');
      expect(result.bandwidth).toBe(50);
    });

    it('should throw error for name conflict', async () => {
      const existingProvider: ProviderDTO = {
        id: 1,
        name: 'Old Provider',
        technology: 'Fiber',
        bandwidth: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock getById
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingProvider,
            error: null,
          }),
        }),
      });

      // Mock name conflict check (conflict found)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 2 },
            error: null,
          }),
        }),
      });

      await expect(service.updateProvider(1, { name: 'Conflicting Name' }, 'user1'))
        .rejects.toThrow('Provider with this name already exists');
    });

    it('should handle partial updates', async () => {
      const existingProvider: ProviderDTO = {
        id: 1,
        name: 'Provider A',
        technology: 'Fiber',
        bandwidth: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const partialUpdate = { bandwidth: 200 };

      // Mock getById
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingProvider,
            error: null,
          }),
        }),
      });

      // Mock update (no name conflict check since name not updated)
      const updatedProvider = { ...existingProvider, bandwidth: 200 };
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: updatedProvider,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.updateProvider(1, partialUpdate, 'user2');

      expect(result.bandwidth).toBe(200);
      expect(result.name).toBe('Provider A'); // Unchanged
    });

    it('should handle database unique constraint violation', async () => {
      const existingProvider: ProviderDTO = {
        id: 1,
        name: 'Old Provider',
        technology: 'Fiber',
        bandwidth: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock getById
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingProvider,
            error: null,
          }),
        }),
      });

      // Mock name conflict check (no conflict)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      // Mock update with unique constraint violation
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '23505' } as any, // unique_violation
            }),
          }),
        }),
      });

      await expect(service.updateProvider(1, updateData, 'user1'))
        .rejects.toThrow('Provider with this name already exists');
    });
  });

  describe('deleteProvider', () => {
    it('should delete provider successfully', async () => {
      const existingProvider: ProviderDTO = {
        id: 1,
        name: 'Provider A',
        technology: 'Fiber',
        bandwidth: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock getById
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingProvider,
            error: null,
          }),
        }),
      });

      // Mock usage check (no buildings using this provider)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      // Mock delete
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      await expect(service.deleteProvider(1, 'user1')).resolves.toBeUndefined();
    });

    it('should throw error when provider is referenced by buildings', async () => {
      const existingProvider: ProviderDTO = {
        id: 1,
        name: 'Provider A',
        technology: 'Fiber',
        bandwidth: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock getById
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingProvider,
            error: null,
          }),
        }),
      });

      // Mock usage check (buildings found)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ id: 'building-1' }],
            error: null,
          }),
        }),
      });

      await expect(service.deleteProvider(1, 'user1'))
        .rejects.toThrow('Cannot delete provider that is referenced by buildings');
    });

    it('should throw error for non-existent provider', async () => {
      // Mock getById (provider not found)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      await expect(service.deleteProvider(999, 'user1')).rejects.toThrow('Provider not found');
    });
  });
});
