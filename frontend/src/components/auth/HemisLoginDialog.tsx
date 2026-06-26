import { useState } from "react";
import { GraduationCap, Loader2, Lock, User } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hemisApi } from "@/services/api/hemis-api";
import { setToken } from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (payload: {
    accessToken: string;
    refreshToken: string;
    user: { username: string; fullName: string | null; roles: string[] };
  }) => void;
}

export function HemisLoginDialog({ open, onOpenChange, onSuccess }: Props) {
  const [login, setLogin]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password) return;

    setLoading(true);
    setError(null);
    try {
      const payload = await hemisApi.loginWithHemis(login.trim(), password);
      // Tokenlarni localStorage ga saqlaymiz
      setToken(payload.accessToken);
      localStorage.setItem("refreshToken", payload.refreshToken);
      toast.success("HEMIS orqali muvaffaqiyatli kirildi");
      onOpenChange(false);
      onSuccess(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            HEMIS orqali kirish
          </DialogTitle>
          <DialogDescription>
            NamDTU HEMIS tizimidagi login va parolingizni kiriting
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Login */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">HEMIS login</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="studentnumber yoki username"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="username"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          {/* Parol */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Parol</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                type="password"
                placeholder="HEMIS parolingiz"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading || !login.trim() || !password}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Tekshirilmoqda...</>
            ) : (
              <><GraduationCap className="h-4 w-4" />Kirish</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
