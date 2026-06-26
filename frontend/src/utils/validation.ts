import { z, ZodSchema } from 'zod';

/**
 * Result of a validation operation
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: z.ZodError;
}

/**
 * Options for validation behavior
 */
export interface ValidationOptions {
  /** Log validation errors to console in development */
  logErrors?: boolean;
  /** Provide fallback value if validation fails */
  fallback?: unknown;
  /** Context information for error logging */
  context?: string;
}

/**
 * Validates data against a Zod schema with error handling
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param options - Validation options
 * @returns Validation result with success status and data or error
 * 
 * @example
 * ```typescript
 * const result = validateData(CourseSchema, apiResponse.data, {
 *   logErrors: true,
 *   context: 'fetchCourses'
 * });
 * 
 * if (result.success) {
 *   return result.data;
 * } else {
 *   // Handle validation error
 *   console.error('Validation failed:', result.error);
 * }
 * ```
 */
export function validateData<T>(
  schema: ZodSchema<T>,
  data: unknown,
  options: ValidationOptions = {}
): ValidationResult<T> {
  const { logErrors = import.meta.env.DEV, context } = options;

  const result = schema.safeParse(data);

  if (!result.success) {
    if (logErrors) {
      console.error(
        `[Validation Error]${context ? ` ${context}` : ''}`,
        {
          errors: result.error.errors,
          data,
        }
      );
      
      // Log formatted error messages
      result.error.errors.forEach((err) => {
        console.error(
          `  ❌ ${err.path.join('.')}: ${err.message}`
        );
      });
    }

    return {
      success: false,
      error: result.error,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Validates data and returns it, or throws an error if validation fails
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param options - Validation options
 * @returns The validated data
 * @throws {Error} If validation fails
 * 
 * @example
 * ```typescript
 * try {
 *   const course = validateDataOrThrow(CourseSchema, apiResponse.data);
 *   return course;
 * } catch (error) {
 *   console.error('Invalid course data:', error);
 *   throw error;
 * }
 * ```
 */
export function validateDataOrThrow<T>(
  schema: ZodSchema<T>,
  data: unknown,
  options: ValidationOptions = {}
): T {
  const result = validateData(schema, data, options);

  if (!result.success) {
    throw new Error(
      `Validation failed${options.context ? ` in ${options.context}` : ''}: ${
        result.error?.errors.map((e) => e.message).join(', ')
      }`
    );
  }

  return result.data!;
}

/**
 * Validates data and returns it, or returns a fallback value if validation fails
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param fallback - The fallback value to return if validation fails
 * @param options - Validation options
 * @returns The validated data or fallback value
 * 
 * @example
 * ```typescript
 * const courses = validateDataOrFallback(
 *   CoursesArraySchema,
 *   apiResponse.data,
 *   [], // Return empty array if validation fails
 *   { context: 'fetchCourses' }
 * );
 * ```
 */
export function validateDataOrFallback<T>(
  schema: ZodSchema<T>,
  data: unknown,
  fallback: T,
  options: ValidationOptions = {}
): T {
  const result = validateData(schema, data, options);

  if (!result.success) {
    if (options.logErrors !== false && import.meta.env.DEV) {
      console.warn(
        `[Validation] Using fallback value${options.context ? ` for ${options.context}` : ''}`
      );
    }
    return fallback;
  }

  return result.data!;
}

/**
 * Validates an array and filters out invalid items instead of failing entirely
 * Useful for partial data recovery when some items are malformed
 * 
 * @param itemSchema - The Zod schema for individual array items
 * @param data - The array data to validate
 * @param options - Validation options
 * @returns Array with only valid items
 * 
 * @example
 * ```typescript
 * const validCourses = validateArrayPartial(
 *   CourseSchema,
 *   apiResponse.data,
 *   { context: 'fetchCourses' }
 * );
 * // Returns only courses that pass validation
 * ```
 */
export function validateArrayPartial<T>(
  itemSchema: ZodSchema<T>,
  data: unknown,
  options: ValidationOptions = {}
): T[] {
  const { logErrors = import.meta.env.DEV, context } = options;

  if (!Array.isArray(data)) {
    if (logErrors) {
      console.error(
        `[Validation Error]${context ? ` ${context}` : ''}: Expected array, got ${typeof data}`
      );
    }
    return [];
  }

  const validItems: T[] = [];
  let invalidCount = 0;

  data.forEach((item, index) => {
    const result = itemSchema.safeParse(item);
    if (result.success) {
      validItems.push(result.data);
    } else {
      invalidCount++;
      if (logErrors) {
        console.error(
          `[Validation Error]${context ? ` ${context}` : ''} - Item ${index}:`,
          result.error.errors
        );
      }
    }
  });

  if (invalidCount > 0 && logErrors) {
    console.warn(
      `[Validation]${context ? ` ${context}:` : ''} Filtered out ${invalidCount} invalid items from array of ${data.length}`
    );
  }

  return validItems;
}
