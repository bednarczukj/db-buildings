import { describe, it, expect } from 'vitest';
import { buildingFormSchema } from '../lib/schemas/buildingFormSchemas';

describe('Temp Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should import schema', () => {
    expect(buildingFormSchema).toBeDefined();
  });
});
