// Assignment data type definitions

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  maxScore: number;
  submittedAt?: Date;
  grade?: number;
}

export interface AttachmentFile {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface RubricItem {
  criterion: string;
  points: number;
  description: string;
}

export interface AssignmentDetails extends Assignment {
  instructions: string;
  attachments: AttachmentFile[];
  submissionType: 'file' | 'text' | 'both';
  rubric?: RubricItem[];
}

export interface SubmitAssignmentPayload {
  fileUrl?: string | File;
  answer?: string;
  submittedAt: Date;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl?: string;
  answer?: string;
  submittedAt: Date;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
}
