# Test React Query Hooks

This module provides React Query hooks for managing test-related operations in the Student Portal.

## Overview

The test hooks manage the complete test-taking workflow:
- Fetching available tests with filters
- Starting a test session
- Submitting individual answers during the test
- Submitting the complete test
- Viewing test results
- Accessing test history

## Hooks

### Query Hooks (Read Operations)

#### `useTests(filters?: TestFilters)`
Fetches all tests for the current student with optional filtering.

**Parameters:**
- `filters` (optional): Filter by status or courseId

**Returns:**
- Query result with tests array, loading, and error states

**Cache Configuration:**
- Stale Time: 1 minute
- GC Time: 5 minutes

**Example:**
```tsx
const { data: tests, isLoading, error } = useTests({ status: 'upcoming' });
```

---

#### `useTest(testId: string)`
Fetches detailed information for a specific test.

**Parameters:**
- `testId`: The test ID to fetch

**Returns:**
- Query result with test details, loading, and error states

**Cache Configuration:**
- Stale Time: 1 minute
- GC Time: 5 minutes
- Enabled only when testId is provided

**Example:**
```tsx
const { data: test, isLoading } = useTest('test-123');
```

---

#### `useTestResults(testId: string)`
Fetches the results for a completed test.

**Parameters:**
- `testId`: The test ID

**Returns:**
- Query result with test results (score, percentage, feedback), loading, and error states

**Cache Configuration:**
- Stale Time: 5 minutes (results don't change)
- GC Time: 10 minutes

**Example:**
```tsx
const { data: results, isLoading } = useTestResults('test-123');

if (results) {
  console.log(`Score: ${results.score}/${results.totalPoints}`);
  console.log(`Percentage: ${results.percentage}%`);
  console.log(`Passed: ${results.passed}`);
}
```

---

#### `useTestHistory()`
Fetches the complete test history for the current student.

**Returns:**
- Query result with array of completed tests with scores and dates

**Cache Configuration:**
- Stale Time: 2 minutes
- GC Time: 10 minutes

**Example:**
```tsx
const { data: history, isLoading } = useTestHistory();

if (history) {
  history.forEach((item) => {
    console.log(`${item.testTitle}: ${item.percentage}% - ${item.passed ? 'Passed' : 'Failed'}`);
  });
}
```

---

### Mutation Hooks (Write Operations)

#### `useStartTest()`
Starts a new test session.

**Returns:**
- Mutation result with `mutate` function

**Side Effects:**
- Updates test status to 'in-progress' optimistically
- Invalidates test list cache
- Shows success toast notification

**Example:**
```tsx
const startTestMutation = useStartTest();

const handleStartTest = (testId: string) => {
  startTestMutation.mutate(testId, {
    onSuccess: (session) => {
      // Navigate to test taking page
      navigate(`/tests/${testId}/session/${session.id}`);
    },
  });
};
```

---

#### `useSubmitAnswer()`
Submits an answer for a specific question during the test.

**Returns:**
- Mutation result with `mutate` function

**Parameters (in mutation call):**
- `testId`: The test ID
- `questionId`: The question ID
- `payload`: Object with `answer` field

**Side Effects:**
- Silent operation (no toast on success)
- Shows error toast only on failure

**Example:**
```tsx
const submitAnswerMutation = useSubmitAnswer();

const handleAnswerChange = (questionId: string, answer: string) => {
  submitAnswerMutation.mutate({
    testId: 'test-123',
    questionId,
    payload: { answer },
  });
};
```

---

#### `useSubmitTest()`
Submits the complete test with all answers and finalizes the test session.

**Returns:**
- Mutation result with `mutate` function

**Parameters (in mutation call):**
- `testId`: The test ID
- `payload`: Object with `answers` array and `submittedAt` date

**Side Effects:**
- Optimistic update to 'completed' status
- Invalidates test and test list caches
- Shows success toast with score
- Rollback on error

**Example:**
```tsx
const submitTestMutation = useSubmitTest();

const handleSubmitTest = () => {
  submitTestMutation.mutate(
    {
      testId: 'test-123',
      payload: {
        answers: [
          { questionId: 'q1', answer: 'A' },
          { questionId: 'q2', answer: 'True' },
        ],
        submittedAt: new Date(),
      },
    },
    {
      onSuccess: (result) => {
        navigate(`/tests/${testId}/results`);
      },
    }
  );
};
```

---

## Test Session State Management

The hooks handle test session state transitions carefully:

1. **Upcoming → In-Progress**: When `useStartTest()` is called
2. **In-Progress → Completed**: When `useSubmitTest()` is called
3. **Optimistic Updates**: UI updates immediately before server confirmation
4. **Rollback**: Reverts changes if server returns error

## Cache Invalidation Strategy

- **Starting a test**: Invalidates test list
- **Submitting a test**: Invalidates both test detail and test list
- **Fetching results**: Uses separate query key, cached for longer

## Error Handling

All mutation hooks display user-friendly toast notifications in Uzbek language:
- Success messages include relevant details (e.g., score)
- Error messages provide actionable guidance
- Network errors are handled gracefully

## Usage Example: Complete Test Flow

```tsx
import {
  useTest,
  useStartTest,
  useSubmitAnswer,
  useSubmitTest,
  useTestResults,
} from '@/hooks/tests';

function TestTakingPage({ testId }: { testId: string }) {
  const { data: test, isLoading } = useTest(testId);
  const startTest = useStartTest();
  const submitAnswer = useSubmitAnswer();
  const submitTest = useSubmitTest();

  const handleStart = () => {
    startTest.mutate(testId);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    submitAnswer.mutate({ testId, questionId, payload: { answer } });
  };

  const handleSubmit = (answers: Array<{ questionId: string; answer: string }>) => {
    submitTest.mutate({
      testId,
      payload: { answers, submittedAt: new Date() },
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (!test) return <div>Test not found</div>;

  return (
    <div>
      <h1>{test.title}</h1>
      {test.status === 'upcoming' && (
        <button onClick={handleStart}>Start Test</button>
      )}
      {/* Render questions and submission UI */}
    </div>
  );
}
```

## Related Files

- **API Service**: `/src/services/test-api.ts`
- **Type Definitions**: `/src/types/test.types.ts`
- **Query Keys**: `/src/lib/query-keys.ts`
- **Tests**: `/src/hooks/tests/__tests__/useTests.test.tsx`
