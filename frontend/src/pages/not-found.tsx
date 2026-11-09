import { useLocation, useNavigate } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Mavjud bo'lmagan manzil ochilganda ko'rsatiladi (ilgari jimgina bosh sahifa chiqardi). */
export function NotFoundPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <Compass className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Sahifa topilmadi</h1>
        <p className="text-sm text-muted-foreground">
          <span className="break-all font-mono">{pathname}</span> manzilida sahifa yo'q. Havola eskirgan yoki noto'g'ri yozilgan bo'lishi mumkin.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>Orqaga qaytish</Button>
        <Button onClick={() => navigate("/", { replace: true })}>
          <Home className="mr-2 h-4 w-4" /> Bosh sahifa
        </Button>
      </div>
    </div>
  );
}
