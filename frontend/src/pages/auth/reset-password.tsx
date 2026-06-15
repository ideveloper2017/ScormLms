import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Loader2, Eye, EyeOff, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { resetPasswordWithToken } from "@/lib/api";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setValidationError("Tiklash havolasi noto'g'ri. Emaildagi havolani qayta bosing."); return; }
    if (newPassword.length < 6) { setValidationError("Parol kamida 6 ta belgidan iborat bo'lishi kerak"); return; }
    if (newPassword !== confirmPassword) { setValidationError("Parollar mos kelmadi"); return; }
    setValidationError(null);
    mutation.mutate({ token, password: newPassword });
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-6">

          {done ? (
            <Card className="shadow-none border border-border p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Parol o'zgartirildi!</h2>
                <p className="text-sm text-muted-foreground">
                  Yangi parolingiz muvaffaqiyatli saqlandi. Login sahifasiga yo'naltirilmoqdasiz...
                </p>
              </div>
              <Link to="/login">
                <Button className="w-full">Login sahifasiga o'tish</Button>
              </Link>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-2">
                  <KeyRound className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Yangi parol o'rnatish</h1>
                <p className="text-sm text-muted-foreground">
                  Xavfsiz yangi parol kiriting
                </p>
              </div>

              {!token && (
                <div className="p-3 text-sm text-yellow-700 bg-yellow-50 rounded-md border border-yellow-200">
                  Tiklash havolasi topilmadi. Emaildagi havolani qayta oching.
                </div>
              )}

              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-sm font-medium">
                    Yangi parol
                  </label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      placeholder="Kamida 6 ta belgi"
                      className="pr-10"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                      disabled={isLoading || !token}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNew((v) => !v)}
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium">
                    Parolni tasdiqlang
                  </label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Parolni qayta kiriting"
                      className="pr-10"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                      disabled={isLoading || !token}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !token}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saqlanmoqda...</>
                ) : (
                  "Parolni saqlash"
                )}
              </Button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Loginga qaytish
              </Link>
            </form>
          )}
        </div>
      </div>

      <DecorativeSide />
    </div>
  );
}

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
);
