# Course React Query Hooks

This module provides React Query hooks for managing course-related operations in the Student Portal.

## Created Files

- `useCourses.ts` - Contains all course-related React Query hooks
- `index.ts` - Exports all hooks for easy importing

## Available Hooks

### Query Hooks (Read Operations)

#### `useCourses(filters?: CourseFilters)`
Fetches all courses for the authenticated student with optional filters.

**Parameters:**
- `filters` (optional): Object with `status` and `search` properties

**Returns:** React Query result with courses array

**Cache Time:** 5 minutes

**Example:**
```typescript
const { data: courses, isLoading, error } = useCourses({ status: 'active' });
```

---

#### `useCourse(id: string)`
Fetches detailed information for a specific course.

**Parameters:**
- `id`: The course ID

**Returns:** React Query result with course details

**Cache Time:** 5 minutes

**Example:**
```typescript
const { data: course, isLoading } = useCourse('course-123');
```

---

#### `useCourseModules(courseId: string)`
Fetches all modules within a course.

**Parameters:**
- `courseId`: The course ID

**Returns:** React Query result with course modules array

**Cache Time:** 5 minutes

**Example:**
```typescript
const { data: modules, isLoading } = useCourseModules('course-123');
```

---

#### `useModuleContent(courseId: string, moduleId: string)`
Fetches content items within a specific module.

**Parameters:**
- `courseId`: The course ID
- `moduleId`: The module ID

**Returns:** React Query result with module content array

**Cache Time:** 5 minutes

**Example:**
```typescript
const { data: content, isLoading } = useModuleContent('course-123', 'module-456');
```

---

#### `useCourseProgress(courseId: string)`
Fetches progress information for a specific course.

**Parameters:**
- `courseId`: The course ID

**Returns:** React Query result with course progress data

**Cache Time:** 2 minutes (progress updates more frequently)

**Example:**
```typescript
const { data: progress, isLoading } = useCourseProgress('course-123');
```

---

### Mutation Hooks (Write Operations)

#### `useMarkContentViewed()`
Marks a content item as viewed by the student.

**Returns:** Mutation hook for marking content as viewed

**Features:**
- Automatically invalidates course progress queries
- Automatically invalidates module content queries
- Shows success/error toast notifications in Uzbek
- Updates cache after successful operation

**Example:**
```typescript
const markViewed = useMarkContentViewed();

markViewed.mutate({
  courseId: 'course-123',
  contentId: 'content-789',
  payload: { viewedAt: new Date(), progress: 100 }
});
```

---

#### `useUpdateProgress()`
Updates the progress for a course.

**Returns:** Mutation hook for updating course progress

**Features:**
- Implements optimistic updates for better UX
- Automatically invalidates related queries
- Rolls back on error
- Shows success/error toast notifications in Uzbek
- Tracks module completion, content viewing, and time spent

**Example:**
```typescript
const updateProgress = useUpdateProgress();

updateProgress.mutate({
  courseId: 'course-123',
  payload: {
    moduleId: 'module-456',
    progress: 75,
    completed: false,
    timeSpent: 1200
  }
});
```

## Cache Invalidation Strategy

The mutation hooks automatically handle cache invalidation:

### `useMarkContentViewed()` invalidates:
- Course progress (`qk.courses.progress(courseId)`)
- Course modules (`qk.courses.detail(courseId), 'modules'`)
- All module content queries for the course

### `useUpdateProgress()` invalidates:
- Course progress (`qk.courses.progress(courseId)`)
- Course list (`qk.courses.list()`)
- Course details (`qk.courses.detail(courseId)`)
- Course modules (when module is completed)

## Query Keys

All hooks use the centralized query key factory from `@/lib/query-keys.ts`:

```typescript
qk.courses.list(filters)              // ['courses', 'list', filters]
qk.courses.detail(id)                 // ['courses', 'detail', id]
qk.courses.progress(courseId)         // ['courses', 'progress', courseId]
[...qk.courses.detail(id), 'modules'] // ['courses', 'detail', id, 'modules']
```

## Error Handling

All hooks automatically handle errors through:
- The Course API service error handler
- Toast notifications in Uzbek language
- Proper error state management in React Query

## Usage in Components

```typescript
import { 
  useCourses, 
  useCourse, 
  useMarkContentViewed 
} from '@/hooks/courses';

function CourseList() {
  const { data: courses, isLoading, error } = useCourses({ status: 'active' });
  
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <div>
      {courses?.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}

function CourseViewer({ courseId, contentId }) {
  const markViewed = useMarkContentViewed();
  
  const handleContentViewed = () => {
    markViewed.mutate({
      courseId,
      contentId,
      payload: { viewedAt: new Date(), progress: 100 }
    });
  };
  
  return <button onClick={handleContentViewed}>Mark as Viewed</button>;
}
```

## Testing

All hooks can be tested using React Testing Library and Mock Service Worker (MSW):

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCourses } from '@/hooks/courses';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

test('useCourses fetches courses', async () => {
  const { result } = renderHook(() => useCourses(), { wrapper: createWrapper() });
  
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  
  expect(result.current.data).toBeDefined();
});
```

## Dependencies

- `@tanstack/react-query` - Data fetching and caching
- `@/services/api/course-api` - Course API service functions
- `@/lib/query-keys` - Centralized query key factory
- `@/types/course.types` - TypeScript type definitions
- `sonner` - Toast notifications

## Task Completion

✅ Task 4.2: Create Course React Query hooks

**Completed Sub-tasks:**
- ✅ Create useCourses.ts in frontend/src/hooks/courses/
- ✅ Implement useCourses() hook with filters using useQuery
- ✅ Implement useCourse() hook for single course using useQuery
- ✅ Implement useCourseModules() hook using useQuery
- ✅ Implement useModuleContent() hook using useQuery
- ✅ Implement useCourseProgress() hook using useQuery
- ✅ Implement useMarkContentViewed() mutation hook using useMutation
- ✅ Implement useUpdateProgress() mutation hook using useMutation
- ✅ Use query keys from query-keys.ts
- ✅ Handle cache invalidation on mutations
- ✅ Export all hooks from index file

**Implementation Notes:**
- All hooks use TypeScript for type safety
- Cache times configured per requirements (5 minutes for courses, 2 minutes for progress)
- Optimistic updates implemented for better UX
- Automatic cache invalidation on mutations
- Error handling with Uzbek toast notifications
- Comprehensive JSDoc documentation
- Query keys properly structured using the centralized factory
