import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuizReviewItems } from '../quiz-review';
import type { QuizReviewItem } from '@/services/api/teacher-portal-api';

const item = (overrides: Partial<QuizReviewItem> = {}): QuizReviewItem => ({
  questionId: '3',
  position: 1,
  text: 'F = m × a, m = 2, a = 3. F = ?',
  type: 'SHORT_ANSWER',
  points: 5,
  options: null,
  answer: '6',
  correctAnswer: '6 N|6N',
  correct: false,
  awardedPoints: 0,
  manuallyGraded: false,
  graderComment: null,
  explanation: "Kuch birligi — nyuton",
  ...overrides,
});

describe('QuizReviewItems', () => {
  it('talabaga javobi, barcha qabul qilinadigan variantlar, izoh va o\'qituvchi sharhini ko\'rsatadi', () => {
    render(<QuizReviewItems items={[item({ graderComment: 'Birlikni yozing', manuallyGraded: true, awardedPoints: 3 })]} />);

    expect(screen.getByText('6 N yoki 6N')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
    expect(screen.getByText('Kuch birligi — nyuton')).toBeInTheDocument();
    expect(screen.getByText('Birlikni yozing')).toBeInTheDocument();
    // O'qish rejimida tahrirlash tugmalari yo'q.
    expect(screen.queryByText("Ball qo'yish")).not.toBeInTheDocument();
    expect(screen.queryByText('Kalitni tuzatish')).not.toBeInTheDocument();
  });

  it('to\'g\'ri/noto\'g\'ri savolida qiymatlarni o\'zbekcha ko\'rsatadi', () => {
    render(<QuizReviewItems items={[item({ type: 'TRUE_FALSE', answer: 'false', correctAnswer: 'true', options: ['true', 'false'] })]} />);
    expect(screen.getByText("Noto'g'ri")).toBeInTheDocument();
    expect(screen.getByText("To'g'ri")).toBeInTheDocument();
  });

  it('o\'qituvchi qo\'lda ball va izoh qo\'yadi', async () => {
    const onGrade = vi.fn().mockResolvedValue(undefined);
    render(<QuizReviewItems items={[item()]} onGrade={onGrade} onCorrectKey={vi.fn()} />);

    fireEvent.click(screen.getByText("Ball qo'yish"));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '4' } });
    fireEvent.change(screen.getByPlaceholderText('Talabaga izoh (ixtiyoriy)'), { target: { value: 'Birlik yozilmagan' } });
    fireEvent.click(screen.getByText('Saqlash'));

    await waitFor(() => expect(onGrade).toHaveBeenCalledWith(expect.objectContaining({ questionId: '3' }), 4, 'Birlik yozilmagan'));
  });

  it('chegaradan oshgan ballni saqlashga ruxsat bermaydi', () => {
    render(<QuizReviewItems items={[item()]} onGrade={vi.fn()} />);
    fireEvent.click(screen.getByText("Ball qo'yish"));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '9' } });
    expect(screen.getByText('Saqlash')).toBeDisabled();
  });
});
