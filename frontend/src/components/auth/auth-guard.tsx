import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';

interface AuthGuardProps {
  children: ReactNode;
}

/** Tizimga kirmagan foydalanuvchini login sahifasiga yuboradi; qayerdan kelganini `state.from` da saqlaydi. */
export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [isLoading, isAuthenticated, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}
