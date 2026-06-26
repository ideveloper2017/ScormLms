/**
 * Assignment API Service Usage Examples
 * 
 * This file demonstrates how to use the assignment API service
 * in your React components or custom hooks.
 */

import { assignmentApi } from './assignment-api';
import type { SubmitAssignmentPayload } from '@/types/assignment.types';

// ===========================
// Example 1: Fetch all assignments
// ===========================
async function fetchAllAssignments() {
  try {
    const assignments = await assignmentApi.fetchAssignments();
    console.log('All assignments:', assignments);
    return assignments;
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
  }
}

// ===========================
// Example 2: Fetch assignments with filters
// ===========================
async function fetchPendingHighPriorityAssignments() {
  try {
    const assignments = await assignmentApi.fetchAssignments({
      status: 'pending',
      priority: 'high',
    });
    console.log('Pending high priority assignments:', assignments);
    return assignments;
  } catch (error) {
    console.error('Failed to fetch filtered assignments:', error);
  }
}

// ===========================
// Example 3: Fetch assignment details
// ===========================
async function getAssignmentDetails(assignmentId: string) {
  try {
    const details = await assignmentApi.fetchAssignmentById(assignmentId);
    console.log('Assignment details:', details);
    console.log('Instructions:', details.instructions);
    console.log('Attachments:', details.attachments);
    console.log('Rubric:', details.rubric);
    return details;
  } catch (error) {
    console.error('Failed to fetch assignment details:', error);
  }
}

// ===========================
// Example 4: Submit assignment with file upload
// ===========================
async function submitAssignmentWithFile(assignmentId: string, file: File) {
  try {
    const payload: SubmitAssignmentPayload = {
      fileUrl: file, // Pass File object directly
      answer: 'Additional notes or explanation',
      submittedAt: new Date(),
    };

    await assignmentApi.submitAssignment(assignmentId, payload);
    console.log('Assignment submitted successfully with file');
  } catch (error) {
    console.error('Failed to submit assignment:', error);
  }
}

// ===========================
// Example 5: Submit assignment with text only
// ===========================
async function submitAssignmentWithText(assignmentId: string, answer: string) {
  try {
    const payload: SubmitAssignmentPayload = {
      answer,
      submittedAt: new Date(),
    };

    await assignmentApi.submitAssignment(assignmentId, payload);
    console.log('Assignment submitted successfully with text');
  } catch (error) {
    console.error('Failed to submit assignment:', error);
  }
}

// ===========================
// Example 6: Submit assignment with both file and text
// ===========================
async function submitAssignmentComplete(
  assignmentId: string,
  file: File,
  answer: string
) {
  try {
    const payload: SubmitAssignmentPayload = {
      fileUrl: file,
      answer,
      submittedAt: new Date(),
    };

    await assignmentApi.submitAssignment(assignmentId, payload);
    console.log('Assignment submitted successfully with file and text');
  } catch (error) {
    console.error('Failed to submit assignment:', error);
  }
}

// ===========================
// Example 7: Fetch submission history
// ===========================
async function getSubmissionHistory(assignmentId: string) {
  try {
    const history = await assignmentApi.fetchSubmissionHistory(assignmentId);
    console.log('Submission history:', history);
    
    // Display submission details
    history.forEach((submission, index) => {
      console.log(`Submission ${index + 1}:`);
      console.log('  Submitted at:', submission.submittedAt);
      console.log('  Status:', submission.status);
      console.log('  Grade:', submission.grade);
      console.log('  Feedback:', submission.feedback);
    });
    
    return history;
  } catch (error) {
    console.error('Failed to fetch submission history:', error);
  }
}

// ===========================
// Example 8: Delete a submission
// ===========================
async function removeSubmission(submissionId: string) {
  try {
    await assignmentApi.deleteSubmission(submissionId);
    console.log('Submission deleted successfully');
  } catch (error) {
    console.error('Failed to delete submission:', error);
  }
}

// ===========================
// Example 9: React Component Usage
// ===========================
/*
import { useEffect, useState } from 'react';
import { assignmentApi } from '@/services/api/assignment-api';
import type { Assignment } from '@/types/assignment.types';

function AssignmentList() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const data = await assignmentApi.fetchAssignments({ status: 'pending' });
        setAssignments(data);
      } catch (error) {
        console.error('Failed to load assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {assignments.map(assignment => (
        <div key={assignment.id}>
          <h3>{assignment.title}</h3>
          <p>Due: {assignment.dueDate.toLocaleDateString()}</p>
          <span className={`priority-${assignment.priority}`}>
            {assignment.priority}
          </span>
        </div>
      ))}
    </div>
  );
}
*/

// ===========================
// Example 10: File input handler
// ===========================
/*
function FileUploadForm({ assignmentId }: { assignmentId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file && !answer) {
      alert('Please provide either a file or text answer');
      return;
    }

    setSubmitting(true);
    
    try {
      await assignmentApi.submitAssignment(assignmentId, {
        fileUrl: file || undefined,
        answer: answer || undefined,
        submittedAt: new Date(),
      });
      
      alert('Assignment submitted successfully!');
      // Reset form or navigate away
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Upload File:</label>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        />
      </div>
      
      <div>
        <label>Text Answer:</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={5}
        />
      </div>
      
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Assignment'}
      </button>
    </form>
  );
}
*/

export {
  fetchAllAssignments,
  fetchPendingHighPriorityAssignments,
  getAssignmentDetails,
  submitAssignmentWithFile,
  submitAssignmentWithText,
  submitAssignmentComplete,
  getSubmissionHistory,
  removeSubmission,
};
