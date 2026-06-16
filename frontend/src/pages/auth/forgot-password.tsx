import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  Mail,
  ArrowLeft,
  CheckCircle,
  Play,
  GraduationCap,
  Shield,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "@/lib/api";

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
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (email: string) => forgotPassword(email),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError("Email manzilingizni kiriting");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // API call - import lazim bo'lsa: await forgotPassword(email.trim());
      await new Promise((r) => setTimeout(r, 1200)); // mock delay
      setSent(true);
    } catch {
      setError("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
    setEmailError(null);
    mutation.mutate(email.trim());
  };

  const sent = mutation.isSuccess;
  const isLoading = mutation.isPending;
  const error = emailError ?? (mutation.isError ? "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring." : null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-900">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-background shadow-2xl lg:grid-cols-2">
        {/* ── Chap panel ──────────────────────────────────────────────── */}
        <WelcomePanel />

        {/* ── O'ng panel ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-sm">
            {sent ? (
              /* Muvaffaqiyat holati */
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Xat yuborildi!</h2>
                  <p className="text-sm text-muted-foreground">
                    Agar{" "}
                    <span className="font-medium text-foreground">{email}</span>{" "}
                    manzili tizimda mavjud bo'lsa, parolni tiklash havolasi
                    yuborildi.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Havola <span className="font-medium">1 soat</span> amal
                    qiladi. Spam papkasini ham tekshiring.
                  </p>
                </div>
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" /> Tizimga kirishga qaytish
                  </Button>
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
                    Parolni tiklash
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Email manzilingizni kiriting — tiklash havolasini yuboramiz
                  </p>
                </div>

                {/* Xato xabari */}
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-100 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Email maydoni */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium leading-none"
                  >
                    Email manzil
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      disabled={isLoading}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Yuborish tugmasi */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Yuborilmoqda...
                    </>
                  ) : (
                    "Tiklash havolasini yuborish"
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
