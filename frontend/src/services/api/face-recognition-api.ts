import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import type { ApiResponse } from '@/lib/api';

/**
 * Face photo upload payload
 * Supports both base64 encoded images and File objects
 */
export interface UploadFacePhotoPayload {
  photo: File | Blob | string; // File object, Blob, or base64 string
  userId?: string; // Optional - defaults to current user
}

/**
 * Face photo URL response from backend
 */
export interface FacePhotoResponse {
  photoUrl: string;
  uploadedAt: Date;
}

/**
 * Face verification payload
 * Contains face descriptor array for comparison
 */
export interface VerifyFaceMatchPayload {
  faceDescriptor: number[]; // 128-dimensional face descriptor array
  userId?: string; // Optional - defaults to current user
}

/**
 * Face verification response
 */
export interface FaceVerificationResponse {
  isMatch: boolean;
  similarity: number; // 0-1 similarity score
  threshold: number; // Threshold used for matching
  message?: string;
}

/**
 * Face Recognition API Service
 * Handles face photo storage, retrieval, and verification operations
 * 
 * Backend Integration:
 * - Stores face photos in PostgreSQL database
 * - Uses multipart/form-data for file uploads
 * - Returns face photo URLs for reference image loading
 * - Performs server-side face descriptor comparison
 */
export const faceRecognitionApi = {
  /**
   * Upload face photo to backend storage
   * POST /api/v1/users/face/upload
   * 
   * Supports both multipart file upload and base64 encoded images
   * 
   * @param payload - Face photo data (File, Blob, or base64 string)
   * @returns Promise<FacePhotoResponse> - URL of uploaded photo
   * 
   * @example
   * ```typescript
   * // Upload from File input
   * const file = fileInput.files[0];
   * await faceRecognitionApi.uploadFacePhoto({ photo: file });
   * 
   * // Upload from Blob (e.g., webcam capture)
   * const blob = await fetch(canvasDataUrl).then(r => r.blob());
   * await faceRecognitionApi.uploadFacePhoto({ photo: blob });
   * 
   * // Upload base64 string
   * await faceRecognitionApi.uploadFacePhoto({ photo: base64String });
   * ```
   */
  uploadFacePhoto: async (payload: UploadFacePhotoPayload): Promise<FacePhotoResponse> => {
    try {
      let requestData: FormData | { photo: string };

      // Handle File or Blob objects - use multipart/form-data
      if (payload.photo instanceof File || payload.photo instanceof Blob) {
        const formData = new FormData();
        formData.append('photo', payload.photo, payload.photo instanceof File ? payload.photo.name : 'face-photo.jpg');
        
        if (payload.userId) {
          formData.append('userId', payload.userId);
        }
        
        requestData = formData;
      } else {
        // Handle base64 string - use JSON
        requestData = {
          photo: payload.photo,
          ...(payload.userId && { userId: payload.userId }),
        };
      }

      const response = await api.post<ApiResponse<FacePhotoResponse>>(
        '/users/face/upload',
        requestData,
        {
          headers: payload.photo instanceof File || payload.photo instanceof Blob
            ? { 'Content-Type': 'multipart/form-data' }
            : { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to upload face photo');
      }

      // Parse uploadedAt date
      const parsedData = {
        ...response.data.data,
        uploadedAt: new Date(response.data.data.uploadedAt),
      };

      return parsedData;
    } catch (error) {
      handleApiError(error, {
        customMessage: 'Yuz rasmini yuklashda xatolik yuz berdi',
      });
      throw error;
    }
  },

  /**
   * Get user's stored face photo URL from backend
   * GET /api/v1/users/face/photo
   * 
   * Retrieves the face photo URL stored in PostgreSQL for the authenticated user
   * 
   * @param userId - Optional user ID (defaults to current user)
   * @returns Promise<FacePhotoResponse | null> - Face photo URL or null if not found
   * 
   * @example
   * ```typescript
   * // Get current user's face photo
   * const facePhoto = await faceRecognitionApi.getFacePhotoUrl();
   * if (facePhoto) {
   *   console.log('Reference image:', facePhoto.photoUrl);
   * } else {
   *   console.log('No face photo found - first time setup');
   * }
   * ```
   */
  getFacePhotoUrl: async (userId?: string): Promise<FacePhotoResponse | null> => {
    try {
      const params = userId ? { userId } : {};
      
      const response = await api.get<ApiResponse<FacePhotoResponse>>(
        '/users/face/photo',
        { params }
      );

      // Return null if no face photo found (404 or empty data)
      if (!response.data.success || !response.data.data) {
        return null;
      }

      // Parse uploadedAt date
      const parsedData = {
        ...response.data.data,
        uploadedAt: new Date(response.data.data.uploadedAt),
      };

      return parsedData;
    } catch (error) {
      // Handle 404 as "no photo found" rather than error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 404) {
          return null;
        }
      }

      handleApiError(error, {
        customMessage: 'Yuz rasmini yuklashda xatolik yuz berdi',
      });
      throw error;
    }
  },

  /**
   * Verify face match by sending face descriptor to backend
   * POST /api/v1/users/face/verify
   * 
   * Sends 128-dimensional face descriptor array to backend for comparison
   * with stored face descriptor in PostgreSQL database
   * 
   * @param payload - Face descriptor and optional user ID
   * @returns Promise<FaceVerificationResponse> - Verification result with similarity score
   * 
   * @example
   * ```typescript
   * // After face detection with face-api.js
   * const detection = await faceapi
   *   .detectSingleFace(videoElement)
   *   .withFaceLandmarks()
   *   .withFaceDescriptor();
   * 
   * if (detection) {
   *   const descriptor = Array.from(detection.descriptor);
   *   const result = await faceRecognitionApi.verifyFaceMatch({ 
   *     faceDescriptor: descriptor 
   *   });
   *   
   *   if (result.isMatch) {
   *     console.log(`Match found! Similarity: ${result.similarity}`);
   *   }
   * }
   * ```
   */
  verifyFaceMatch: async (payload: VerifyFaceMatchPayload): Promise<FaceVerificationResponse> => {
    try {
      // Validate descriptor array
      if (!Array.isArray(payload.faceDescriptor) || payload.faceDescriptor.length !== 128) {
        throw new Error('Invalid face descriptor: must be array of 128 numbers');
      }

      const response = await api.post<ApiResponse<FaceVerificationResponse>>(
        '/users/face/verify',
        {
          faceDescriptor: payload.faceDescriptor,
          ...(payload.userId && { userId: payload.userId }),
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Face verification failed');
      }

      return response.data.data;
    } catch (error) {
      handleApiError(error, {
        customMessage: 'Yuzni tasdiqlashda xatolik yuz berdi',
      });
      throw error;
    }
  },

  /**
   * Delete user's face photo and descriptor from backend
   * DELETE /api/v1/users/face/photo
   * 
   * Removes face photo and descriptor from PostgreSQL database
   * Used when user wants to re-register their face
   * 
   * @param userId - Optional user ID (defaults to current user)
   * @returns Promise<void>
   * 
   * @example
   * ```typescript
   * // Delete current user's face data
   * await faceRecognitionApi.deleteFacePhoto();
   * console.log('Face data deleted - ready for re-registration');
   * ```
   */
  deleteFacePhoto: async (userId?: string): Promise<void> => {
    try {
      const params = userId ? { userId } : {};
      
      const response = await api.delete<ApiResponse<void>>(
        '/users/face/photo',
        { params }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete face photo');
      }
    } catch (error) {
      handleApiError(error, {
        customMessage: 'Yuz rasmini o\'chirishda xatolik yuz berdi',
      });
      throw error;
    }
  },
};
