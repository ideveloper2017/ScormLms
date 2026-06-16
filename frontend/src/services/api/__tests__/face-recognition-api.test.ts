import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { faceRecognitionApi } from '../face-recognition-api';
import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import type {
  FacePhotoResponse,
  FaceVerificationResponse,
  UploadFacePhotoPayload,
  VerifyFaceMatchPayload,
} from '../face-recognition-api';

// Mock dependencies
vi.mock('@/lib/api');
vi.mock('@/utils/error-handler');

describe('faceRecognitionApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('uploadFacePhoto', () => {
    it('should upload face photo as File with multipart/form-data', async () => {
      const mockFile = new File(['photo content'], 'face.jpg', { type: 'image/jpeg' });
      const mockResponse: FacePhotoResponse = {
        photoUrl: 'https://example.com/photos/face.jpg',
        uploadedAt: new Date('2024-01-15'),
      };

      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const payload: UploadFacePhotoPayload = { photo: mockFile };
      const result = await faceRecognitionApi.uploadFacePhoto(payload);

      expect(api.post).toHaveBeenCalledWith(
        '/users/face/upload',
        expect.any(FormData),
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      expect(result.photoUrl).toBe(mockResponse.photoUrl);
      expect(result.uploadedAt).toBeInstanceOf(Date);
    });

    it('should upload face photo as Blob with multipart/form-data', async () => {
      const mockBlob = new Blob(['photo content'], { type: 'image/jpeg' });
      const mockResponse: FacePhotoResponse = {
        photoUrl: 'https://example.com/photos/face.jpg',
        uploadedAt: new Date('2024-01-15'),
      };

      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const payload: UploadFacePhotoPayload = { photo: mockBlob };
      const result = await faceRecognitionApi.uploadFacePhoto(payload);

      expect(api.post).toHaveBeenCalledWith(
        '/users/face/upload',
        expect.any(FormData),
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      expect(result.photoUrl).toBe(mockResponse.photoUrl);
    });

    it('should upload face photo as base64 string with JSON', async () => {
      const base64Photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
      const mockResponse: FacePhotoResponse = {
        photoUrl: 'https://example.com/photos/face.jpg',
        uploadedAt: new Date('2024-01-15'),
      };

      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const payload: UploadFacePhotoPayload = { photo: base64Photo };
      const result = await faceRecognitionApi.uploadFacePhoto(payload);

      expect(api.post).toHaveBeenCalledWith(
        '/users/face/upload',
        { photo: base64Photo },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(result.photoUrl).toBe(mockResponse.photoUrl);
    });

    it('should include userId in payload when provided', async () => {
      const base64Photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
      const mockResponse: FacePhotoResponse = {
        photoUrl: 'https://example.com/photos/face.jpg',
        uploadedAt: new Date('2024-01-15'),
      };

      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const payload: UploadFacePhotoPayload = { 
        photo: base64Photo,
        userId: 'user123' 
      };
      await faceRecognitionApi.uploadFacePhoto(payload);

      expect(api.post).toHaveBeenCalledWith(
        '/users/face/upload',
        { photo: base64Photo, userId: 'user123' },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    it('should handle API errors', async () => {
      const mockFile = new File(['photo content'], 'face.jpg', { type: 'image/jpeg' });
      const error = new Error('Upload failed');
      
      vi.mocked(api.post).mockRejectedValue(error);

      const payload: UploadFacePhotoPayload = { photo: mockFile };
      
      await expect(faceRecognitionApi.uploadFacePhoto(payload)).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalledWith(error, {
        customMessage: 'Yuz rasmini yuklashda xatolik yuz berdi',
      });
    });

    it('should throw error when API returns success: false', async () => {
      const mockFile = new File(['photo content'], 'face.jpg', { type: 'image/jpeg' });
      
      vi.mocked(api.post).mockResolvedValue({
        data: { success: false, message: 'Upload rejected' },
      });

      const payload: UploadFacePhotoPayload = { photo: mockFile };
      
      await expect(faceRecognitionApi.uploadFacePhoto(payload)).rejects.toThrow('Upload rejected');
    });
  });

  describe('getFacePhotoUrl', () => {
    it('should retrieve face photo URL successfully', async () => {
      const mockResponse: FacePhotoResponse = {
        photoUrl: 'https://example.com/photos/face.jpg',
        uploadedAt: new Date('2024-01-15'),
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const result = await faceRecognitionApi.getFacePhotoUrl();

      expect(api.get).toHaveBeenCalledWith('/users/face/photo', { params: {} });
      expect(result).not.toBeNull();
      expect(result?.photoUrl).toBe(mockResponse.photoUrl);
      expect(result?.uploadedAt).toBeInstanceOf(Date);
    });

    it('should retrieve face photo URL with userId parameter', async () => {
      const mockResponse: FacePhotoResponse = {
        photoUrl: 'https://example.com/photos/face.jpg',
        uploadedAt: new Date('2024-01-15'),
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const result = await faceRecognitionApi.getFacePhotoUrl('user123');

      expect(api.get).toHaveBeenCalledWith('/users/face/photo', { 
        params: { userId: 'user123' } 
      });
      expect(result).not.toBeNull();
    });

    it('should return null when no face photo exists', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: false, data: null },
      });

      const result = await faceRecognitionApi.getFacePhotoUrl();

      expect(result).toBeNull();
    });

    it('should return null on 404 error (no photo found)', async () => {
      const error = {
        response: { status: 404 },
      };
      
      vi.mocked(api.get).mockRejectedValue(error);

      const result = await faceRecognitionApi.getFacePhotoUrl();

      expect(result).toBeNull();
    });

    it('should handle non-404 API errors', async () => {
      const error = new Error('Server error');
      
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(faceRecognitionApi.getFacePhotoUrl()).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalledWith(error, {
        customMessage: 'Yuz rasmini yuklashda xatolik yuz berdi',
      });
    });
  });

  describe('verifyFaceMatch', () => {
    const mockDescriptor = new Array(128).fill(0).map((_, i) => i / 128);

    it('should verify face match successfully', async () => {
      const mockResponse: FaceVerificationResponse = {
        isMatch: true,
        similarity: 0.85,
        threshold: 0.6,
        message: 'Face verified successfully',
      };

      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const payload: VerifyFaceMatchPayload = {
        faceDescriptor: mockDescriptor,
      };
      const result = await faceRecognitionApi.verifyFaceMatch(payload);

      expect(api.post).toHaveBeenCalledWith('/users/face/verify', {
        faceDescriptor: mockDescriptor,
      });
      expect(result.isMatch).toBe(true);
      expect(result.similarity).toBe(0.85);
    });

    it('should verify face match with userId parameter', async () => {
      const mockResponse: FaceVerificationResponse = {
        isMatch: false,
        similarity: 0.45,
        threshold: 0.6,
      };

      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const payload: VerifyFaceMatchPayload = {
        faceDescriptor: mockDescriptor,
        userId: 'user123',
      };
      await faceRecognitionApi.verifyFaceMatch(payload);

      expect(api.post).toHaveBeenCalledWith('/users/face/verify', {
        faceDescriptor: mockDescriptor,
        userId: 'user123',
      });
    });

    it('should throw error for invalid descriptor array (wrong length)', async () => {
      const invalidDescriptor = new Array(64).fill(0); // Wrong length

      const payload: VerifyFaceMatchPayload = {
        faceDescriptor: invalidDescriptor,
      };

      await expect(faceRecognitionApi.verifyFaceMatch(payload)).rejects.toThrow(
        'Invalid face descriptor: must be array of 128 numbers'
      );
    });

    it('should throw error for non-array descriptor', async () => {
      const payload = {
        faceDescriptor: 'not-an-array' as any,
      };

      await expect(faceRecognitionApi.verifyFaceMatch(payload)).rejects.toThrow(
        'Invalid face descriptor: must be array of 128 numbers'
      );
    });

    it('should handle API errors', async () => {
      const error = new Error('Verification failed');
      
      vi.mocked(api.post).mockRejectedValue(error);

      const payload: VerifyFaceMatchPayload = {
        faceDescriptor: mockDescriptor,
      };
      
      await expect(faceRecognitionApi.verifyFaceMatch(payload)).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalledWith(error, {
        customMessage: 'Yuzni tasdiqlashda xatolik yuz berdi',
      });
    });
  });

  describe('deleteFacePhoto', () => {
    it('should delete face photo successfully', async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { success: true },
      });

      await faceRecognitionApi.deleteFacePhoto();

      expect(api.delete).toHaveBeenCalledWith('/users/face/photo', { params: {} });
    });

    it('should delete face photo with userId parameter', async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { success: true },
      });

      await faceRecognitionApi.deleteFacePhoto('user123');

      expect(api.delete).toHaveBeenCalledWith('/users/face/photo', { 
        params: { userId: 'user123' } 
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('Delete failed');
      
      vi.mocked(api.delete).mockRejectedValue(error);

      await expect(faceRecognitionApi.deleteFacePhoto()).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalledWith(error, {
        customMessage: 'Yuz rasmini o\'chirishda xatolik yuz berdi',
      });
    });

    it('should throw error when API returns success: false', async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { success: false, message: 'Delete failed' },
      });

      await expect(faceRecognitionApi.deleteFacePhoto()).rejects.toThrow('Delete failed');
    });
  });
});
