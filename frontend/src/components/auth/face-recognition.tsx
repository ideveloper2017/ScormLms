import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import {
    Camera,
    CheckCircle,
    Loader2,
    User,
    AlertCircle,
    RefreshCw,
    X,
} from "lucide-react";

interface Props {
    referenceImage: string; // bazadan yoki storage dan keladigan rasm URL
    onSuccess: () => void;
    onSkip: () => void;
}

export default function FaceRecognition({ referenceImage, onSuccess, onSkip }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [status, setStatus] = useState<"loading" | "ready" | "scanning" | "success" | "failed" | "no_reference">(
        "loading"
    );
    const [progress, setProgress] = useState(0);
    const [similarity, setSimilarity] = useState<number | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [msg, setMsg] = useState("");
    const threshold = 0.6; // moslashuvchanlik: 0.5-0.7 orasida

    // Model yuklash
    useEffect(() => {
        const loadModels = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
                await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
                await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
                await faceapi.nets.faceLandmark68Net.loadFromUri("/models");

                if (!referenceImage) {
                    setStatus("no_reference");
                    setMsg("Rasm topilmadi");
                    return;
                }

                startVideo();
            } catch (err) {
                console.error("Model yuklanmadi", err);
                setMsg("Model yuklashda xatolik");
            }
        };

        loadModels();
    }, [referenceImage]);

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

    // Skanni boshlash
    const startScan = async () => {
        if (!videoRef.current) return;
        setStatus("scanning");
        setProgress(0);
        setSimilarity(null);

        const reference = await faceapi
            .detectSingleFace(await faceapi.fetchImage(referenceImage))
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!reference) {
            setMsg("Reference rasmda yuz topilmadi");
            setStatus("failed");
            return;
        }

        const faceMatcher = new faceapi.FaceMatcher(reference, threshold);

        let frame = 0;
        const interval = setInterval(async () => {
            if (!videoRef.current) return;
            const detection = await faceapi
                .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416,scoreThreshold: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptors();

            frame++;
            setProgress((frame / 20) * 100);


            if (detection) {
                const bestMatch = faceMatcher.findBestMatch(detection[0].descriptor);
                const distance =1- bestMatch.distance; // o‘xshashlik
                console.log(distance+" >="+threshold)
                setSimilarity(distance);


                // Agar natija juda yaqin bo‘lsa, avtomatik pasaytirish
                // if (distance > 0.55 && distance < 0.6) {
                //     threshold = 0.55;
                // }
                if (distance >= threshold) {
                    clearInterval(interval);
                    setStatus("success");
                    setMsg("Yuz tasdiqlandi");
                    return;
                }
            }

            if (frame >= 20) {
                clearInterval(interval);
                setStatus("failed");
                setAttempts((prev) => prev + 1);
                setMsg("Yuz aniqlanmadi yoki mos kelmadi");
            }
        }, 500);
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
                    {referenceImage && status !== "loading" && status !== "no_reference" && (
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

                {/* O‘xshashlik progressi */}
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




//                                             <User className="w-16 h-16 text-blue-300" />
//                                         </div>
//                                         <p className="mt-4 text-white font-medium">Position your face in the frame</p>
//                                     </div>
//                                 )}
//
//                                 {status === 'success' && (
//                                     <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
//                                         <div className="bg-white/90 p-4 rounded-full">
//                                             <CheckCircle className="w-16 h-16 text-green-600" />
//                                         </div>
//                                     </div>
//                                 )}
//
//                                 {status === 'failed' && (
//                                     <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
//                                         <div className="text-center p-4">
//                                             <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-2" />
//                                             <p className="text-white font-medium">Face verification failed</p>
//                                             <p className="text-white/80 text-sm mt-1">Please try again</p>
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//
//                             {/* Progress */}
//                             <div className="mt-4 space-y-2">
//                                 <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
//                                     <span>Verification Progress</span>
//                                     <span>{progress}%</span>
//                                 </div>
//                                 <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
//                                     <div
//                                         className={cn(
//                                             'h-full',
//                                             status === 'success' ? 'bg-green-500' :
//                                             status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
//                                         )}
//                                         style={{ width: `${progress}%` }}
//                                     />
//                                 </div>
//                                 <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
//                                     <span>Time: {secondsElapsed}s</span>
//                                     <span>{detectionState.faceDetected ? 'Face detected' : 'Searching...'}</span>
//                                 </div>
//                             </div>
//                         </div>
//
//                         {/* Reference Image */}
//                         <div className="space-y-4">
//                             <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
//                                 <div className="bg-gray-100 dark:bg-gray-700 p-2 text-center text-sm font-medium text-gray-700 dark:text-gray-200">
//                                     Reference Photo
//                                 </div>
//                                 <div className="aspect-square bg-gray-50 dark:bg-gray-800 p-4 flex items-center justify-center">
//                                     <img
//                                         src={studentImageUrl}
//                                         alt="Student Reference"
//                                         className="w-full h-full object-cover rounded-md border-2 border-gray-200 dark:border-gray-600"
//                                     />
//                                 </div>
//                             </div>
//
//                             {/* Instructions */}
//                             <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
//                                 <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-1">
//                                     <AlertCircle className="w-4 h-4" />
//                                     Verification Instructions
//                                 </h4>
//                                 <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1.5">
//                                     <li className="flex items-start gap-2">
//                                         <span>•</span>
//                                         <span>Ensure good lighting</span>
//                                     </li>
//                                     <li className="flex items-start gap-2">
//                                         <span>•</span>
//                                         <span>Remove sunglasses or hats</span>
//                                     </li>
//                                     <li className="flex items-start gap-2">
//                                         <span>•</span>
//                                         <span>Look directly at the camera</span>
//                                     </li>
//                                 </ul>
//                             </div>
//                         </div>
//                     </div>
//                 </CardContent>
//
//                 <CardFooter className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t flex justify-between">
//                     <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
//                         <ShieldCheck className="w-4 h-4" />
//                         <span>Your data is securely processed</span>
//                     </div>
//
//                     <div className="flex gap-3">
//                         {status === 'ready' && (
//                             <Button
//                                 onClick={startVideo}
//                                 className="gap-2"
//                             >
//                                 <Camera className="w-4 h-4" />
//                                 Start Verification
//                             </Button>
//                         )}
//
//                         {status === 'failed' && (
//                             <Button
//                                 onClick={startVideo}
//                                 variant="outline"
//                                 className="gap-2"
//                             >
//                                 <RotateCw className="w-4 h-4" />
//                                 Try Again
//                             </Button>
//                         )}
//
//                         <Button
//                             variant="ghost"
//                             onClick={() => { stopVideo(); onSkip(); }}
//                             className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
//                         >
//                             Skip for now
//                         </Button>
//                     </div>
//                 </CardFooter>
//             </Card>
//         </div>
//     );
// }



// import { useState, useRef, useEffect } from "react";
// import { Camera, CheckCircle, AlertCircle, Loader2, RefreshCw, X } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Progress } from "@/components/ui/progress";
// import { useAuth } from "@/contexts/auth-context.tsx";
// import {useEffect, useRef, useState} from "react";
//
// interface FaceRecognitionProps {
//     onSuccess: () => void;
//     onSkip: () => void;
//     userName: string;
// }
//
// export function FaceRecognition({ onSuccess, onSkip, userName }: FaceRecognitionProps) {
//     const { user } = useAuth();
//     const videoRef = useRef<HTMLVideoElement>(null);
//     const [stream, setStream] = useState<MediaStream | null>(null);
//     const [status, setStatus] = useState<'idle' | 'initializing' | 'ready' | 'scanning' | 'success' | 'failed'>('idle');
//     const [progress, setProgress] = useState(0);
//     const [faceDetected, setFaceDetected] = useState(false);
//
//     useEffect(() => {
//         let active = true;
//
//         const initializeCamera = async () => {
//             setStatus('initializing');
//             try {
//                 const mediaStream = await navigator.mediaDevices.getUserMedia({
//                     video: { width: 640, height: 480, facingMode: 'user' }
//                 });
//
//                 if (!active) return;
//
//                 setStream(mediaStream);
//                 if (videoRef.current && !videoRef.current.srcObject) {
//                     videoRef.current.srcObject = mediaStream;
//                     videoRef.current.onloadedmetadata = () => {
//                         videoRef.current?.play().catch(err => console.warn("Video play aborted:", err));
//                         setStatus('ready');
//                     };
//                 }
//             } catch (e) {
//                 console.error("Camera error:", e);
//                 setStatus('failed');
//             }
//         };
//
//         initializeCamera();
//
//         return () => {
//             active = false;
//             if (stream) {
//                 stream.getTracks().forEach(track => track.stop());
//                 setStream(null);
//             }
//         };
//     }, []);
//
//     const startFaceRecognition = async () => {
//         setStatus('scanning');
//         setProgress(0);
//         setFaceDetected(false);
//
//         const interval = setInterval(() => {
//             setProgress(prev => {
//                 const next = prev + 10;
//
//                 // Simulate face detected at 30%
//                 if (next >= 30 && !faceDetected) setFaceDetected(true);
//
//                 if (next >= 100) {
//                     clearInterval(interval);
//                     const isRecognized = Math.random() > 0.15; // 85% success
//                     if (isRecognized) {
//                         setStatus('success');
//                         setTimeout(onSuccess, 1500);
//                     } else {
//                         setStatus('failed');
//                         setFaceDetected(false);
//                         setProgress(0);
//                     }
//                 }
//
//                 return next;
//             });
//         }, 200);
//     };
//
//     const handleSkipFaceRecognition = () => {
//         localStorage.setItem("faceRecognitionCompleted", "true");
//         onSkip();
//     };
//
//     const getStatusMessage = () => {
//         switch (status) {
//             case 'initializing': return 'Kamera ishga tushirilmoqda...';
//             case 'ready': return 'Yuzni tanib olish uchun tayyor';
//             case 'scanning': return faceDetected ? 'Yuz aniqlandi, tasdiqlanmoqda...' : 'Yuz qidirilmoqda...';
//             case 'success': return 'Yuz muvaffaqiyatli tanildi!';
//             case 'failed': return 'Yuz tanilmadi. Qaytadan urinib ko\'ring.';
//             default: return '';
//         }
//     };
//
//     const getStatusColor = () => {
//         switch (status) {
//             case 'success': return 'text-green-600';
//             case 'failed': return 'text-red-600';
//             case 'scanning': return 'text-blue-600';
//             default: return 'text-muted-foreground';
//         }
//     };
//
//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
//             <Card className="w-full max-w-2xl">
//                 <CardHeader className="text-center">
//                     <CardTitle className="flex items-center justify-center gap-2">
//                         <Camera className="h-6 w-6" /> Biometrik Autentifikatsiya
//                     </CardTitle>
//                     <p className="text-muted-foreground">Salom, <span className="font-medium">{user?.username}</span>!</p>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                     <div className="relative">
//                         <video ref={videoRef} autoPlay muted className="w-full h-80 bg-black rounded-lg object-cover" />
//                         <div className="absolute inset-0 flex items-center justify-center">
//                             <div className={`w-64 h-64 border-4 rounded-full ${status === 'scanning' ? 'border-blue-500 animate-pulse' : status === 'success' ? 'border-green-500' : status === 'failed' ? 'border-red-500' : 'border-white/50'}`}>
//                                 <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center">
//                                     {status === 'scanning' && <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />}
//                                     {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
//                                     {status === 'failed' && <AlertCircle className="h-12 w-12 text-red-500" />}
//                                     {status === 'ready' && <Camera className="h-8 w-8 text-white/70" />}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//
//                     <div className={`text-center font-medium ${getStatusColor()}`}>{getStatusMessage()}</div>
//
//                     <div className="flex gap-3">
//                         {status === 'ready' && <Button onClick={startFaceRecognition} className="flex-1">Yuzni Tanib Olish</Button>}
//                         {status === 'failed' && <Button onClick={startFaceRecognition} className="flex-1">Qaytadan Urinish</Button>}
//                         {(status === 'ready' || status === 'failed') && <Button variant="outline" onClick={handleSkipFaceRecognition} className="flex-1">Bekor Qilish</Button>}
//                     </div>
//
//                     {status === 'scanning' && <Progress value={progress} className="h-2" />}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }


//Orginals


// import { useState, useRef, useEffect } from 'react';
// import {
//   Camera,
//   Shield,
//   CheckCircle,
//   AlertCircle,
//   Loader2,
//   RefreshCw,
//   X
// } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Progress } from '@/components/ui/progress';
// import {useAuth} from "@/contexts/auth-context.tsx";
//
//
// interface FaceRecognitionProps {
//   onSuccess: () => void;
//   onSkip: () => void;
//   userName: string;
// }
//
// export function FaceRecognition({ onSuccess, onSkip, userName }: FaceRecognitionProps) {
//     const {user,isAuthenticated}=useAuth()
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const [status, setStatus] = useState<'idle' | 'initializing' | 'ready' | 'scanning' | 'success' | 'failed'>('idle');
//   const [progress, setProgress] = useState(0);
//   const [attempts, setAttempts] = useState(0);
//   const [faceDetected, setFaceDetected] = useState(false);
//
//   useEffect(() => {
//     initializeCamera();
//     return () => {
//       stopCamera();
//     };
//   }, []);
//
//     const initializeCamera = async () => {
//     setStatus('initializing');
//     try {
//       const mediaStream = await navigator.mediaDevices.getUserMedia({
//         video: {
//           width: 640,
//           height: 480,
//           facingMode: 'user'
//         }
//       });
//       setStream(mediaStream);
//       if (videoRef.current) {
//         videoRef.current.srcObject = mediaStream;
//         videoRef.current.onloadedmetadata = () => {
//           setStatus('ready');
//         };
//       }
//     } catch (error) {
//       console.error('Camera access denied:', error);
//       setStatus('failed');
//     }
//   };
//
//   const stopCamera = () => {
//     if (stream) {
//       stream.getTracks().forEach(track => track.stop());
//       setStream(null);
//     }
//   };
//
//   const startFaceRecognition = async () => {
//     setStatus('scanning');
//     setProgress(0);
//     setAttempts(prev => prev + 1);
//
//     // Simulate face detection process
//     const detectionInterval = setInterval(() => {
//       setProgress(prev => {
//         const newProgress = prev + 10;
//
//         // Simulate face detection at 30%
//         if (newProgress >= 30 && !faceDetected) {
//           setFaceDetected(true);
//         }
//
//         if (newProgress >= 100) {
//           clearInterval(detectionInterval);
//           // 85% success rate for demo
//           const isRecognized = Math.random() > 0.15;
//
//           if (isRecognized) {
//             setStatus('success');
//             setTimeout(() => {
//               onSuccess();
//             }, 2000);
//           } else {
//             setStatus('failed');
//             setFaceDetected(false);
//             setTimeout(() => {
//               setStatus('ready');
//               setProgress(0);
//             }, 3000);
//           }
//         }
//
//         return newProgress;
//       });
//     }, 200);
//   };
//
//   const handleSkipFaceRecognition = () => {
//     // Mark face recognition as completed even when skipped
//     localStorage.setItem('faceRecognitionCompleted', 'true');
//     onSuccess();
//   };
//
//   const getStatusMessage = () => {
//     switch (status) {
//       case 'initializing':
//         return 'Kamera ishga tushirilmoqda...';
//       case 'ready':
//         return 'Yuzni tanib olish uchun tayyor';
//       case 'scanning':
//         return faceDetected ? 'Yuz aniqlandi, tasdiqlanmoqda...' : 'Yuz qidirilmoqda...';
//       case 'success':
//         return 'Yuz muvaffaqiyatli tanildi!';
//       case 'failed':
//         return 'Yuz tanilmadi. Qaytadan urinib ko\'ring.';
//       default:
//         return '';
//     }
//   };
//
//   const getStatusColor = () => {
//     switch (status) {
//       case 'success':
//         return 'text-green-600';
//       case 'failed':
//         return 'text-red-600';
//       case 'scanning':
//         return 'text-blue-600';
//       default:
//         return 'text-muted-foreground';
//     }
//   };
//
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
//       <Card className="w-full max-w-2xl">
//         <CardHeader className="text-center">
//           <CardTitle className="flex items-center justify-center gap-2">
//             <Camera className="h-6 w-6" />
//             Biometrik Autentifikatsiya
//           </CardTitle>
//           <div className="space-y-2">
//             <p className="text-muted-foreground">
//               Salom, <span className="font-medium">{user?.username}</span>!
//             </p>
//             <p className="text-sm text-muted-foreground">
//               Xavfsizlik uchun yuzingizni tasdiqlang
//             </p>
//           </div>
//         </CardHeader>
//
//         <CardContent className="space-y-6">
//           {/* Camera Feed */}
//           <div className="relative">
//             <video
//               ref={videoRef}
//               autoPlay
//               muted
//               className="w-full h-80 bg-black rounded-lg object-cover"
//             />
//
//             {/* Face Detection Overlay */}
//             <div className="absolute inset-0 flex items-center justify-center">
//               <div className={`w-64 h-64 border-4 rounded-full transition-all duration-300 ${
//                 status === 'scanning' ? 'border-blue-500 animate-pulse' :
//                 status === 'success' ? 'border-green-500' :
//                 status === 'failed' ? 'border-red-500' :
//                 'border-white/50'
//               }`}>
//                 <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center">
//                   {status === 'scanning' && (
//                     <div className="text-center">
//                       <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
//                       <div className="text-white text-sm">{progress}%</div>
//                     </div>
//                   )}
//                   {status === 'success' && (
//                     <CheckCircle className="h-12 w-12 text-green-500" />
//                   )}
//                   {status === 'failed' && (
//                     <AlertCircle className="h-12 w-12 text-red-500" />
//                   )}
//                   {status === 'ready' && (
//                     <Camera className="h-8 w-8 text-white/70" />
//                   )}
//                 </div>
//               </div>
//             </div>
//
//             {/* Status Badge */}
//             <div className="absolute top-4 right-4">
//               <Badge variant={
//                 status === 'success' ? 'default' :
//                 status === 'failed' ? 'destructive' :
//                 status === 'scanning' ? 'secondary' :
//                 'outline'
//               } className="gap-1">
//                 <Shield className="h-3 w-3" />
//                 {status === 'initializing' && 'Ishga tushirilmoqda'}
//                 {status === 'ready' && 'Tayyor'}
//                 {status === 'scanning' && 'Skanlanmoqda'}
//                 {status === 'success' && 'Muvaffaqiyat'}
//                 {status === 'failed' && 'Xato'}
//               </Badge>
//             </div>
//
//             {/* Face Detection Indicator */}
//             {faceDetected && status === 'scanning' && (
//               <div className="absolute top-4 left-4">
//                 <Badge className="bg-green-100 text-green-800 gap-1">
//                   <CheckCircle className="h-3 w-3" />
//                   Yuz aniqlandi
//                 </Badge>
//               </div>
//             )}
//           </div>
//
//           {/* Progress Bar */}
//           {status === 'scanning' && (
//             <div className="space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span>Tanib olish jarayoni</span>
//                 <span>{progress}%</span>
//               </div>
//               <Progress value={progress} className="h-2" />
//             </div>
//           )}
//
//           {/* Status Message */}
//           <div className={`text-center font-medium ${getStatusColor()}`}>
//             {getStatusMessage()}
//           </div>
//
//           {/* Status Alerts */}
//           {status === 'success' && (
//             <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <AlertDescription className="text-green-800 dark:text-green-400">
//                 Biometrik autentifikatsiya muvaffaqiyatli! Tizimga kirishingiz tasdiqlandi.
//               </AlertDescription>
//             </Alert>
//           )}
//
//           {status === 'failed' && (
//             <Alert variant="destructive">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription>
//                 Yuz tanilmadi. Yaxshi yoritilgan joyda bo'lganingizni va kameraga to'g'ri qaraganingizni tekshiring.
//                 {attempts >= 3 && ' 3 marta urinishdan keyin yuzni tanib olishni o\'tkazib yuborishingiz mumkin.'}
//               </AlertDescription>
//             </Alert>
//           )}
//
//           {status === 'initializing' && (
//             <Alert>
//               <Camera className="h-4 w-4" />
//               <AlertDescription>
//                 Kameraga ruxsat berish talab qilinadi. Brauzer so'rovini tasdiqlang.
//               </AlertDescription>
//             </Alert>
//           )}
//
//           {/* Action Buttons */}
//           <div className="flex gap-3">
//             {status === 'ready' && (
//               <Button onClick={startFaceRecognition} className="flex-1 gap-2">
//                 <Camera className="h-4 w-4" />
//                 Yuzni Tanib Olishni Boshlash
//               </Button>
//             )}
//
//             {status === 'failed' && (
//               <Button onClick={startFaceRecognition} className="flex-1 gap-2">
//                 <RefreshCw className="h-4 w-4" />
//                 Qaytadan Urinish
//               </Button>
//             )}
//
//             {(status === 'ready' || status === 'failed' || (status === 'failed' && attempts >= 3)) && (
//               <Button
//                 variant="outline"
//                 onClick={handleSkipFaceRecognition}
//                 className="gap-2"
//               >
//                 <X className="h-4 w-4" />
//                 {attempts >= 3 ? 'O\'tkazib Yuborish' : 'Bekor Qilish'}
//               </Button>
//             )}
//           </div>
//
//           {/* Instructions */}
//           <div className="text-center space-y-2">
//             <h4 className="font-medium text-sm">Ko'rsatmalar:</h4>
//             <div className="text-xs text-muted-foreground space-y-1">
//               <p>• Yuzingizni kameraga to'g'ri qarash</p>
//               <p>• Yaxshi yoritilgan joyda bo'lish</p>
//               <p>• Ko'zoynak yoki niqob taqmaslik</p>
//               <p>• Skanerlash davomida harakat qilmaslik</p>
//             </div>
//           </div>
//
//           {/* Attempts Counter */}
//           {attempts > 0 && (
//             <div className="text-center text-sm text-muted-foreground">
//               Urinishlar: {attempts}/5
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }