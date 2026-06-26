/**
 * Integration Verification Script
 * 
 * This script performs automated checks to verify the student backend API integration
 * is complete and working correctly.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface VerificationResult {
  category: string;
  checks: Array<{
    name: string;
    passed: boolean;
    details?: string;
  }>;
}

const results: VerificationResult[] = [];

// Helper function to check if a file exists
function fileExists(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

// Helper function to check directory exists
function dirExists(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

// Helper to search for patterns in files
function searchInFile(filePath: string, pattern: RegExp): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return pattern.test(content);
  } catch {
    return false;
  }
}

// 1. Verify API Service Files
console.log('🔍 Verifying API Service Files...\n');
const apiServiceChecks: VerificationResult = {
  category: 'API Service Files',
  checks: []
};

const requiredApiServices = [
  'dashboard-api.ts',
  'course-api.ts',
  'assignment-api.ts',
  'grade-api.ts',
  'attendance-api.ts',
  'schedule-api.ts',
  'notification-api.ts',
  'face-recognition-api.ts'
];

const servicesPath = './src/services/api';
requiredApiServices.forEach(service => {
  const exists = fileExists(join(servicesPath, service));
  apiServiceChecks.checks.push({
    name: `${service} exists`,
    passed: exists
  });
});

results.push(apiServiceChecks);

// 2. Verify React Query Hooks
console.log('🔍 Verifying React Query Hooks...\n');
const hooksChecks: VerificationResult = {
  category: 'React Query Hooks',
  checks: []
};

const requiredHooks = [
  'dashboard',
  'courses',
  'assignments',
  'tests',
  'grades',
  'attendance',
  'schedule',
  'notifications'
];

const hooksPath = './src/hooks';
requiredHooks.forEach(hook => {
  const hookDir = join(hooksPath, hook);
  const exists = dirExists(hookDir);
  hooksChecks.checks.push({
    name: `${hook} hook directory exists`,
    passed: exists
  });
  
  if (exists) {
    const mainFile = join(hookDir, `use${hook.charAt(0).toUpperCase() + hook.slice(1)}.ts`);
    const hasMainFile = fileExists(mainFile);
    hooksChecks.checks.push({
      name: `${hook} main hook file exists`,
      passed: hasMainFile
    });
  }
});

results.push(hooksChecks);

// 3. Verify No Mock Data in Student Pages
console.log('🔍 Verifying Mock Data Removal...\n');
const mockDataChecks: VerificationResult = {
  category: 'Mock Data Removal',
  checks: []
};

const studentPagesPath = './src/pages/student';
if (dirExists(studentPagesPath)) {
  const studentPages = readdirSync(studentPagesPath).filter(f => f.endsWith('.tsx') && !f.includes('test'));
  
  studentPages.forEach(page => {
    const pagePath = join(studentPagesPath, page);
    const hasMockData = searchInFile(pagePath, /const\s+(mock|MOCK|mockData|dummyData)/i);
    mockDataChecks.checks.push({
      name: `${page} has no mock data`,
      passed: !hasMockData,
      details: hasMockData ? 'Found mock data patterns' : undefined
    });
  });
}

// Check main student dashboard
const dashboardPath = './src/pages/student-dashboard.tsx';
if (fileExists(dashboardPath)) {
  const hasMockData = searchInFile(dashboardPath, /const\s+(mock|MOCK|mockData|dummyData)/i);
  mockDataChecks.checks.push({
    name: 'student-dashboard.tsx has no mock data',
    passed: !hasMockData,
    details: hasMockData ? 'Found mock data patterns' : undefined
  });
}

results.push(mockDataChecks);

// 4. Verify API Integration in Components
console.log('🔍 Verifying API Integration in Components...\n');
const integrationChecks: VerificationResult = {
  category: 'Component API Integration',
  checks: []
};

const componentsToCheck = [
  { path: './src/pages/student-dashboard.tsx', hooks: ['useDashboardStats', 'useRecentCourses'] },
  { path: './src/pages/student/assignments.tsx', hooks: ['useAssignments', 'useSubmitAssignment'] },
  { path: './src/pages/student/tests.tsx', hooks: ['useTests'] },
  { path: './src/pages/student/grades.tsx', hooks: ['useGrades'] },
  { path: './src/pages/student/attendance.tsx', hooks: ['useAttendance'] },
  { path: './src/pages/student/schedule.tsx', hooks: ['useSchedule'] },
  { path: './src/pages/student/notifications.tsx', hooks: ['useNotifications'] }
];

componentsToCheck.forEach(({ path, hooks }) => {
  if (fileExists(path)) {
    hooks.forEach(hook => {
      const usesHook = searchInFile(path, new RegExp(hook));
      integrationChecks.checks.push({
        name: `${path.split('/').pop()} uses ${hook}`,
        passed: usesHook
      });
    });
  }
});

results.push(integrationChecks);

// 5. Verify Loading States
console.log('🔍 Verifying Loading States...\n');
const loadingChecks: VerificationResult = {
  category: 'Loading States',
  checks: []
};

const skeletonComponentsPath = './src/components/ui/skeletons';
if (dirExists(skeletonComponentsPath)) {
  loadingChecks.checks.push({
    name: 'Skeleton components directory exists',
    passed: true
  });
  
  const requiredSkeletons = [
    'DashboardStatsSkeleton.tsx',
    'CardSkeleton.tsx',
    'ListSkeleton.tsx',
    'TableSkeleton.tsx'
  ];
  
  requiredSkeletons.forEach(skeleton => {
    const exists = fileExists(join(skeletonComponentsPath, skeleton));
    loadingChecks.checks.push({
      name: `${skeleton} exists`,
      passed: exists
    });
  });
}

// Check useLoadingTransition hook
const loadingTransitionHook = './src/hooks/useLoadingTransition.ts';
loadingChecks.checks.push({
  name: 'useLoadingTransition hook exists',
  passed: fileExists(loadingTransitionHook)
});

results.push(loadingChecks);

// 6. Verify Error Handling
console.log('🔍 Verifying Error Handling...\n');
const errorChecks: VerificationResult = {
  category: 'Error Handling',
  checks: []
};

const errorHandlerPath = './src/utils/error-handler.ts';
errorChecks.checks.push({
  name: 'Error handler utility exists',
  passed: fileExists(errorHandlerPath)
});

const errorBoundaryPath = './src/components/error-boundary.tsx';
errorChecks.checks.push({
  name: 'Error boundary component exists',
  passed: fileExists(errorBoundaryPath)
});

// Check if error handler is imported in components
if (fileExists(dashboardPath)) {
  const usesErrorHandler = searchInFile(dashboardPath, /handleApiError|ErrorBoundary/);
  errorChecks.checks.push({
    name: 'Dashboard uses error handling',
    passed: usesErrorHandler
  });
}

results.push(errorChecks);

// 7. Verify Face Recognition Integration
console.log('🔍 Verifying Face Recognition Integration...\n');
const faceRecognitionChecks: VerificationResult = {
  category: 'Face Recognition Integration',
  checks: []
};

const faceApiService = './src/services/api/face-recognition-api.ts';
faceRecognitionChecks.checks.push({
  name: 'Face recognition API service exists',
  passed: fileExists(faceApiService)
});

const faceComponent = './src/components/auth/face-recognition.tsx';
if (fileExists(faceComponent)) {
  faceRecognitionChecks.checks.push({
    name: 'Face recognition component exists',
    passed: true
  });
  
  const usesFaceApi = searchInFile(faceComponent, /faceRecognitionApi/);
  faceRecognitionChecks.checks.push({
    name: 'Face component uses backend API',
    passed: usesFaceApi
  });
  
  const fetchesReference = searchInFile(faceComponent, /getFacePhotoUrl/);
  faceRecognitionChecks.checks.push({
    name: 'Face component fetches reference from backend',
    passed: fetchesReference
  });
}

results.push(faceRecognitionChecks);

// 8. Verify React Query Configuration
console.log('🔍 Verifying React Query Configuration...\n');
const reactQueryChecks: VerificationResult = {
  category: 'React Query Configuration',
  checks: []
};

const mainFile = './src/main.tsx';
if (fileExists(mainFile)) {
  const hasQueryClient = searchInFile(mainFile, /QueryClient/);
  reactQueryChecks.checks.push({
    name: 'QueryClient configured in main.tsx',
    passed: hasQueryClient
  });
  
  const hasQueryProvider = searchInFile(mainFile, /QueryClientProvider/);
  reactQueryChecks.checks.push({
    name: 'QueryClientProvider wraps app',
    passed: hasQueryProvider
  });
}

const queryKeysFile = './src/lib/query-keys.ts';
reactQueryChecks.checks.push({
  name: 'Query keys factory exists',
  passed: fileExists(queryKeysFile)
});

results.push(reactQueryChecks);

// Print Results
console.log('\n' + '='.repeat(80));
console.log('📊 VERIFICATION RESULTS');
console.log('='.repeat(80) + '\n');

let totalChecks = 0;
let passedChecks = 0;

results.forEach(result => {
  console.log(`\n📦 ${result.category}`);
  console.log('-'.repeat(80));
  
  result.checks.forEach(check => {
    totalChecks++;
    if (check.passed) passedChecks++;
    
    const icon = check.passed ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    if (check.details) {
      console.log(`   ${check.details}`);
    }
  });
});

console.log('\n' + '='.repeat(80));
console.log(`📈 SUMMARY: ${passedChecks}/${totalChecks} checks passed (${Math.round(passedChecks/totalChecks*100)}%)`);
console.log('='.repeat(80) + '\n');

if (passedChecks === totalChecks) {
  console.log('🎉 All checks passed! Integration is complete.');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please review the results above.');
  process.exit(1);
}
