import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  KeyRound,
  Lock,
  Play,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { resetPasswordWithToken } from "@/lib/api";

// ─── WelcomePanel (loginformnikiga o'xshash) ────────────────────────────────
const WelcomePanel = () => (
  <div className="relative hidden overflow-hidden bg-blue-50 p-10 dark:bg-slate-800 lg:flex lg:flex-col">
    {/* Dekorativ shakllar */}
    <div className="pointer-events-none absolute -right-10 top-10 h-40 w-40 rounded-full bg-blue-100/70 dark:bg-blue-900/30" />
    <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-indigo-100/60 dark:bg-indigo-900/20" />

    {/* Matn */}
    <div className="relative z-10 space-y-2">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Xush kelibsiz</p>
      <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">LMS</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Ta'limni Boshqarish Tizimi</p>
      <div className="h-1 w-12 rounded-full bg-blue-600" />
      <p className="max-w-xs pt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Kurslaringizga kiring, o'qishni davom ettiring va maqsadlaringizga erishing.
      </p>
    </div>

    {/* Illyustratsiya */}
    <div className="relative z-10 mt-auto flex items-end justify-center gap-4 pt-10">
      <div className="flex flex-col items-center">
        <GraduationCap className="h-16 w-16 text-blue-900 dark:text-blue-300" />
        <div className="mt-1 space-y-1">
          <div className="h-3 w-24 rounded-sm bg-blue-600" />
          <div className="h-3 w-24 rounded-sm bg-amber-400" />
          <div className="h-3 w-24 rounded-sm bg-blue-300" />
        </div>
      </div>
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
);

// ─── Main page ───────────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      resetPasswordWithToken(token, password),
    onSuccess: () => setTimeout(() => navigate("/login"), 3000),
  });

  const done = mutation.isSuccess;
  const isLoading = mutation.isPending;
  const mutationError = mutation.isError
    ? ((mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
       "Xatolik yuz berdi. Token muddati o'tgan yoki noto'g'ri bo'lishi mumkin.")
    : null;
  const error = validationError ?? mutationError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Tiklash havolasi noto'g'ri. Emaildagi havolani qayta bosing.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Parollar mos kelmadi");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await resetPasswordWithToken(token, newPassword);
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        "Xatolik yuz berdi. Token muddati o'tgan yoki noto'g'ri bo'lishi mumkin.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
    if (!token) { setValidationError("Tiklash havolasi noto'g'ri. Emaildagi havolani qayta bosing."); return; }
    if (newPassword.length < 6) { setValidationError("Parol kamida 6 ta belgidan iborat bo'lishi kerak"); return; }
    if (newPassword !== confirmPassword) { setValidationError("Parollar mos kelmadi"); return; }
    setValidationError(null);
    mutation.mutate({ token, password: newPassword });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-900">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-background shadow-2xl lg:grid-cols-2">
        {/* ── Chap panel ──────────────────────────────────────────────── */}
        <WelcomePanel />

        {/* ── O'ng panel ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-sm">
            {done ? (
              /* Muvaffaqiyat holati */
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Parol o'zgartirildi!</h2>
                  <p className="text-sm text-muted-foreground">
                    Yangi parolingiz muvaffaqiyatli saqlandi. Tizimga kirish
                    sahifasiga yo'naltirilmoqdasiz...
                  </p>
                </div>
                <Link to="/login" className="w-full">
                  <Button className="w-full">Tizimga kirishga o'tish</Button>
                </Link>
              </div>
            ) : (
              /* Asosiy forma */
              <form
                onSubmit={handleSubmit}
                className={cn("flex flex-col gap-5")}
              >
                {/* Sarlavha */}
                <div className="space-y-1">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <KeyRound className="h-5 w-5 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Yangi parol o'rnatish
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Xavfsiz yangi parol kiriting
                  </p>
                </div>

                {/* Token topilmadi ogohlantirishi */}
                {!token && (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                    Tiklash havolasi topilmadi. Emaildagi havolani qayta oching.
                  </div>
                )}

                {/* Xato xabari */}
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-100 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Yangi parol */}
                <div className="space-y-2">
                  <label
                    htmlFor="new-password"
                    className="text-sm font-medium leading-none"
                  >
                    Yangi parol
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      placeholder="Kamida 6 ta belgi"
                      className="pl-10 pr-10"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError(null);
                      }}
                      disabled={isLoading || !token}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNew((v) => !v)}
                      tabIndex={-1}
                    >
                      {showNew ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Parolni tasdiqlash */}
                <div className="space-y-2">
                  <label
                    htmlFor="confirm-password"
                    className="text-sm font-medium leading-none"
                  >
                    Parolni tasdiqlang
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Parolni qayta kiriting"
                      className="pl-10 pr-10"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      disabled={isLoading || !token}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Saqlash tugmasi */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !token}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    "Parolni saqlash"
                  )}
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">yoki</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                {/* Orqaga */}
                <p className="text-center text-sm text-muted-foreground">
                  Parolingizni esladingizmi?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Tizimga kiring
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
