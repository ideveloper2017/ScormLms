/**
 * Example usage of validation schemas in API services
 * This file demonstrates how to integrate Zod validation with API calls
 */

import api from '@/lib/api';
import {
  assignmentSchema,
  assignmentsArraySchema,
  testSchema,
  testsArraySchema,
  gradeSchema,
  gradesArraySchema,
  courseSchema,
  coursesArraySchema,
  dashboardDataSchema,
} from './schemas';

// Example 1: Validating a single item response
export const fetchAssignmentDetails = async (id: string) => {
  try {
    const response = await api.get(`/api/v1/assignments/${id}`);
    
    // Validate and transform the response
    // - Converts date strings to Date objects
    // - Validates numeric ranges
    // - Applies fallback values for invalid data
    const validatedData = assignmentSchema.parse(response.data.data);
    
    return validatedData;
  } catch (error) {
    console.error('Assignment validation error:', error);
    throw error;
  }
};

// Example 2: Validating array responses
export const fetchAssignments = async () => {
  try {
    const response = await api.get('/api/v1/assignments/student');
    
    // Validate array of assignments
    // Each element is validated individually
    const validatedData = assignmentsArraySchema.parse(response.data.data);
    
    return validatedData;
  } catch (error) {
    console.error('Assignments validation error:', error);
    throw error;
  }
};

// Example 3: Safe parsing with error handling
export const fetchTestsSafely = async () => {
  const response = await api.get('/api/v1/tests/student');
  
  // Use safeParse for custom error handling
  const result = testsArraySchema.safeParse(response.data.data);
  
  if (result.success) {
    return result.data;
  } else {
    // Log validation errors
    console.error('Test validation failed:', result.error.errors);
    
    // Return empty array as fallback
    return [];
  }
};

// Example 4: Validating nested data structures
export const fetchDashboardData = async () => {
  const response = await api.get('/api/v1/dashboard');
  
  // Validates entire dashboard structure including:
  // - Student profile with GPA validation
  // - Stats with percentage and count validation
  // - Recent activity with date parsing
  const validatedData = dashboardDataSchema.parse(response.data.data);
  
  return validatedData;
};

// Example 5: Validation with transformation
export const fetchGrades = async () => {
  const response = await api.get('/api/v1/grades/student');
  
  // Validate grades and ensure all numeric values are in correct ranges
  const validatedGrades = gradesArraySchema.parse(response.data.data);
  
  // All dates are now Date objects
  // All scores are validated (0-100)
  // All GPAs are validated (0-4.0)
  // Invalid values have been replaced with fallbacks
  
  return validatedGrades;
};

// Example 6: Handling validation errors gracefully
export const fetchCourseWithValidation = async (id: string) => {
  try {
    const response = await api.get(`/api/v1/courses/${id}`);
    
    return courseSchema.parse(response.data.data);
  } catch (error) {
    // Check if it's a Zod validation error
    if (error instanceof Error && error.name === 'ZodError') {
      console.error('Course data validation failed:', error);
      
      // You could log to monitoring service
      // logToSentry(error);
      
      // Return a safe default or rethrow
      throw new Error('Ma\'lumotlar formati noto\'g\'ri');
    }
    
    // Other errors (network, etc.)
    throw error;
  }
};

// Example 7: Partial validation (for updates)
export const updateAssignmentPartial = async (
  id: string,
  updates: Partial<typeof assignmentSchema._type>
) => {
  // For partial updates, you can use partial schema
  const partialSchema = assignmentSchema.partial();
  
  // Validate only the fields being updated
  const validatedUpdates = partialSchema.parse(updates);
  
  const response = await api.patch(`/api/v1/assignments/${id}`, validatedUpdates);
  
  return assignmentSchema.parse(response.data.data);
};

// Example 8: Validation in React Query hooks
import { useQuery } from '@tanstack/react-query';

export const useValidatedCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/api/v1/courses/student');
      
      // Validation happens automatically in queryFn
      // Invalid data triggers error state in React Query
      return coursesArraySchema.parse(response.data.data);
    },
  });
};

// Example 9: Error recovery with fallback values
export const fetchDashboardStatsWithFallback = async () => {
  const response = await api.get('/api/v1/dashboard/stats');
  
  const result = dashboardDataSchema.safeParse(response.data.data);
  
  if (result.success) {
    return result.data;
  } else {
    // Log the error but provide safe fallback
    console.warn('Dashboard stats validation failed, using fallback');
    
    // Return a safe default structure
    return {
      profile: {
        id: '',
        studentId: '',
        name: 'Unknown',
        email: '',
        gpa: 0,
        totalCredits: 0,
        learningStreak: 0,
        roles: [],
      },
      stats: {
        activeCourses: 0,
        pendingAssignments: 0,
        upcomingTests: 0,
        averageGrade: 0,
        attendancePercentage: 0,
        gpa: 0,
        totalCredits: 0,
        learningStreak: 0,
      },
      recentActivity: [],
    };
  }
};

// Example 10: Validation with logging for debugging
export const fetchWithValidationLogging = async <T>(
  url: string,
  schema: any
): Promise<T> => {
  const response = await api.get(url);
  
  console.log('Raw API response:', response.data);
  
  const result = schema.safeParse(response.data.data);
  
  if (result.success) {
    console.log('Validation successful:', result.data);
    return result.data;
  } else {
    console.error('Validation failed:', result.error.errors);
    console.error('Failed data:', response.data.data);
    throw result.error;
  }
};
