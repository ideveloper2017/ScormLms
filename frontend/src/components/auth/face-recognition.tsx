import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import {
    Camera,
    CheckCircle,
    RefreshCw,
} from "lucide-react";
import { faceRecognitionApi } from "@/services/api/face-recognition-api";

interface Props {
    onSuccess: () => void;
    onSkip: () => void;
}

export default function FaceRecognition({ onSuccess, onSkip }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [status, setStatus] = useState<"loading" | "ready" | "scanning" | "success" | "failed" | "no_reference" | "fetching_reference">(
        "loading"
    );
    const [progress, setProgress] = useState(0);
    const [similarity, setSimilarity] = useState<number | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [msg, setMsg] = useState("");
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const threshold = 0.6; // moslashuvchanlik: 0.5-0.7 orasida

    // Model yuklash va reference image olish
    useEffect(() => {
        const initializeComponent = async () => {
            try {
                setStatus("loading");
                setMsg("Modellar yuklanmoqda...");

                // 1. Load face-api.js models
                await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
                await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
                await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
                await faceapi.nets.faceLandmark68Net.loadFromUri("/models");

                // 2. Fetch reference image from backend
                setStatus("fetching_reference");
                setMsg("Saqlangan yuz rasmi yuklanmoqda...");

                const facePhoto = await faceRecognitionApi.getFacePhotoUrl();

                if (!facePhoto || !facePhoto.photoUrl) {
                    // First-time setup - no face photo stored
                    setStatus("no_reference");
                    setMsg("Sizda saqlangan yuz rasmi yo'q. Iltimos, avval yuz rasmini ro'yxatdan o'tkazing.");
                    return;
                }

                // Reference image found
                setReferenceImage(facePhoto.photoUrl);
                startVideo();
            } catch (err) {
                console.error("Initialization error:", err);
                setStatus("failed");
                setMsg("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
            }
        };

        initializeComponent();
    }, []);

    // Kamerani ishga tushirish
    const startVideo = () => {
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                if (videoRef.current) videoRef.current.srcObject = stream;
                setStatus("ready");
                setMsg("Kamera tayyor");
            })
            .catch(() => setMsg("Kameraga ruxsat berilmadi"));
    };

    // Skanni boshlash - use backend API for verification
    const startScan = async () => {
        if (!videoRef.current || !referenceImage) return;
        setStatus("scanning");
        setProgress(0);
        setSimilarity(null);

        try {
            // Load reference image descriptor locally for visual feedback
            const reference = await faceapi
                .detectSingleFace(await faceapi.fetchImage(referenceImage))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!reference) {
                setMsg("Reference rasmda yuz topilmadi");
                setStatus("failed");
                return;
            }

            let frame = 0;
            const interval = setInterval(async () => {
                if (!videoRef.current) return;
                const detection = await faceapi
                    .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                frame++;
                setProgress((frame / 20) * 100);

                if (detection && detection.descriptor) {
                    // Calculate local similarity for UI feedback
                    const distance = faceapi.euclideanDistance(reference.descriptor, detection.descriptor);
                    const localSimilarity = 1 - distance;
                    setSimilarity(localSimilarity);

                    // Send descriptor to backend for server-side verification
                    try {
                        const verificationResult = await faceRecognitionApi.verifyFaceMatch({
                            faceDescriptor: Array.from(detection.descriptor),
                        });

                        if (verificationResult.isMatch) {
                            clearInterval(interval);
                            setStatus("success");
                            setMsg("Yuz tasdiqlandi");
                            return;
                        }
                    } catch (apiError) {
                        console.error("Backend verification error:", apiError);
                        // Continue scanning even if backend call fails temporarily
                    }
                }

                if (frame >= 20) {
                    clearInterval(interval);
                    setStatus("failed");
                    setAttempts((prev) => prev + 1);
                    setMsg("Yuz aniqlanmadi yoki mos kelmadi. Qayta urinib ko'ring.");
                }
            }, 500);
        } catch (error) {
            console.error("Face scanning error:", error);
            setStatus("failed");
            setMsg("Yuzni tekshirishda xatolik yuz berdi");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-5">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold flex items-center justify-center gap-2">
                        <Camera /> Face-API.js Biometrika
                    </h2>
                    <p className="text-sm text-gray-500">Xavfsizlik uchun yuzingizni tasdiqlang</p>
                </div>

                {/* Video + Canvas */}
                <div className="relative bg-black rounded-xl overflow-hidden">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-80 object-cover"
                    />
                    <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ display: status === "scanning" ? "block" : "none" }}
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                            className={`w-64 h-80 border-4 border-dashed transition-all duration-300 rounded-xl ${
                                status === "scanning"
                                    ? "border-blue-500 animate-pulse"
                                    : status === "success"
                                        ? "border-green-500"
                                        : status === "failed"
                                            ? "border-red-500"
                                            : "border-white/40"
                            }`}
                        ></div>
                    </div>

                    {/* Reference image */}
                    {referenceImage && status !== "loading" && status !== "no_reference" && status !== "fetching_reference" && (
                        <div className="absolute bottom-4 left-4 w-16 h-16 rounded-lg overflow-hidden border-2 border-white/50 shadow-lg">
                            <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                {status === "scanning" && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="text-center font-medium text-sm text-gray-600 dark:text-gray-300">{msg}</div>

                {/* Tugmalar */}
                <div className="flex gap-3 mt-4">
                    {status === "ready" && (
                        <button
                            onClick={startScan}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                        >
                            <Camera className="h-5 w-5" />
                            <span>Tekshirishni boshlash</span>
                        </button>
                    )}

                    {status === "failed" && (
                        <button
                            onClick={startScan}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                        >
                            <RefreshCw className="h-5 w-5" />
                            <span>Qayta urinish</span>
                        </button>
                    )}

                    {status === "success" && (
                        <button
                            onClick={onSuccess}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                        >
                            <CheckCircle className="h-5 w-5" />
                            <span>Davom etish</span>
                        </button>
                    )}

                    {status === "no_reference" && (
                        <>
                            <button
                                onClick={onSkip}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                            >
                                <span>Yuz rasmini ro'yxatdan o'tkazish</span>
                            </button>
                            <button
                                onClick={() => {
                                    // Skip face recognition entirely
                                    localStorage.setItem("faceRecognitionCompleted", "true");
                                    onSkip();
                                }}
                                className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium transition-all"
                            >
                                Keyinroq
                            </button>
                        </>
                    )}
                </div>

                {(status === "ready" || status === "failed") && attempts < 2 && (
                    <div className="text-center mt-2">
                        <button
                            onClick={onSkip}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Yuzni tasdiqlashni o'tkazib yuborish
                        </button>
                    </div>
                )}

                {/* O'xshashlik progressi */}
                {status === "scanning" && similarity !== null && (
                    <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>O'xshashlik darajasi:</span>
                            <span>{(similarity * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${
                                    similarity >= 0.8
                                        ? "bg-green-500"
                                        : similarity >= 0.6
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                }`}
                                style={{ width: `${Math.min(100, similarity * 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
