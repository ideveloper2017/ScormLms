import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Camera, CheckCircle, RefreshCw, Upload } from "lucide-react";
import { faceRecognitionApi } from "@/services/api/face-recognition-api";
import { toast } from "sonner";

interface Props {
    onSuccess: () => void;
    onSkip: () => void;
}

export default function FacePhotoSetup({ onSuccess, onSkip }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [status, setStatus] = useState<"loading" | "ready" | "capturing" | "preview" | "uploading" | "success" | "failed">("loading");
    const [msg, setMsg] = useState("");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Model yuklash
    useEffect(() => {
        const initializeModels = async () => {
            try {
                setStatus("loading");
                setMsg("Modellar yuklanmoqda...");

                await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
                await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
                await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
                await faceapi.nets.faceLandmark68Net.loadFromUri("/models");

                startCamera();
            } catch (err) {
                console.error("Model loading error:", err);
                setStatus("failed");
                setMsg("Modellarni yuklashda xatolik yuz berdi");
            }
        };

        initializeModels();

        // Cleanup on unmount
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Kamerani ishga tushirish
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                } 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            
            setStream(mediaStream);
            setStatus("ready");
            setMsg("Kamera tayyor. Yuzingizni ramka ichiga joylashtiring va rasmga oling.");
        } catch (err) {
            console.error("Camera error:", err);
            setStatus("failed");
            setMsg("Kameraga ruxsat berilmadi yoki kamera topilmadi");
        }
    };

    // Rasmga olish
    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setStatus("capturing");
        setMsg("Yuz aniqlanmoqda...");

        try {
            // Detect face
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setStatus("ready");
                setMsg("Yuz aniqlanmadi. Iltimos, yuzingizni aniqroq ko'rsating va qayta urinib ko'ring.");
                toast.error("Yuz aniqlanmadi. Qayta urinib ko'ring.");
                return;
            }

            // Capture image from video
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                throw new Error("Canvas context not available");
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error("Failed to create blob"));
                }, "image/jpeg", 0.95);
            });

            const imageUrl = canvas.toDataURL("image/jpeg", 0.95);

            setCapturedImage(imageUrl);
            setCapturedBlob(blob);
            setStatus("preview");
            setMsg("Rasm muvaffaqiyatli olingan. Tasdiqlang yoki qayta oling.");

            // Stop camera stream during preview
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        } catch (error) {
            console.error("Capture error:", error);
            setStatus("ready");
            setMsg("Rasmga olishda xatolik yuz berdi");
            toast.error("Rasmga olishda xatolik yuz berdi");
        }
    };

    // Qayta rasmga olish
    const retakePhoto = () => {
        setCapturedImage(null);
        setCapturedBlob(null);
        startCamera();
    };

    // Rasmni yuklash
    const uploadPhoto = async () => {
        if (!capturedBlob) {
            toast.error("Yuklash uchun rasm mavjud emas");
            return;
        }

        setStatus("uploading");
        setMsg("Rasm yuklanmoqda...");

        try {
            const result = await faceRecognitionApi.uploadFacePhoto({
                photo: capturedBlob,
            });

            console.log("Upload successful:", result);

            setStatus("success");
            setMsg("Yuz rasmi muvaffaqiyatli ro'yxatdan o'tkazildi!");
            toast.success("Yuz rasmi muvaffaqiyatli saqlandi!");

            // Wait 1 second before calling onSuccess
            setTimeout(() => {
                onSuccess();
            }, 1000);
        } catch (error) {
            console.error("Upload error:", error);
            setStatus("preview");
            setMsg("Rasmni yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
            toast.error("Rasmni yuklashda xatolik yuz berdi");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-5">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold flex items-center justify-center gap-2">
                        <Camera /> Yuz rasmini ro'yxatdan o'tkazish
                    </h2>
                    <p className="text-sm text-gray-500">
                        Kelajakda tizimga kirish uchun yuz rasmingizni ro'yxatdan o'tkazing
                    </p>
                </div>

                {/* Video or Preview */}
                <div className="relative bg-black rounded-xl overflow-hidden">
                    {status !== "preview" && status !== "success" ? (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-80 object-cover"
                            />
                            {/* Face guideline overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div
                                    className={`w-64 h-80 border-4 border-dashed transition-all duration-300 rounded-xl ${
                                        status === "capturing"
                                            ? "border-blue-500 animate-pulse"
                                            : status === "ready"
                                                ? "border-white/40"
                                                : "border-gray-500/40"
                                    }`}
                                ></div>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-80 flex items-center justify-center bg-gray-900">
                            {capturedImage && (
                                <img 
                                    src={capturedImage} 
                                    alt="Captured face" 
                                    className="max-w-full max-h-full object-contain"
                                />
                            )}
                        </div>
                    )}

                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Status message */}
                <div className="text-center font-medium text-sm text-gray-600 dark:text-gray-300">
                    {msg}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-4">
                    {status === "loading" && (
                        <div className="flex-1 flex items-center justify-center py-3">
                            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                        </div>
                    )}

                    {status === "ready" && (
                        <>
                            <button
                                onClick={capturePhoto}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                            >
                                <Camera className="h-5 w-5" />
                                <span>Rasmga olish</span>
                            </button>
                            <button
                                onClick={onSkip}
                                className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium transition-all"
                            >
                                O'tkazib yuborish
                            </button>
                        </>
                    )}

                    {status === "capturing" && (
                        <div className="flex-1 flex items-center justify-center py-3">
                            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                        </div>
                    )}

                    {status === "preview" && (
                        <>
                            <button
                                onClick={retakePhoto}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                            >
                                <RefreshCw className="h-5 w-5" />
                                <span>Qayta olish</span>
                            </button>
                            <button
                                onClick={uploadPhoto}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                            >
                                <Upload className="h-5 w-5" />
                                <span>Tasdiqlash va yuklash</span>
                            </button>
                        </>
                    )}

                    {status === "uploading" && (
                        <div className="flex-1 flex items-center justify-center gap-2 py-3">
                            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-green-600" />
                            <span className="text-gray-600 dark:text-gray-300">Yuklanmoqda...</span>
                        </div>
                    )}

                    {status === "success" && (
                        <button
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium cursor-default"
                        >
                            <CheckCircle className="h-5 w-5" />
                            <span>Muvaffaqiyatli!</span>
                        </button>
                    )}

                    {status === "failed" && (
                        <>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                            >
                                <RefreshCw className="h-5 w-5" />
                                <span>Qayta urinish</span>
                            </button>
                            <button
                                onClick={onSkip}
                                className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium transition-all"
                            >
                                O'tkazib yuborish
                            </button>
                        </>
                    )}
                </div>

                {/* Info text */}
                {(status === "ready" || status === "preview") && (
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4 space-y-1">
                        <p>• Yuz aniq va yorug'likda bo'lishi kerak</p>
                        <p>• Ko'zoynakni olib tashlash tavsiya etiladi</p>
                        <p>• Yuzingizni to'g'ridan-to'g'ri kameraga qarating</p>
                    </div>
                )}
            </div>
        </div>
    );
}
