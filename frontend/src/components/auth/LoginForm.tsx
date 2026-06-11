import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Eye, EyeOff, Camera, Shield, CheckCircle, AlertCircle, Loader2, LogIn, Droplets } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils"

interface LoginFormProps {
    onSuccess: () => void;
}

export const LoginForm = ({onSuccess}:LoginFormProps) => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
    const [showPassword, setShowPassword] = useState(false);
    const [loginStep, setLoginStep] = useState<'credentials' | 'face-recognition' | 'success'>('credentials');
    const [faceRecognitionStatus, setFaceRecognitionStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const { login:authLogin, completeLogin, pendingUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
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
        }catch (error){
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
                    setLoginStep('face-recognition');
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
                <div className="flex items-center justify-center p-6 lg:p-12">
                    <Card className="w-full max-w-sm shadow-none border border-border p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="h-8 w-8 text-green-600"/>
                        </div>
                        <h2 className="text-2xl font-bold text-green-600">Muvaffaqiyatli!</h2>
                        <p className="text-muted-foreground">Tizimga muvaffaqiyatli kirdingiz. Dashboard yuklanmoqda...</p>
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary"/>
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
                <div className="flex items-center justify-center p-6 lg:p-12">
                    <Card className="w-full max-w-sm shadow-none border border-border p-6 space-y-6 relative">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
                                <Camera className="h-6 w-6"/> Yuzni Tanib Olish
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">Xavfsizlik uchun yuzingizni kameraga ko'rsating</p>
                        </div>
                        <video ref={videoRef} autoPlay muted className="w-full h-80 bg-black rounded-lg object-cover"/>
                        <div className="absolute top-4 right-4">
                            <Badge variant={faceRecognitionStatus === 'success' ? 'default' : faceRecognitionStatus === 'failed' ? 'destructive' : 'secondary'}>
                                <Shield className="h-3 w-3 mr-1"/>
                                {faceRecognitionStatus === 'idle' && 'Tayyor'}
                                {faceRecognitionStatus === 'scanning' && 'Skanlanmoqda...'}
                                {faceRecognitionStatus === 'success' && 'Tanildi!'}
                                {faceRecognitionStatus === 'failed' && 'Tanilmadi'}
                            </Badge>
                        </div>

                        {faceRecognitionStatus === 'scanning' && (
                            <Alert>
                                <Camera className="h-4 w-4"/>
                                <AlertDescription>Yuzingizni kameraga to'g'ri qarash va harakat qilmaslik...</AlertDescription>
                            </Alert>
                        )}
                        {faceRecognitionStatus === 'success' && (
                            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                                <CheckCircle className="h-4 w-4 text-green-600"/>
                                <AlertDescription className="text-green-800 dark:text-green-400">Yuz muvaffaqiyatli tanildi!</AlertDescription>
                            </Alert>
                        )}
                        {faceRecognitionStatus === 'failed' && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4"/>
                                <AlertDescription>Yuz tanilmadi. Qaytadan urinib ko'ring yoki o'tkazib yuboring.</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-3">
                            {(faceRecognitionStatus === 'idle' || faceRecognitionStatus === 'failed') && (
                                <Button onClick={handleFaceRecognition} className="flex-1 gap-2">
                                    <Camera className="h-4 w-4"/> {faceRecognitionStatus === 'idle' ? 'Yuzni Tanib Olishni Boshlash' : 'Qaytadan Urinish'}
                                </Button>
                            )}
                            <Button variant="outline" onClick={handleSkipFaceRecognition} className="flex-1 gap-2">
                                <LogIn className="h-4 w-4"/> O'tkazib Yuborish
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
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            <div className="flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-sm">
                    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6")}>
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-1 text-center">
                                <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-2">
                                    <Droplets className="h-8 w-8 text-blue-600"/>
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight">EduLMS tizimiga kirish</h1>
                                <p className="text-sm text-muted-foreground">Hisobingizga kirish uchun ma'lumotlaringizni kiriting</p>
                            </div>
                            
                            {errors.general && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">{errors.general}</div>}

                            <Field>
                                <div className="space-y-2">
                                    <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Foydalanuvchi nomi yoki Email</label>
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder="user@example.com"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting || isAuthLoading}
                                        className={errors.username ? 'border-red-500' : ''}
                                        autoComplete="username"
                                    />
                                    {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
                                </div>
                            </Field>

                            <Field>
                                <div className="space-y-2 w-full">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Parol</label>
                                        <a href="#" className="text-sm text-blue-600 hover:underline">Parolni unutdingizmi?</a>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            disabled={isSubmitting || isAuthLoading}
                                            className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isSubmitting || isAuthLoading}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                        </button>
                                    </div>
                                </div>
                            </Field>
                            
                            <Field>
                                <Button type="submit" className="w-full" disabled={isSubmitting || isAuthLoading}>
                                    {(isSubmitting || isAuthLoading) ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Kirish...</>) : 'Kirish'}
                                </Button>
                            </Field>
                            
                            <FieldSeparator>YOKI</FieldSeparator>
                            
                            <Field>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button type="button" variant="outline" className="w-full">Talaba</Button>
                                    <Button type="button" variant="outline" className="w-full">O'qituvchi</Button>
                                </div>
                            </Field>
                        </FieldGroup>
                    </form>
                </div>
            </div>
            
            <DecorativeSide />
        </div>
    );
};

const DecorativeSide = () => (
    <div className="hidden bg-muted lg:flex flex-col justify-end p-12 text-white bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="space-y-4">
            <Shield className="h-12 w-12 text-white/80" />
            <h2 className="text-3xl font-bold">EduLMS SCORM Platformasi</h2>
            <p className="text-lg opacity-90 max-w-md">
                O'quv jarayonini boshqarish va nazorat qilishning zamonaviy yechimi. 
                Xavfsiz, tezkor va qulay.
            </p>
        </div>
    </div>
)

function ensureFaceRecognitionFlag() {
    if (!localStorage.getItem('faceRecognitionCompleted')) {
        localStorage.setItem('faceRecognitionCompleted', 'false');
    }
}

function normalizeRole(role: string): string {
    return role.replace(/^ROLE_/i, '').toUpperCase();
}
