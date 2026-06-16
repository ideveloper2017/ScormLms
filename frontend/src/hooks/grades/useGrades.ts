/**
 * React Query hooks for Grade management
 * 
 * Provides hooks for fetching grades with various filters and aggregations.
 * All hooks use React Query for caching, loading states, and error handling.
 */

import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { gradeApi, GradeFilters, GradeSummary, GPA } from '@/services/api/grade-api';
import type { Transcript } from '@/services/api/grade-api';
import type { Grade, GradeDistribution } from '@/types/grade.types';

/**
 * Hook to fetch all grades for the authenticated student with optional filters
 * 
 * @param filters - Optional filters to narrow down grade results (courseId, semester, academicYear)
 * @returns Query result with grades array, loading state, and error state
 * 
 * @example
 * ```tsx
 * function GradesList() {
 *   const { data: grades, isLoading, error } = useGrades();
 *   
 *   if (isLoading) return <CardSkeleton />;
 *   if (error) return <ErrorDisplay error={error} />;
 *   
 *   return (
 *     <div>
 *       {grades?.map(grade => (
 *         <div key={grade.id}>{grade.courseName}: {grade.gradeLetter}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useGrades = (filters?: GradeFilters) => {
  return useQuery<Grade[], Error>({
    queryKey: qk.grades.list(),
    queryFn: () => gradeApi.fetchGrades(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes - grades don't change frequently
  });
};

/**
 * Hook to fetch grades for a specific course
 * 
 * @param courseId - The ID of the course to fetch grades for
 * @returns Query result with course grades array
 * 
 * @example
 * ```tsx
 * function CourseGrades({ courseId }: { courseId: string }) {
 *   const { data: grades, isLoading } = useCourseGrades(courseId);
 *   
 *   if (isLoading) return <TableSkeleton />;
 *   
 *   return (
 *     <table>
 *       {grades?.map(grade => (
 *         <tr key={grade.id}>
 *           <td>{grade.assignmentName}</td>
 *           <td>{grade.gradeLetter}</td>
 *           <td>{grade.scorePercentage}%</td>
 *         </tr>
 *       ))}
 *     </table>
 *   );
 * }
 * ```
 */
export const useCourseGrades = (courseId: string) => {
  return useQuery<Grade[], Error>({
    queryKey: qk.grades.byCourse(courseId),
    queryFn: () => gradeApi.fetchCourseGrades(courseId),
    enabled: !!courseId, // Only fetch when courseId is provided
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch grade summary statistics
 * 
 * @returns Query result with aggregated grade statistics
 * 
 * @example
 * ```tsx
 * function GradeSummaryCard() {
 *   const { data: summary, isLoading } = useGradeSummary();
 *   
 *   if (isLoading) return <CardSkeleton />;
 *   
 *   return (
 *     <div>
 *       <h3>Grade Summary</h3>
 *       <p>Average: {summary?.averageScore}%</p>
 *       <p>Total Grades: {summary?.totalGrades}</p>
 *       <p>Highest: {summary?.highestScore}%</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useGradeSummary = () => {
  return useQuery<GradeSummary, Error>({
    queryKey: [...qk.grades.root(), 'summary'] as const,
    queryFn: gradeApi.fetchGradeSummary,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch GPA (Grade Point Average) for the authenticated student
 * 
 * @returns Query result with current and cumulative GPA data
 * 
 * @example
 * ```tsx
 * function GPADisplay() {
 *   const { data: gpa, isLoading, error } = useGPA();
 *   
 *   if (isLoading) return <Skeleton className="h-20 w-40" />;
 *   if (error) return <div>GPA ni yuklab bo'lmadi</div>;
 *   
 *   return (
 *     <div>
 *       <h3>GPA</h3>
 *       <p>Joriy: {gpa?.currentGPA.toFixed(2)}</p>
 *       <p>Umumiy: {gpa?.cumulativeGPA.toFixed(2)}</p>
 *       <p>Kreditlar: {gpa?.totalCredits}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useGPA = () => {
  return useQuery<GPA, Error>({
    queryKey: qk.grades.gpa(),
    queryFn: gradeApi.fetchGPA,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch the complete academic transcript
 * 
 * @returns Query result with complete grade history organized by semester
 * 
 * @example
 * ```tsx
 * function TranscriptPage() {
 *   const { data: transcript, isLoading } = useTranscript();
 *   
 *   if (isLoading) return <div>Transkript yuklanmoqda...</div>;
 *   
 *   return (
 *     <div>
 *       <h2>{transcript?.studentName}</h2>
 *       <p>Umumiy GPA: {transcript?.cumulativeGPA.toFixed(2)}</p>
 *       <p>Jami kreditlar: {transcript?.totalCredits}</p>
 *       {transcript?.semesters.map(semester => (
 *         <div key={semester.semester}>
 *           <h3>{semester.semester} - {semester.academicYear}</h3>
 *           <p>Semestr GPA: {semester.semesterGPA.toFixed(2)}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useTranscript = () => {
  return useQuery<Transcript, Error>({
    queryKey: [...qk.grades.root(), 'transcript'] as const,
    queryFn: gradeApi.fetchTranscript,
    staleTime: 10 * 60 * 1000, // 10 minutes - transcripts don't change frequently
  });
};

/**
 * Hook to fetch grade distribution statistics
 * 
 * @returns Query result with counts per grade letter (A, B, C, D, F)
 * 
 * @example
 * ```tsx
 * function GradeDistributionChart() {
 *   const { data: distribution, isLoading } = useGradeDistribution();
 *   
 *   if (isLoading) return <div>Yuklanmoqda...</div>;
 *   
 *   return (
 *     <div>
 *       <h3>Baholar taqsimoti</h3>
 *       <p>A: {distribution?.A}</p>
 *       <p>B: {distribution?.B}</p>
 *       <p>C: {distribution?.C}</p>
 *       <p>D: {distribution?.D}</p>
 *       <p>F: {distribution?.F}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useGradeDistribution = () => {
  return useQuery<GradeDistribution, Error>({
    queryKey: qk.grades.distribution(),
    queryFn: gradeApi.fetchGradeDistribution,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
