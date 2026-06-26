import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HemisLoginDialog } from '@/components/auth/HemisLoginDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Eye, EyeOff, Camera, Shield, CheckCircle, AlertCircle, Loader2, LogIn, Droplets, User, GraduationCap, UserCheck, Monitor, Settings, Mail, Lock, BookOpen, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils"
import { faceRecognitionApi } from '@/services/api/face-recognition-api';

interface LoginFormProps {
    onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
    const [showPassword, setShowPassword] = useState(false);
    const [loginStep, setLoginStep] = useState<'credentials' | 'face-recognition' | 'success'>('credentials');
    const [hemisDialogOpen, setHemisDialogOpen] = useState(false);
    const [faceRecognitionStatus, setFaceRecognitionStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const { login: authLogin, completeLogin, pendingUser, isAuthenticated, isLoading: isAuthLoading, setFaceRecognitionRequired } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) navigate('/', { replace: true });
    }, [isAuthenticated]);

    // Initialize camera for face recognition
    const initializeCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;

            return true;
        } catch (error) {
            console.error('Camera access denied:', error);
            return false;
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // Handle login success
    const handleLoginSuccess = () => {
        stopCamera();
        setLoginStep('success');
        if (pendingUser) completeLogin(pendingUser);
        setTimeout(() => onSuccess(), 1500);
    };

    const handleFaceRecognition = async () => {
        setFaceRecognitionStatus('scanning');
        try {
            // Simulate face recognition
            await new Promise(resolve => setTimeout(resolve, 1000));
            const isRecognized = Math.random() > 0.1;

            if (isRecognized) {
                setFaceRecognitionStatus('success');
                setTimeout(() => handleLoginSuccess(), 1000);
            } else {
                setFaceRecognitionStatus('failed');
                setTimeout(() => setFaceRecognitionStatus('idle'), 1000);
            }
        } catch (error) {
            console.error('Face recognition error:', error);
            setFaceRecognitionStatus('failed');
            toast({
                title: 'Face Recognition Failed',
                description: 'Could not verify your identity. Please try again.',
                variant: 'destructive'
            });
        }
    };

    const handleSkipFaceRecognition = () => handleLoginSuccess();

    // Quick login handlers
    const handleQuickLogin = async (role: 'admin' | 'instructor' | 'student' | 'proctor' | 'monitor') => {
        const quickLoginCredentials = {
            admin: { username: 'admin', password: 'admin' },
            instructor: { username: 'a.karimov', password: 'Teacher@123' },
            student: { username: 'std_DT220101', password: 'Student@123' },
            proctor: { username: 'admin', password: 'admin' },
            monitor: { username: 'admin', password: 'admin' }
        };

        const credentials = quickLoginCredentials[role];
        setFormData(credentials);

        // Simulate form submission
        setIsSubmitting(true);
        setErrors({});

        try {
            const result = await authLogin(credentials.username, credentials.password);

            if (result?.success) {
                const userRoles = result.data?.user?.roles || [];
                const roles = Array.isArray(userRoles)
                    ? userRoles.map((r: any) => typeof r === 'string' ? r : r.code || r.name)
                    : [];
                const isStudent = roles.some((role) => normalizeRole(role) === 'STUDENT');
                ensureFaceRecognitionFlag();

                if (isStudent) {
                    // Check if user has face photo in backend
                    try {
                        const facePhoto = await faceRecognitionApi.getFacePhotoUrl();

                        if (facePhoto && facePhoto.photoUrl) {
                            // User has face photo → redirect to face verification
                            setFaceRecognitionRequired(true);
                            handleLoginSuccess();
                        } else {
                            // No face photo → optional first-time setup, allow skip
                            setFaceRecognitionRequired(false);
                            handleLoginSuccess();
                        }
                    } catch (error) {
                        console.error('Error checking face photo:', error);
                        // On error, allow login without face recognition
                        setFaceRecognitionRequired(false);
                        handleLoginSuccess();
                    }
                } else {
                    handleLoginSuccess();
                }

                if (result?.message) {
                    toast({ title: 'Success', description: result?.message, variant: 'default' });
                }
            } else {
                const errorMessage = result?.message || 'Login failed. Please try again.';
                setErrors({ general: errorMessage });
                toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Quick login error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred during login';
            setErrors({ general: errorMessage });
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setErrors({});

        // Basic validation
        const newErrors: typeof errors = {};
        if (!formData.username.trim()) newErrors.username = 'Username or email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            const result = await authLogin(formData.username, formData.password);

            if (result?.success) {
                const userRoles = result.data?.user?.roles || [];
                const roles = Array.isArray(userRoles)
                    ? userRoles.map((r: any) => typeof r === 'string' ? r : r.code || r.name)
                    : [];
                const isStudent = roles.some((role) => normalizeRole(role) === 'STUDENT');
                ensureFaceRecognitionFlag();

                if (isStudent) {
                    // Check if user has face photo in backend
                    try {
                        const facePhoto = await faceRecognitionApi.getFacePhotoUrl();

                        if (facePhoto && facePhoto.photoUrl) {
                            // User has face photo → redirect to face verification
                            setFaceRecognitionRequired(true);
                            handleLoginSuccess(); // This will redirect to App.tsx where FaceRecognition component will show
                        } else {
                            // No face photo → optional first-time setup, allow skip
                            setFaceRecognitionRequired(false);
                            handleLoginSuccess();
                        }
                    } catch (error) {
                        console.error('Error checking face photo:', error);
                        // On error, allow login without face recognition
                        setFaceRecognitionRequired(false);
                        handleLoginSuccess();
                    }
                } else {
                    handleLoginSuccess();
                }

                if (result?.message) {
                    toast({ title: 'Success', description: result?.message, variant: 'default' });
                }
            } else {
                const errorMessage = result?.message || 'Login failed. Please try again.';
                setErrors({ general: errorMessage });
                toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred during login';
            setErrors({ general: errorMessage });
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (loginStep === 'face-recognition') {
            const initCamera = async () => {
                const cameraInitialized = await initializeCamera();
                if (!cameraInitialized) {
                    handleLoginSuccess();
                }
            };
            initCamera();
        }
    }, [loginStep]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }, [errors]);

    // --- Render ---

    if (loginStep === 'success') {
        return (
            <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
                <div className="flex items-center justify-center p-4 sm:p-6 lg:p-12">
                    <Card className="w-full max-w-sm shadow-none border border-border p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-600">Muvaffaqiyatli!</h2>
                        <p className="text-muted-foreground">Tizimga muvaffaqiyatli kirdingiz. Dashboard yuklanmoqda...</p>
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    </Card>
                </div>
                <DecorativeSide />
            </div>
        );
    }

    if (loginStep === 'face-recognition') {
        return (
            <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
                <div className="flex items-center justify-center p-4 sm:p-6 lg:p-12">
                    <Card className="w-full max-w-sm shadow-none border border-border p-4 sm:p-6 space-y-4 sm:space-y-6 relative">
                        <div className="text-center">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
                                <Camera className="h-5 w-5 sm:h-6 sm:w-6" /> Yuzni Tanib Olish
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Xavfsizlik uchun yuzingizni kameraga ko'rsating</p>
                        </div>
                        <video ref={videoRef} autoPlay muted className="w-full h-56 sm:h-80 bg-black rounded-lg object-cover" />
                        <div className="absolute top-4 right-4">
                            <Badge variant={faceRecognitionStatus === 'success' ? 'default' : faceRecognitionStatus === 'failed' ? 'destructive' : 'secondary'}>
                                <Shield className="h-3 w-3 mr-1" />
                                {faceRecognitionStatus === 'idle' && 'Tayyor'}
                                {faceRecognitionStatus === 'scanning' && 'Skanlanmoqda...'}
                                {faceRecognitionStatus === 'success' && 'Tanildi!'}
                                {faceRecognitionStatus === 'failed' && 'Tanilmadi'}
                            </Badge>
                        </div>

                        {faceRecognitionStatus === 'scanning' && (
                            <Alert>
                                <Camera className="h-4 w-4" />
                                <AlertDescription>Yuzingizni kameraga to'g'ri qarash va harakat qilmaslik...</AlertDescription>
                            </Alert>
                        )}
                        {faceRecognitionStatus === 'success' && (
                            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800 dark:text-green-400">Yuz muvaffaqiyatli tanildi!</AlertDescription>
                            </Alert>
                        )}
                        {faceRecognitionStatus === 'failed' && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>Yuz tanilmadi. Qaytadan urinib ko'ring yoki o'tkazib yuboring.</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-3">
                            {(faceRecognitionStatus === 'idle' || faceRecognitionStatus === 'failed') && (
                                <Button onClick={handleFaceRecognition} className="flex-1 gap-2">
                                    <Camera className="h-4 w-4" /> {faceRecognitionStatus === 'idle' ? 'Yuzni Tanib Olishni Boshlash' : 'Qaytadan Urinish'}
                                </Button>
                            )}
                            <Button variant="outline" onClick={handleSkipFaceRecognition} className="flex-1 gap-2">
                                <LogIn className="h-4 w-4" /> O'tkazib Yuborish
                            </Button>
                        </div>
                    </Card>
                </div>
                <DecorativeSide />
            </div>
        );
    }

    // Default: credentials step
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-3 sm:p-4 dark:bg-slate-900">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-xl sm:rounded-2xl bg-background shadow-2xl lg:grid-cols-2">
                {/* ── Chap panel: Welcome ──────────────────────────────── */}
                <WelcomePanel />

                {/* ── O'ng panel: Login form ───────────────────────────── */}
                <div className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
                    <div className="w-full max-w-sm">
                        <form onSubmit={handleSubmit} className={cn("flex flex-col gap-5")}>
                            <div className="flex justify-center pb-2">
                                <img src="/logo.png" alt="LMS Logo" className="h-24 w-auto object-contain" />
                            </div>

                            {errors.general && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">{errors.general}</div>}

                            {/* Email / Username */}
                            <div className="space-y-2">
                                <label htmlFor="username" className="text-sm font-medium leading-none">Login</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder="Login kiriting"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting || isAuthLoading}
                                        className={`pl-10 ${errors.username ? 'border-red-500' : ''}`}
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
                            </div>

                            {/* Password */}
                            <div className="space-y-2 w-full">
                                <label htmlFor="password" className="text-sm font-medium leading-none">Parol</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Parolingizni kiriting"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting || isAuthLoading}
                                        className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isSubmitting || isAuthLoading}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                            </div>

                            {/* Remember me + Forgot password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Checkbox id="remember" />
                                    Meni eslab qol
                                </label>
                                <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">Parolni unutdingizmi?</Link>
                            </div>

                            {/* Login button */}
                            <Button type="submit" className="w-full" disabled={isSubmitting || isAuthLoading}>
                                {(isSubmitting || isAuthLoading) ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kirilmoqda...</>) : 'Kirish'}
                            </Button>

                            {/* OR divider */}
                            <div className="flex items-center gap-3">
                                <span className="h-px flex-1 bg-border" />
                                <span className="text-xs text-muted-foreground">yoki</span>
                                <span className="h-px flex-1 bg-border" />
                            </div>

                            {/* HEMIS orqali kirish */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full gap-2"
                                onClick={() => setHemisDialogOpen(true)}
                                disabled={isSubmitting || isAuthLoading}
                            >
                                <GraduationCap className="h-4 w-4 text-blue-600" />
                                HEMIS orqali kirish
                            </Button>

                            <HemisLoginDialog
                                open={hemisDialogOpen}
                                onOpenChange={setHemisDialogOpen}
                                onSuccess={() => handleLoginSuccess()}
                            />

                            {/* ── Tezkor kirish (Dev Mode) — funksiya saqlab qolingan ── */}
                            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
                                <p className="text-center text-xs text-muted-foreground">Tezkor kirish (Dev Mode)</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full gap-2 text-xs"
                                        onClick={() => handleQuickLogin('student')}
                                        disabled={isSubmitting || isAuthLoading}
                                    >
                                        <GraduationCap className="h-4 w-4" />
                                        Talaba
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full gap-2 text-xs"
                                        onClick={() => handleQuickLogin('instructor')}
                                        disabled={isSubmitting || isAuthLoading}
                                    >
                                        <User className="h-4 w-4" />
                                        O'qituvchi
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full gap-2 text-xs"
                                        onClick={() => handleQuickLogin('admin')}
                                        disabled={isSubmitting || isAuthLoading}
                                    >
                                        <Settings className="h-4 w-4" />
                                        Admin
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full gap-2 text-xs"
                                        onClick={() => handleQuickLogin('proctor')}
                                        disabled={isSubmitting || isAuthLoading}
                                    >
                                        <UserCheck className="h-4 w-4" />
                                        Proktor
                                    </Button>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full gap-2 text-xs"
                                    onClick={() => handleQuickLogin('monitor')}
                                    disabled={isSubmitting || isAuthLoading}
                                >
                                    <Monitor className="h-4 w-4" />
                                    Monitor
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WelcomePanel = () => (
    <div className="relative hidden overflow-hidden bg-blue-50 p-10 dark:bg-slate-800 lg:flex lg:flex-col">
        {/* Dekorativ shakllar */}
        <div className="pointer-events-none absolute -right-10 top-10 h-40 w-40 rounded-full bg-blue-100/70 dark:bg-blue-900/30" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-indigo-100/60 dark:bg-indigo-900/20" />

        {/* Matn */}
        <div className="relative z-10 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Namangan Davlat Texnika Universiteti</p>
            <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                LMS
            </h2>
            <div className="h-1 w-14 rounded-full bg-blue-600" />
            <p className="max-w-xs pt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Elektron Ta'lim<br />Boshqaruv Tizimi
            </p>
        </div>

        {/* Illyustratsiya */}
        <div className="relative z-10 mt-auto flex items-end justify-center gap-4 pt-10">
            {/* Bitiruv shapkasi + kitoblar */}
            <div className="flex flex-col items-center">
                <GraduationCap className="h-16 w-16 text-blue-900 dark:text-blue-300" />
                <div className="mt-1 space-y-1">
                    <div className="h-3 w-24 rounded-sm bg-blue-600" />
                    <div className="h-3 w-24 rounded-sm bg-amber-400" />
                    <div className="h-3 w-24 rounded-sm bg-blue-300" />
                </div>
            </div>
            {/* Laptop + video player */}
            <div className="w-44">
                <div className="rounded-t-lg border-4 border-slate-800 bg-blue-600 p-4 dark:border-slate-600">
                    <div className="flex items-center justify-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                            <Play className="h-5 w-5 fill-blue-600 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                        <div className="h-1.5 w-full rounded bg-white/40" />
                        <div className="h-1.5 w-2/3 rounded bg-white/40" />
                    </div>
                </div>
                <div className="h-1.5 rounded-b-lg bg-slate-800 dark:bg-slate-600" />
            </div>
        </div>
    </div>
)

const DecorativeSide = () => <WelcomePanel />;

function ensureFaceRecognitionFlag() {
    if (!localStorage.getItem('faceRecognitionCompleted')) {
        localStorage.setItem('faceRecognitionCompleted', 'false');
    }
}

function normalizeRole(role: string): string {
    return role.replace(/^ROLE_/i, '').toUpperCase();
}