import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CoursePreview } from '../course-preview';
import type { CourseContent, CourseModule, TeacherCourse } from '@/services/api/teacher-portal-api';

const course = { id: '3', title: 'Mexanika', subjectName: 'Fizika', language: 'uz' } as TeacherCourse;
const modules = [{ id: 2, title: 'Kirish', position: 1, status: 'published' }] as CourseModule[];
const contents = [
  { id: 11, moduleId: 2, position: 2, title: 'Ikkinchi dars', contentBody: '<p>Ikkinchi matn</p>', status: 'draft' },
  { id: 10, moduleId: 2, position: 1, title: 'Birinchi dars', contentBody: '<p>Birinchi matn</p>', status: 'published' },
] as CourseContent[];
const props = { course, modules, contents, onClose: vi.fn(), onDownload: vi.fn(), downloadingId: null };

describe('teacher course preview', () => {
  it('plays lessons in module order and handles previous and next navigation', () => {
    render(<CoursePreview {...props} mode="player" />);
    expect(screen.getByText('Birinchi matn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Oldingi dars' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Keyingi dars' }));
    expect(screen.getByText('Ikkinchi matn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keyingi dars' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Oldingi dars' }));
    expect(screen.getByText('Birinchi matn')).toBeInTheDocument();
  });
  it('shows overview and an explicit empty player state', () => {
    const view = render(<CoursePreview {...props} mode="overview" />);
    expect(screen.getByText('2 ta dars')).toBeInTheDocument();
    view.rerender(<CoursePreview {...props} contents={[]} mode="player" />);
    expect(screen.getByText("Hali dars qo'shilmagan.")).toBeInTheDocument();
  });
});
