import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { LocalTextEditor } from '../editor/local-text-editor';

it('authors and previews formulas locally while preserving existing lesson text', () => {
  function Editor() {
    const [value, setValue] = useState('Java darsi');
    return <LocalTextEditor value={value} onChange={setValue} />;
  }
  const { container } = render(<Editor />);
  fireEvent.change(screen.getByLabelText('Matematik formula (LaTeX)'), { target: { value: '\\sqrt{x^2+1}' } });
  fireEvent.click(screen.getByRole('button', { name: 'Formula qo‘shish' }));
  expect(screen.getByLabelText('Dars matni yoki HTML')).toHaveValue('Java darsi<p>\\[\\sqrt{x^2+1}\\]</p>');
  fireEvent.click(screen.getByRole('button', { name: 'Ko‘rinishi' }));
  expect(screen.getByText('Java darsi')).toBeInTheDocument();
  expect(container.querySelector('.katex')).not.toBeNull();
  expect(container.querySelector('iframe')).toBeNull();
});
