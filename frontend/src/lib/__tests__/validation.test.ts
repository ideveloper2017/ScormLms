import { describe, it, expect } from 'vitest';
import {
  dateWithFallback,
  optionalDateWithFallback,
  scoreSchema,
  percentageSchema,
  gpaSchema,
  countSchema,
  positiveCountSchema,
  durationSchema,
  pointsSchema,
} from '../validation';

describe('Validation Schemas', () => {
  describe('dateWithFallback', () => {
    it('should parse valid ISO date string', () => {
      const result = dateWithFallback.parse('2024-01-15T10:30:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should fallback to current date for invalid date', () => {
      const before = new Date();
      const result = dateWithFallback.parse('invalid-date');
      const after = new Date();
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should fallback to current date for empty string', () => {
      const result = dateWithFallback.parse('');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('optionalDateWithFallback', () => {
    it('should parse valid ISO date string', () => {
      const result = optionalDateWithFallback.parse('2024-01-15T10:30:00Z');
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle undefined', () => {
      const result = optionalDateWithFallback.parse(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('scoreSchema', () => {
    it('should accept valid scores between 0 and 100', () => {
      expect(scoreSchema.parse(0)).toBe(0);
      expect(scoreSchema.parse(50)).toBe(50);
      expect(scoreSchema.parse(100)).toBe(100);
    });

    it('should fallback to 0 for scores below 0', () => {
      expect(scoreSchema.parse(-10)).toBe(0);
    });

    it('should fallback to 0 for scores above 100', () => {
      expect(scoreSchema.parse(150)).toBe(0);
    });

    it('should fallback to 0 for non-numeric values', () => {
      expect(scoreSchema.parse('invalid')).toBe(0);
    });

    it('should accept decimal scores', () => {
      expect(scoreSchema.parse(85.5)).toBe(85.5);
    });
  });

  describe('percentageSchema', () => {
    it('should accept valid percentages between 0 and 100', () => {
      expect(percentageSchema.parse(0)).toBe(0);
      expect(percentageSchema.parse(50.5)).toBe(50.5);
      expect(percentageSchema.parse(100)).toBe(100);
    });

    it('should fallback to 0 for invalid percentages', () => {
      expect(percentageSchema.parse(-5)).toBe(0);
      expect(percentageSchema.parse(101)).toBe(0);
      expect(percentageSchema.parse('abc')).toBe(0);
    });
  });

  describe('gpaSchema', () => {
    it('should accept valid GPA between 0 and 4.0', () => {
      expect(gpaSchema.parse(0)).toBe(0);
      expect(gpaSchema.parse(2.5)).toBe(2.5);
      expect(gpaSchema.parse(4.0)).toBe(4.0);
    });

    it('should fallback to 0 for invalid GPA', () => {
      expect(gpaSchema.parse(-1)).toBe(0);
      expect(gpaSchema.parse(5)).toBe(0);
      expect(gpaSchema.parse('invalid')).toBe(0);
    });
  });

  describe('countSchema', () => {
    it('should accept non-negative counts', () => {
      expect(countSchema.parse(0)).toBe(0);
      expect(countSchema.parse(10)).toBe(10);
      expect(countSchema.parse(1000)).toBe(1000);
    });

    it('should fallback to 0 for negative counts', () => {
      expect(countSchema.parse(-5)).toBe(0);
    });

    it('should fallback to 0 for non-numeric values', () => {
      expect(countSchema.parse('abc')).toBe(0);
    });
  });

  describe('positiveCountSchema', () => {
    it('should accept positive counts greater than 0', () => {
      expect(positiveCountSchema.parse(1)).toBe(1);
      expect(positiveCountSchema.parse(100)).toBe(100);
    });

    it('should fallback to 1 for zero or negative values', () => {
      expect(positiveCountSchema.parse(0)).toBe(1);
      expect(positiveCountSchema.parse(-5)).toBe(1);
    });

    it('should fallback to 1 for non-numeric values', () => {
      expect(positiveCountSchema.parse('invalid')).toBe(1);
    });
  });

  describe('durationSchema', () => {
    it('should accept non-negative durations', () => {
      expect(durationSchema.parse(0)).toBe(0);
      expect(durationSchema.parse(60)).toBe(60);
      expect(durationSchema.parse(120)).toBe(120);
    });

    it('should fallback to 0 for negative durations', () => {
      expect(durationSchema.parse(-30)).toBe(0);
    });
  });

  describe('pointsSchema', () => {
    it('should accept non-negative points', () => {
      expect(pointsSchema.parse(0)).toBe(0);
      expect(pointsSchema.parse(50)).toBe(50);
      expect(pointsSchema.parse(100)).toBe(100);
    });

    it('should fallback to 0 for negative points', () => {
      expect(pointsSchema.parse(-10)).toBe(0);
    });

    it('should fallback to 0 for non-numeric values', () => {
      expect(pointsSchema.parse('invalid')).toBe(0);
    });
  });
});
