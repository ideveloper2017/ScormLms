import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, GraduationCap, Loader2 } from "lucide-react";
import { exchangeHemisOAuthCode } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CallbackState = "loading" | "success" | "error";

const errorMessages: Record<string, string> = {
  account_not_linked: "HEMIS akkauntingiz LMSdagi talaba bilan bog‘lanmagan. Administratorga murojaat qiling.",
  account_inactive: "Talaba yoki LMS akkaunti faol emas.",
  account_conflict: "HEMIS identifikatori boshqa LMS akkaunti bilan zid keldi. Administrator tekshiruvi kerak.",
  provider_rejected: "HEMIS autentifikatsiyani bekor qildi yoki ruxsat berilmadi.",
  invalid_principal: "HEMIS foydalanuvchi ma’lumotini qaytarmadi.",
  oauth_failed: "HEMIS orqali kirishda kutilmagan xatolik yuz berdi.",
};

export default function HemisCallbackPage() {
  const [params] = useSearchParams();
  const started = useRef(false);
  const [state, setState] = useState<CallbackState>("loading");
  const [message, setMessage] = useState("HEMIS autentifikatsiyasi yakunlanmoqda...");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const providerError = params.get("error");
    const code = params.get("code");
    if (providerError) {
      setState("error");
      setMessage(errorMessages[providerError] ?? errorMessages.oauth_failed);
      return;
    }
    if (!code) {
      setState("error");
      setMessage("HEMIS login kodi topilmadi. Qaytadan urinib ko‘ring.");
      return;
    }

    void exchangeHemisOAuthCode(code)
      .then(() => {
        setState("success");
        setMessage("Muvaffaqiyatli kirildi. Bosh sahifa ochilmoqda...");
        window.location.replace("/");
      })
      .catch((error: unknown) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : errorMessages.oauth_failed);
      });
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>HEMIS orqali kirish</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          <div className="flex justify-center">
            {state === "loading" && <Loader2 className="h-8 w-8 animate-spin text-blue-600" />}
            {state === "success" && <CheckCircle2 className="h-8 w-8 text-green-600" />}
            {state === "error" && <AlertCircle className="h-8 w-8 text-red-600" />}
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
          {state === "error" && (
            <Button asChild className="w-full">
              <Link to="/login">Login sahifasiga qaytish</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
