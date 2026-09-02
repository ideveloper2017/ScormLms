import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Eye, EyeOff, CheckCircle, Loader2, Droplets, GraduationCap, Mail, Lock, BookOpen, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { getHemisOAuthStartUrl } from '@/lib/api';
import { cn } from "@/lib/utils"

interface LoginFormProps {
    onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
    const [showPassword, setShowPassword] = useState(false);
    const [loginStep, setLoginStep] = useState<'credentials' | 'success'>('credentials');

    const { login: authLogin, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) navigate('/', { replace: true });
    }, [isAuthenticated, navigate]);

    // Handle login success
    const handleLoginSuccess = () => {
        setLoginStep('success');
        setTimeout(() => onSuccess(), 1500);
    };

    const handleHemisLogin = () => {
        window.location.assign(getHemisOAuthStartUrl());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setErrors({});

        // Basic validation
        const newErrors: typeof errors = {};
        if (!formData.username.trim()) newErrors.username = 'Loginni kiriting';
        if (!formData.password) newErrors.password = 'Parolni kiriting';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            const result = await authLogin(formData.username, formData.password);

            if (result?.success) {
                handleLoginSuccess();

                if (result?.message) {
                    toast({ title: 'Success', description: result?.message, variant: 'default' });
                }
            } else {
                const errorMessage = result?.message || 'Tizimga kirib bo\'lmadi. Login va parolni tekshiring.';
                setErrors({ general: errorMessage });
                toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Kirish vaqtida xatolik yuz berdi';
            setErrors({ general: errorMessage });
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

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

                            {import.meta.env.DEV && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                                    <p className="mb-2 text-xs font-medium text-blue-800 dark:text-blue-200">Demo hisobni tez tanlang</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setFormData({ username: 'demo_student', password: 'Physics#Study2026' })}
                                            disabled={isSubmitting || isAuthLoading}
                                        >
                                            Demo talaba
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setFormData({ username: 'demo_teacher', password: 'Physics#Teach2026' })}
                                            disabled={isSubmitting || isAuthLoading}
                                        >
                                            Demo o'qituvchi
                                        </Button>
                                    </div>
                                </div>
                            )}

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
                                onClick={handleHemisLogin}
                                disabled={isSubmitting || isAuthLoading}
                            >
                                <GraduationCap className="h-4 w-4 text-blue-600" />
                                HEMIS orqali kirish
                            </Button>

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
