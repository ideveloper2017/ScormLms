// Validation utilities and custom Zod types
import { z } from 'zod';

/**
 * Date validation with fallback to current date
 * Accepts ISO string dates and converts to Date object
 * Falls back to current date if parsing fails
 */
export const dateWithFallback = z
  .string()
  .datetime({ message: 'Noto\'g\'ri sana formati' })
  .transform((val) => new Date(val))
  .catch(() => new Date());

/**
 * Optional date validation with fallback to current date
 */
export const optionalDateWithFallback = z
  .string()
  .datetime({ message: 'Noto\'g\'ri sana formati' })
  .transform((val) => new Date(val))
  .catch(() => new Date())
  .optional();

/**
 * Score validation (0-100) with fallback to 0
 */
export const scoreSchema = z
  .number({ message: 'Ball raqam bo\'lishi kerak' })
  .min(0, { message: 'Ball 0 dan kam bo\'lmasligi kerak' })
  .max(100, { message: 'Ball 100 dan oshmasligi kerak' })
  .catch(0);

/**
 * Percentage validation (0-100) with fallback to 0
 */
export const percentageSchema = z
  .number({ message: 'Foiz raqam bo\'lishi kerak' })
  .min(0, { message: 'Foiz 0 dan kam bo\'lmasligi kerak' })
  .max(100, { message: 'Foiz 100 dan oshmasligi kerak' })
  .catch(0);

/**
 * GPA validation (0-4.0) with fallback to 0
 */
export const gpaSchema = z
  .number({ message: 'GPA raqam bo\'lishi kerak' })
  .min(0, { message: 'GPA 0 dan kam bo\'lmasligi kerak' })
  .max(4.0, { message: 'GPA 4.0 dan oshmasligi kerak' })
  .catch(0);

/**
 * Count validation (non-negative) with fallback to 0
 */
export const countSchema = z
  .number({ message: 'Son raqam bo\'lishi kerak' })
  .min(0, { message: 'Son 0 dan kam bo\'lmasligi kerak' })
  .catch(0);

/**
 * Positive count validation (> 0) with fallback to 1
 */
export const positiveCountSchema = z
  .number({ message: 'Son raqam bo\'lishi kerak' })
  .min(1, { message: 'Son 0 dan katta bo\'lishi kerak' })
  .catch(1);

/**
 * Duration in minutes with fallback to 0
 */
export const durationSchema = z
  .number({ message: 'Davomiylik raqam bo\'lishi kerak' })
  .min(0, { message: 'Davomiylik 0 dan kam bo\'lmasligi kerak' })
  .catch(0);

/**
 * Points validation (non-negative) with fallback to 0
 */
export const pointsSchema = z
  .number({ message: 'Ball raqam bo\'lishi kerak' })
  .min(0, { message: 'Ball 0 dan kam bo\'lmasligi kerak' })
  .catch(0);
