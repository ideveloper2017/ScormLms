// Course data type definitions

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorPhoto?: string;
  progress: number; // 0-100
  grade?: string; // "A", "B+", etc.
  status: 'active' | 'completed' | 'draft';
  imageUrl?: string;
  nextLesson?: {
    title: string;
    date: Date;
  };
  dueDate?: Date;
  credits: number;
}

export interface CourseMaterial {
  id: string;
  title: string;
  type: 'video' | 'document' | 'link';
  url: string;
  uploadedAt: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export interface CourseDetails extends Course {
  syllabus: string;
  objectives: string[];
  materials: CourseMaterial[];
  announcements: Announcement[];
}

export interface CourseProgress {
  completedLessons: number;
  totalLessons: number;
  completedAssignments: number;
  totalAssignments: number;
  averageScore: number;
}

export interface CourseFilters {
  status?: 'active' | 'completed' | 'draft';
  search?: string;
}
