import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FileDropzone } from "@/components/file-dropzone";

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
