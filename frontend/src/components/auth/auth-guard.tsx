import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';


interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('AuthGuard - Auth state changed:', { isLoading, isAuthenticated });
    
    // If we're still loading, don't do anything yet
    if (isLoading) {
      console.log('AuthGuard - Still loading auth state');
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      console.log('AuthGuard - Not authenticated, redirecting to login');
      navigate('/login', {
        state: { from: location.pathname },
        replace: true
      });
      return;
    }

    // If we get here, we're authenticated
    console.log('AuthGuard - User is authenticated, showing content');
    setIsCheckingAuth(false);
  }, [isLoading, isAuthenticated, navigate, location]);

  // Show loading spinner while checking authentication
  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }

  // Only render children if we're logged in and done checking
  return isAuthenticated ? <>{children}</> : null;
}
