import { z } from 'zod';

// Kotlin serializes absent optional values as null. Normalize before coercion:
// otherwise a missing date becomes 1970-01-01 and valid rows disappear.
export function apiOptional<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(value => value === null ? undefined : value, schema.optional());
}
