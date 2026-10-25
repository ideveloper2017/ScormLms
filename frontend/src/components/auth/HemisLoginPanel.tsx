import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, GraduationCap, Loader2, Lock, UserCog, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getHemisLoginOptions, getHemisOAuthStartUrl, hemisPasswordLogin, type HemisLoginOptions } from '@/lib/api';
import { cn } from '@/lib/utils';

type HemisRole = 'student' | 'teacher';

// Sozlamalarni olib bo'lmasa — avvalgi xatti-harakat: faqat talabalar uchun HEMIS OAuth tugmasi
const FALLBACK_OPTIONS: HemisLoginOptions = { studentPasswordLogin: false, studentOAuth: true, employeeOAuth: false };

/** HEMIS orqali kirish: talaba — HEMIS login/paroli bilan, o'qituvchi — HEMIS xodim akkaunti (OAuth) orqali. */
export function HemisLoginPanel({ disabled = false }: { disabled?: boolean }) {
  const [role, setRole] = useState<HemisRole>('student');
  const [options, setOptions] = useState<HemisLoginOptions | null>(null);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHemisLoginOptions()
      .then((value) => { if (!cancelled) setOptions(value ?? FALLBACK_OPTIONS); })
      .catch(() => { if (!cancelled) setOptions(FALLBACK_OPTIONS); });
    return () => { cancelled = true; };
  }, []);

  const busy = disabled || submitting;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!login.trim() || !password) {
      setError('HEMIS login va parolni kiriting');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await hemisPasswordLogin(login.trim(), password);
      // Auth holati localStorage'dan qayta o'qilishi uchun to'liq yuklash (HEMIS callback bilan bir xil)
      window.location.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : "HEMIS orqali kirib bo'lmadi");
      setSubmitting(false);
    }
  };

  const roleButton = (value: HemisRole, label: string, Icon: typeof UserRound) => (
    <button
      type="button"
      role="tab"
      aria-selected={role === value}
      onClick={() => { setRole(value); setError(null); }}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        role === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4" />{label}
    </button>
  );

  if (!options) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />HEMIS sozlamalari yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="HEMIS foydalanuvchi turi" className="flex gap-1 rounded-lg bg-muted p-1">
        {roleButton('student', 'Talaba', UserRound)}
        {roleButton('teacher', "O'qituvchi", UserCog)}
      </div>

      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-100 p-3 text-sm text-red-700">{error}</div>}

      {role === 'student' && (
        <>
          {options.studentPasswordLogin ? (
            <form onSubmit={submit} className="flex flex-col gap-4" aria-label="HEMIS talaba logini">
              <div className="space-y-2">
                <label htmlFor="hemis-login" className="text-sm font-medium leading-none">HEMIS login</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="hemis-login" value={login} onChange={(e) => setLogin(e.target.value)} disabled={busy}
                    placeholder="Talaba ID raqami" className="pl-10" autoComplete="username" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="hemis-password" className="text-sm font-medium leading-none">HEMIS paroli</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="hemis-password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} disabled={busy}
                    placeholder="student.hemis.uz paroli" className="pl-10 pr-10" autoComplete="current-password" />
                  <button type="button" aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword((v) => !v)} disabled={busy}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Tekshirilmoqda...</> : 'HEMIS orqali kirish'}
              </Button>
              <p className="text-xs text-muted-foreground">Parol LMS'da saqlanmaydi — u faqat HEMIS'da tekshiriladi.</p>
            </form>
          ) : !options.studentOAuth && (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Talabalar uchun HEMIS orqali kirish hali sozlanmagan. Administratorga murojaat qiling.
            </p>
          )}
          {options.studentOAuth && (
            <Button type="button" variant="outline" className="w-full gap-2" disabled={busy}
              onClick={() => window.location.assign(getHemisOAuthStartUrl('student'))}>
              <GraduationCap className="h-4 w-4 text-blue-600" />
              {options.studentPasswordLogin ? 'HEMIS sahifasi orqali kirish' : 'HEMIS orqali kirish'}
            </Button>
          )}
        </>
      )}

      {role === 'teacher' && (
        options.employeeOAuth ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              HEMIS sahifasiga o'tasiz va xodim login/parolingiz bilan kirasiz, so'ng LMS'ga avtomatik qaytasiz.
            </p>
            <Button type="button" className="w-full gap-2" disabled={busy}
              onClick={() => window.location.assign(getHemisOAuthStartUrl('employee'))}>
              <UserCog className="h-4 w-4" />O'qituvchi sifatida HEMIS orqali kirish
            </Button>
          </div>
        ) : (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            O'qituvchilar uchun HEMIS orqali kirish hali sozlanmagan. Tizim logini bilan kiring yoki administratorga murojaat qiling.
          </p>
        )
      )}
    </div>
  );
}
