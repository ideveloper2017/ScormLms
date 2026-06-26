// Grade and scoring data type definitions

export interface Grade {
  id: string;
  courseId: string;
  courseName: string;
  assignmentId?: string;
  assignmentName?: string;
  testId?: string;
  testName?: string;
  gradeLetter: string; // "A", "B+", etc.
  gradePoints: number; // 4.0 scale
  scorePercentage: number; // 0-100
  maxScore: number;
  earnedScore: number;
  date: Date;
  feedback?: string;
}

export interface GradeDistribution {
  A: number;
  B: number;
  C: number;
  D: number;
  F: number;
}

export interface GPAData {
  currentGPA: number;
  cumulativeGPA: number;
  totalCredits: number;
  gradePoints: number;
}
