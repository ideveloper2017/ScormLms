import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileDropzone } from '../file-dropzone';

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:image');
  URL.revokeObjectURL = vi.fn();
});

describe('file dropzone validation', () => {
  it('rejects wrong formats and oversized files dropped outside the native file picker', () => {
    const change = vi.fn();
    render(<FileDropzone accept=".png" file={null} maxSizeMb={1} onFileChange={change} />);
    const drop = screen.getByText(/Faylni shu yerga/).closest('label')!;
    fireEvent.drop(drop, { dataTransfer: { files: [new File(['bad'], 'file.exe')] } });
    expect(screen.getByRole('alert')).toHaveTextContent('Ruxsat etilgan formatlar');
    const oversized = new File([new Uint8Array(1024 * 1024 + 1)], 'large.png', { type: 'image/png' });
    fireEvent.drop(drop, { dataTransfer: { files: [oversized] } });
    expect(screen.getByRole('alert')).toHaveTextContent('1 MB');
    expect(change).not.toHaveBeenCalled();
    const valid = new File(['ok'], 'cover.PNG', { type: 'image/png' });
    fireEvent.drop(drop, { dataTransfer: { files: [valid] } });
    expect(change).toHaveBeenCalledWith(valid);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an image preview and releases its temporary URL on unmount', () => {
    const file = new File(['image'], 'cover.png', { type: 'image/png' });
    const view = render(<FileDropzone accept=".png" file={file} onFileChange={vi.fn()} />);
    expect(screen.getByRole('img', { name: "Tanlangan rasm ko'rinishi" })).toHaveAttribute('src', 'blob:image');
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:image');
  });

  it('prevents removing or replacing a file while saving', () => {
    const change = vi.fn();
    const file = new File(['image'], 'cover.png', { type: 'image/png' });
    render(<FileDropzone accept=".png" file={file} disabled onFileChange={change} />);
    const drop = screen.getByText(/Faylni shu yerga/).closest('label')!;
    fireEvent.drop(drop, { dataTransfer: { files: [file] } });
    expect(screen.getByRole('button', { name: 'Tanlangan faylni olib tashlash' })).toBeDisabled();
    expect(change).not.toHaveBeenCalled();
  });
});

describe("FileDropzone", () => {
  it("passes a selected file to the form", () => {
    const onFileChange = vi.fn();
    const { container } = render(
      <FileDropzone
        accept=".mp4,.webm"
        file={null}
        onFileChange={onFileChange}
      />,
    );
    const file = new File(["video"], "lesson.mp4", { type: "video/mp4" });

    fireEvent.change(container.querySelector("input[type=file]")!, {
      target: { files: [file] },
    });

    expect(onFileChange).toHaveBeenCalledWith(file);
  });

  it("accepts the first dropped file", () => {
    const onFileChange = vi.fn();
    render(
      <FileDropzone
        accept=".pdf"
        file={null}
        onFileChange={onFileChange}
      />,
    );
    const file = new File(["document"], "lesson.pdf", {
      type: "application/pdf",
    });

    fireEvent.drop(
      screen.getByText(/Faylni shu yerga tashlang/i).closest("label")!,
      { dataTransfer: { files: [file] } },
    );

    expect(onFileChange).toHaveBeenCalledWith(file);
  });
});
