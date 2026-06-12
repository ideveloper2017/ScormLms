import { useState } from "react";
import { Link } from "react-router-dom";
import { Droplets, Loader2, Mail, ArrowLeft, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email manzilingizni kiriting");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-6">

          {sent ? (
            <Card className="shadow-none border border-border p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Xat yuborildi!</h2>
                <p className="text-sm text-muted-foreground">
                  Agar <span className="font-medium text-foreground">{email}</span> manzili
                  tizimda mavjud bo'lsa, parolni tiklash havolasi yuborildi.
                </p>
                <p className="text-xs text-muted-foreground">
                  Havola <span className="font-medium">1 soat</span> amal qiladi.
                  Spam papkasini ham tekshiring.
                </p>
              </div>
              <Link to="/login">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" /> Loginga qaytish
                </Button>
              </Link>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-2">
                  <Droplets className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Parolni tiklash</h1>
                <p className="text-sm text-muted-foreground">
                  Email manzilingizni kiriting — tiklash havolasini yuboramiz
                </p>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email manzil
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yuborilmoqda...</>
                ) : (
                  "Tiklash havolasini yuborish"
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
