import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateArrayPartial, validateDataOrFallback, validateDataOrThrow } from '../validation';
import { z } from 'zod';

// Mock console methods
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

describe('validateArrayPartial', () => {
  const ItemSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    score: z.number().min(0).max(100),
  });

  it('should return empty array if input is not an array', () => {
    const result = validateArrayPartial(ItemSchema, 'not an array', {
      context: 'test',
      logErrors: false,
    });

    expect(result).toEqual([]);
  });

  it('should return empty array if entire response is invalid (null)', () => {
    const result = validateArrayPartial(ItemSchema, null, {
      context: 'test',
      logErrors: false,
    });

    expect(result).toEqual([]);
  });

  it('should return empty array if entire response is invalid (undefined)', () => {
    const result = validateArrayPartial(ItemSchema, undefined, {
      context: 'test',
      logErrors: false,
    });

    expect(result).toEqual([]);
  });

  it('should return all valid items', () => {
    const data = [
      { id: '1', name: 'Item 1', score: 85 },
      { id: '2', name: 'Item 2', score: 92 },
      { id: '3', name: 'Item 3', score: 78 },
    ];

    const result = validateArrayPartial(ItemSchema, data, {
      context: 'test',
      logErrors: false,
    });

    expect(result).toHaveLength(3);
    expect(result).toEqual(data);
  });

  it('should filter out invalid elements and return only valid ones', () => {
    const data = [
      { id: '1', name: 'Valid Item 1', score: 85 },
      { id: '', name: 'Invalid: empty id', score: 90 }, // Invalid: empty id
      { id: '3', name: 'Valid Item 3', score: 78 },
      { id: '4', name: '', score: 88 }, // Invalid: empty name
      { id: '5', name: 'Valid Item 5', score: 95 },
      { id: '6', name: 'Invalid score', score: 150 }, // Invalid: score > 100
    ];

    const result = validateArrayPartial(ItemSchema, data, {
      context: 'test',
      logErrors: false,
    });

    // Should return only the 3 valid items
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('3');
    expect(result[2].id).toBe('5');
  });

  it('should log warnings for filtered elements in development mode', () => {
    const data = [
      { id: '1', name: 'Valid', score: 85 },
      { id: '', name: 'Invalid', score: 90 }, // Invalid
    ];

    validateArrayPartial(ItemSchema, data, {
      context: 'test-context',
      logErrors: true,
    });

    // Should log warning for the invalid element
    expect(console.warn).toHaveBeenCalled();
  });

  it('should return empty array if all elements are invalid', () => {
    const data = [
      { id: '', name: 'Invalid 1', score: 90 },
      { id: '', name: 'Invalid 2', score: 95 },
    ];

    const result = validateArrayPartial(ItemSchema, data, {
      context: 'test',
      logErrors: false,
    });

    expect(result).toEqual([]);
  });

  it('should handle empty array', () => {
    const result = validateArrayPartial(ItemSchema, [], {
      context: 'test',
      logErrors: false,
    });

    expect(result).toEqual([]);
  });
});

describe('validateDataOrFallback', () => {
  const ItemSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  });

  it('should return validated data when valid', () => {
    const data = { id: '1', name: 'Test' };
    const result = validateDataOrFallback(ItemSchema, data, { id: '', name: '' }, {
      logErrors: false,
    });

    expect(result).toEqual(data);
  });

  it('should return fallback when data is invalid', () => {
    const fallback = { id: 'fallback', name: 'Fallback Item' };
    const result = validateDataOrFallback(ItemSchema, { id: '', name: '' }, fallback, {
      logErrors: false,
    });

    expect(result).toEqual(fallback);
  });

  it('should log warning when using fallback in development mode', () => {
    const fallback = { id: 'fallback', name: 'Fallback' };
    validateDataOrFallback(ItemSchema, { id: '', name: '' }, fallback, {
      context: 'test-context',
      logErrors: true,
    });

    expect(console.warn).toHaveBeenCalled();
  });
});

describe('validateDataOrThrow', () => {
  const ItemSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  });

  it('should return validated data when valid', () => {
    const data = { id: '1', name: 'Test' };
    const result = validateDataOrThrow(ItemSchema, data, {
      logErrors: false,
    });

    expect(result).toEqual(data);
  });

  it('should throw error when data is invalid', () => {
    expect(() => {
      validateDataOrThrow(ItemSchema, { id: '', name: '' }, {
        context: 'test-context',
        logErrors: false,
      });
    }).toThrow();
  });
});
