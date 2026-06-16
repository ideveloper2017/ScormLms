import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import FacePhotoSetup from '../face-photo-setup';
import { faceRecognitionApi } from '@/services/api/face-recognition-api';
import * as faceapi from 'face-api.js';

// Mock dependencies
vi.mock('@/services/api/face-recognition-api');
vi.mock('face-api.js');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock HTMLMediaElement methods
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn(),
});

// Mock getUserMedia
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  configurable: true,
});

describe('FacePhotoSetup', () => {
  const mockOnSuccess = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock face-api.js model loading
    vi.mocked(faceapi.nets.tinyFaceDetector.loadFromUri).mockResolvedValue(undefined as never);
    vi.mocked(faceapi.nets.ssdMobilenetv1.loadFromUri).mockResolvedValue(undefined as never);
    vi.mocked(faceapi.nets.faceRecognitionNet.loadFromUri).mockResolvedValue(undefined as never);
    vi.mocked(faceapi.nets.faceLandmark68Net.loadFromUri).mockResolvedValue(undefined as never);

    // Mock getUserMedia
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    } as unknown as MediaStream);
  });

  it('should render loading state initially', () => {
    render(<FacePhotoSetup onSuccess={mockOnSuccess} onSkip={mockOnSkip} />);
    
    expect(screen.getByText(/Modellar yuklanmoqda/i)).toBeInTheDocument();
  });

  it('should show ready state after models load and camera starts', async () => {
    render(<FacePhotoSetup onSuccess={mockOnSuccess} onSkip={mockOnSkip} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Kamera tayyor/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Rasmga olish/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /O'tkazib yuborish/i })).toBeInTheDocument();
  });

  it('should allow skipping face setup', async () => {
    render(<FacePhotoSetup onSuccess={mockOnSuccess} onSkip={mockOnSkip} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Kamera tayyor/i)).toBeInTheDocument();
    });

    const skipButton = screen.getByRole('button', { name: /O'tkazib yuborish/i });
    fireEvent.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('should show error when camera access is denied', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

    render(<FacePhotoSetup onSuccess={mockOnSuccess} onSkip={mockOnSkip} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Kameraga ruxsat berilmadi/i)).toBeInTheDocument();
    });
  });

  it('should capture photo when face is detected', async () => {
    // Mock face detection
    const mockDetection = {
      descriptor: new Float32Array(128).fill(0.5),
      detection: { score: 0.9 },
      landmarks: {},
    };

    vi.mocked(faceapi.detectSingleFace).mockReturnValue({
      withFaceLandmarks: () => ({
        withFaceDescriptor: () => Promise.resolve(mockDetection),
      }),
    } as never);

    render(<FacePhotoSetup onSuccess={mockOnSuccess} onSkip={mockOnSkip} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Kamera tayyor/i)).toBeInTheDocument();
    });

    const captureButton = screen.getByRole('button', { name: /Rasmga olish/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.getByText(/Rasm muvaffaqiyatli olingan/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Qayta olish/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tasdiqlash va yuklash/i })).toBeInTheDocument();
  });

  it('should show error when no face is detected', async () => {
    // Mock no face detection
    vi.mocked(faceapi.detectSingleFace).mockReturnValue({
      withFaceLandmarks: () => ({
        withFaceDescriptor: () => Promise.resolve(null),
      }),
    } as never);

    render(<FacePhotoSetup onSuccess={mockOnSuccess} onSkip={mockOnSkip} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Kamera tayyor/i)).toBeInTheDocument();
    });

    const captureButton = screen.getByRole('button', { name: /Rasmga olish/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.getByText(/Yuz aniqlanmadi/i)).toBeInTheDocument();
    });
  });

  it('should upload photo successfully', async () => {
    // Mock successful upload
    vi.mocked(faceRecognitionApi.uploadFacePhoto).mockResolvedValue({
      photoUrl: 'https://example.com/photo.jpg',
      uploadedAt: new Date(),
    });

    // Mock face detection
    const mockDetection = {
      descriptor: new Float32Array(128).fill(0.5),
      detection: { score: 0.9 },
      landmarks: {},
    };

    vi.mocked(faceapi.detectSingleFace).mockReturnValue({
      withFaceLandmarks: () => ({
        withFaceDescriptor: () => Promise.resolve(mockDetection),
      }),
    } as never);

    render(<FacePhotoSetup onSuccess={mockOnSuccess} onSkip={mockOnSkip} />);
    
    // Wait for ready state
    await waitFor(() => {
      expect(screen.getByText(/Kamera tayyor/i)).toBeInTheDocument();
    });

    // Capture photo
    const captureButton = screen.getByRole('button', { name: /Rasmga olish/i });
    fireEvent.click(captureButton);

    // Wait for preview
    await waitFor(() => {
      expect(screen.getByText(/Rasm muvaffaqiyatli olingan/i)).toBeInTheDocument();
    });

    // Upload photo
    const uploadButton = screen.getByRole('button', { name: /Tasdiqlash va yuklash/i });
    fireEvent.click(uploadButton);

    // Wait for upload
    await waitFor(() => {
      expect(screen.getByText(/Rasm yuklanmoqda/i)).toBeInTheDocument();
    });

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/Muvaffaqiyatli!/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should call uploadFacePhoto with blob
    expect(faceRecognitionApi.uploadFacePhoto).toHaveBeenCalledWith({
      photo: expect.any(Blob),
    });

    // Should call onSuccess after delay
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });
  });

  it('should handle upload error gracefully', async () => {
    // Mock upload error
    vi.mocked(faceRecognitionApi.uploadFacePhoto).mockRejectedValue(
      new Error('Upload failed')
    );

    // Mock face detection
    const mockDetection = {
      descriptor: new Float32Array(128).fill(0.5),
      detection: { score: 0.9 },
      landmarks: {},
    };

    vi.mocked(faceapi.detectSingleFace).mockReturnValue({
      withFaceLandmarks: () => ({
        withFaceDescriptor: () => Promise.resolve(mockDetection),
      }),
    } as never);

    render(<FacePhotoSetup onSuccess={mockOnSuccess} onSkip={mockOnSkip} />);
    
    // Wait for ready state
    await waitFor(() => {
      expect(screen.getByText(/Kamera tayyor/i)).toBeInTheDocument();
    });

    // Capture photo
    const captureButton = screen.getByRole('button', { name: /Rasmga olish/i });
    fireEvent.click(captureButton);

    // Wait for preview
    await waitFor(() => {
      expect(screen.getByText(/Rasm muvaffaqiyatli olingan/i)).toBeInTheDocument();
    });

    // Upload photo
    const uploadButton = screen.getByRole('button', { name: /Tasdiqlash va yuklash/i });
    fireEvent.click(uploadButton);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/Rasmni yuklashda xatolik/i)).toBeInTheDocument();
    });

    // Should still be in preview state with retry option
    expect(screen.getByRole('button', { name: /Qayta olish/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tasdiqlash va yuklash/i })).toBeInTheDocument();

    // Should not call onSuccess
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
