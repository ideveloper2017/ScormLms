// Test and exam data type definitions

export interface Test {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  questionCount: number;
  totalPoints: number;
  proctoring: boolean;
  status: 'upcoming' | 'in-progress' | 'completed' | 'missed';
  score?: number;
}

export interface TestQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  text: string;
  points: number;
  options?: string[];
}

export interface TestDetails extends Test {
  instructions: string;
  allowedAttempts: number;
  attemptsUsed: number;
  passingScore: number;
  questions?: TestQuestion[];
}

export interface TestSession {
  id: string;
  testId: string;
  startedAt: Date;
  expiresAt: Date;
  questions: TestQuestion[];
}

export interface SubmitTestPayload {
  answers: Array<{ questionId: string; answer: string }>;
  submittedAt: Date;
}

export interface TestResult {
  id: string;
  testId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  submittedAt: Date;
  feedback?: string;
}
