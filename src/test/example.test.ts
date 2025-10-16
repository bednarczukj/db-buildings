/**
 * Example unit test for Vitest
 * Demonstrates basic test patterns and best practices
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Example Unit Tests', () => {
  describe('Basic Assertions', () => {
    it('should perform basic equality checks', () => {
      expect(2 + 2).toBe(4);
      expect('hello').toBe('hello');
      expect(true).toBe(true);
    });

    it('should check object equality', () => {
      const user = { name: 'John', age: 30 };
      expect(user).toEqual({ name: 'John', age: 30 });
    });

    it('should check array contents', () => {
      const numbers = [1, 2, 3, 4, 5];
      expect(numbers).toHaveLength(5);
      expect(numbers).toContain(3);
    });
  });

  describe('Mocking Functions', () => {
    it('should mock a function', () => {
      const mockFn = vi.fn();
      mockFn('test');
      
      expect(mockFn).toHaveBeenCalled();
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should mock function return values', () => {
      const mockFn = vi.fn().mockReturnValue(42);
      
      const result = mockFn();
      
      expect(result).toBe(42);
    });

    it('should mock async functions', async () => {
      const mockAsyncFn = vi.fn().mockResolvedValue('success');
      
      const result = await mockAsyncFn();
      
      expect(result).toBe('success');
    });
  });

  describe('Testing with Setup', () => {
    let counter: number;

    beforeEach(() => {
      counter = 0;
    });

    it('should start with counter at 0', () => {
      expect(counter).toBe(0);
    });

    it('should increment counter', () => {
      counter++;
      expect(counter).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should test thrown errors', () => {
      const throwError = () => {
        throw new Error('Test error');
      };

      expect(throwError).toThrow('Test error');
    });

    it('should test async rejections', async () => {
      const rejectPromise = () => Promise.reject(new Error('Async error'));

      await expect(rejectPromise()).rejects.toThrow('Async error');
    });
  });
});

