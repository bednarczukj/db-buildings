import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuildingService } from '../../lib/services/buildingService';
import type { SupabaseClient, PostgrestResponse } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { BuildingDTO, CreateBuildingInput } from '../../types';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        neq: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
        range: vi.fn(),
        order: vi.fn(() => ({
          range: vi.fn(),
        })),
      })),
      ilike: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(),
        })),
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

describe('BuildingService', () => {
  let service: BuildingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BuildingService(mockSupabase);
  });

  describe('getBuildings', () => {
    it('should fetch buildings with pagination and filters', async () => {
      const mockData: BuildingDTO[] = [
        {
          id: '1',
          voivodeship_code: '14',
          district_code: '1465',
          community_code: '1465011',
          city_code: '0918123',
          building_number: '42A',
          provider_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as BuildingDTO,
      ];
      const mockResponse: PostgrestResponse<BuildingDTO[]> = {
        data: mockData,
        error: null,
        count: 1,
        status: 200,
        statusText: 'OK',
      };

      // Mock filter validations
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { code: '14' },
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { code: '1465' },
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { code: '1465011' },
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { code: '0918123' },
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 1 },
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue(mockResponse),
          }),
        });

      const result = await service.getBuildings({
        page: 1,
        pageSize: 10,
        voivodeship_code: '14',
        district_code: '1465',
        community_code: '1465011',
        city_code: '0918123',
        provider_id: 1,
        status: 'active',
      });

      expect(result).toEqual({
        data: mockData,
        page: 1,
        pageSize: 10,
        total: 1,
      });
    });

    it('should validate filter references exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      await expect(service.getBuildings({
        voivodeship_code: '9999999', // Invalid code
      })).rejects.toThrow('Invalid voivodeship_code: 9999999');
    });

    it('should throw error for page out of range', async () => {
      const mockResponse: PostgrestResponse<BuildingDTO[]> = {
        data: [],
        error: null,
        count: 5, // Total 5 records
        status: 200,
        statusText: 'OK',
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { code: '14' },
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue(mockResponse),
          }),
        });

      await expect(service.getBuildings({
        page: 3, // Page 3 with pageSize 10 would be offset 20, but only 5 records exist
        pageSize: 10,
        voivodeship_code: '14',
      })).rejects.toThrow('Page out of range');
    });

    it('should handle database errors', async () => {
      const mockResponse: PostgrestResponse<BuildingDTO[]> = {
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

      await expect(service.getBuildings({})).rejects.toThrow('Failed to fetch buildings: Database connection failed');
    });
  });

  describe('validateFilterReferences', () => {
    it('should validate all filter references successfully', async () => {
      const mockReferences = [
        { table: 'voivodeships', field: 'code', value: '14' },
        { table: 'districts', field: 'code', value: '1465' },
        { table: 'communities', field: 'code', value: '1465011' },
        { table: 'cities', field: 'code', value: '0918123' },
        { table: 'providers', field: 'id', value: 1 },
      ];

      mockReferences.forEach(({ table, field, value }) => {
        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { [field]: value },
              error: null,
            }),
          }),
        });
      });

      await expect(service['validateFilterReferences']({
        voivodeship_code: '14',
        district_code: '1465',
        community_code: '1465011',
        city_code: '0918123',
        provider_id: 1,
      })).resolves.toBeUndefined();
    });

    it('should throw error for invalid voivodeship code', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      await expect(service['validateFilterReferences']({
        voivodeship_code: '9999999',
      })).rejects.toThrow('Invalid voivodeship_code: 9999999');
    });

    it('should throw error for invalid provider id', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      await expect(service['validateFilterReferences']({
        provider_id: 999,
      })).rejects.toThrow('Invalid provider_id: 999');
    });
  });

  describe('createBuilding', () => {
    const validBuildingData: CreateBuildingInput = {
      voivodeship_code: '14',
      district_code: '1465',
      community_code: '1465011',
      city_code: '0918123',
      city_district_code: '0950001',
      street_code: '10270',
      building_number: '42A',
      post_code: '00-042',
      location: {
        type: 'Point',
        coordinates: [21.0122, 52.2297],
      },
      provider_id: 1,
    };

    it('should create building successfully with all validations', async () => {
      const mockBuilding: BuildingDTO = {
        id: '123',
        ...validBuildingData,
        voivodeship_name: 'Mazowieckie',
        district_name: 'Warszawa',
        community_name: 'Warszawa',
        city_name: 'Warszawa',
        city_district_name: 'Śródmieście',
        street_name: 'Marszałkowska',
        latitude: 52.2297,
        longitude: 21.0122,
        status: 'active',
        created_by: 'user1',
        updated_by: 'user1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock all the reference validations
      const mockReferences = [
        { data: { code: '14', name: 'Mazowieckie' } },
        { data: { code: '1465', name: 'Warszawa' } },
        { data: { code: '1465011', name: 'Warszawa' } },
        { data: { code: '0918123', name: 'Warszawa' } },
        { data: { id: 1 } },
        { data: { code: '0950001', name: 'Śródmieście' } },
        { data: { code: '10270', name: 'Marszałkowska' } },
        { data: null }, // No duplicate
        { data: mockBuilding }, // Created building
      ];

      mockReferences.forEach((response, index) => {
        if (index < 8) { // First 8 are validation queries
          mockSupabase.from.mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: response.data,
                error: null,
              }),
              is: vi.fn().mockReturnThis(),
            }),
          });
        } else { // Last one is insert
          mockSupabase.from.mockReturnValueOnce({
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: response.data,
                  error: null,
                }),
              }),
            }),
          });
        }
      });

      const result = await service.createBuilding(validBuildingData, 'user1');

      expect(result).toEqual(mockBuilding);
    });

    it('should throw error for invalid voivodeship code', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      await expect(service.createBuilding(validBuildingData, 'user1'))
        .rejects.toThrow('Invalid voivodeship_code: 14');
    });

    it('should throw error for duplicate building', async () => {
      // Mock successful validations
      const mockValidations = [
        { data: { code: '14', name: 'Mazowieckie' } },
        { data: { code: '1465', name: 'Warszawa' } },
        { data: { code: '1465011', name: 'Warszawa' } },
        { data: { code: '0918123', name: 'Warszawa' } },
        { data: { id: 1 } },
        { data: { code: '0950001', name: 'Śródmieście' } },
        { data: { code: '10270', name: 'Marszałkowska' } },
        { data: { id: 'existing-id' } }, // Duplicate found
      ];

      mockValidations.forEach((response) => {
        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: response.data,
              error: null,
            }),
            is: vi.fn().mockReturnThis(),
          }),
        });
      });

      await expect(service.createBuilding(validBuildingData, 'user1'))
        .rejects.toThrow('Building already exists');
    });

    it('should handle buildings without street code', async () => {
      const ruralBuildingData: CreateBuildingInput = {
        voivodeship_code: '14',
        district_code: '1417',
        community_code: '1417052',
        city_code: '0674922',
        building_number: '15',
        post_code: '00-042',
        location: {
          type: 'Point',
          coordinates: [21.0122, 52.2297],
        },
        provider_id: 1,
      };

      const mockBuilding: BuildingDTO = {
        id: '123',
        ...ruralBuildingData,
        voivodeship_name: 'Mazowieckie',
        district_name: 'Warszawa',
        community_name: 'Warszawa',
        city_name: 'Warszawa',
        latitude: 52.2297,
        longitude: 21.0122,
        status: 'active',
        created_by: 'user1',
        updated_by: 'user1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock validations (without street and city district)
      const mockValidations = [
        { data: { code: '14', name: 'Mazowieckie' } },
        { data: { code: '1417', name: 'Warszawa' } },
        { data: { code: '1417052', name: 'Warszawa' } },
        { data: { code: '0674922', name: 'Warszawa' } },
        { data: { id: 1 } },
        { data: null }, // No duplicate
        { data: mockBuilding }, // Created building
      ];

      mockValidations.forEach((response, index) => {
        if (index < 6) { // First 6 are validation queries
          mockSupabase.from.mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: response.data,
                error: null,
              }),
              is: vi.fn().mockReturnThis(),
            }),
          });
        } else { // Last one is insert
          mockSupabase.from.mockReturnValueOnce({
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: response.data,
                  error: null,
                }),
              }),
            }),
          });
        }
      });

      const result = await service.createBuilding(ruralBuildingData, 'user1');

      expect(result.street_code).toBeUndefined();
      expect(result.city_district_code).toBeUndefined();
    });
  });

  describe('getById', () => {
    it('should return building by ID', async () => {
      const mockBuilding: BuildingDTO = {
        id: '123',
        voivodeship_code: '14',
        building_number: '42A',
        provider_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as BuildingDTO;

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockBuilding,
            error: null,
          }),
        }),
      });

      const result = await service.getById('123');

      expect(result).toEqual(mockBuilding);
    });

    it('should throw error for non-existent building', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      await expect(service.getById('non-existent')).rejects.toThrow('Building not found');
    });
  });

  describe('updateBuilding', () => {
    const updateData: CreateBuildingInput = {
      voivodeship_code: '14',
      district_code: '1465',
      community_code: '1465011',
      city_code: '0918123',
      building_number: '42B', // Changed
      post_code: '00-042',
      location: {
        type: 'Point',
        coordinates: [21.0122, 52.2297],
      },
      provider_id: 1,
    };

    it('should update building successfully', async () => {
      const existingBuilding: BuildingDTO = {
        id: '123',
        voivodeship_code: '12', // Different from update
        district_code: '1465',
        community_code: '1465011',
        city_code: '0918123',
        building_number: '42A', // Will be changed
        provider_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as BuildingDTO;

      // Mock getById
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingBuilding,
            error: null,
          }),
        }),
      });

      // Mock voivodeship validation (changed)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { code: '14', name: 'Mazowieckie' },
            error: null,
          }),
        }),
      });

      // Mock duplicate check (no duplicate)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      // Mock update
      const updatedBuilding = { ...existingBuilding, voivodeship_code: '14', building_number: '42B' };
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: updatedBuilding,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.updateBuilding('123', updateData, 'user2');

      expect(result.voivodeship_code).toBe('14');
      expect(result.building_number).toBe('42B');
    });

    it('should throw error for non-existent building', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      await expect(service.updateBuilding('non-existent', updateData, 'user1'))
        .rejects.toThrow('Building not found');
    });

    it('should throw error for invalid new voivodeship code', async () => {
      const existingBuilding: BuildingDTO = {
        id: '123',
        voivodeship_code: '12',
        district_code: '1465',
        community_code: '1465011',
        city_code: '0918123',
        building_number: '42A',
        provider_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as BuildingDTO;

      // Mock getById
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingBuilding,
            error: null,
          }),
        }),
      });

      // Mock invalid voivodeship validation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } as any,
          }),
        }),
      });

      await expect(service.updateBuilding('123', updateData, 'user1'))
        .rejects.toThrow('Invalid voivodeship_code: 14');
    });

    it('should handle partial updates correctly', async () => {
      const existingBuilding: BuildingDTO = {
        id: '123',
        voivodeship_code: '14',
        district_code: '1465',
        community_code: '1465011',
        city_code: '0918123',
        building_number: '42A',
        provider_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as BuildingDTO;

      const partialUpdate = {
        building_number: '42C',
        post_code: '00-043',
      };

      // Mock getById
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingBuilding,
            error: null,
          }),
        }),
      });

      // Mock duplicate check (no duplicate since no key fields changed significantly)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      // Mock update
      const updatedBuilding = { ...existingBuilding, building_number: '42C', post_code: '00-043' };
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: updatedBuilding,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.updateBuilding('123', partialUpdate as CreateBuildingInput, 'user2');

      expect(result.building_number).toBe('42C');
      expect(result.post_code).toBe('00-043');
      // Other fields unchanged
      expect(result.voivodeship_code).toBe('14');
    });
  });
});
