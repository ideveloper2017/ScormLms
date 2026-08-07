import { LoginForm } from "@/components/auth/LoginForm.tsx"
import { Link, useNavigate, useLocation } from 'react-router-dom';
export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <div className="relative">
        <LoginForm onSuccess={()=> {
            navigate('/', {
                state: { from: location.pathname },
                replace: true
            });
        }} />
        <Link className="fixed bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md border bg-background/95 px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted" to="/public/institution">
            Ta'lim tashkiloti haqida rasmiy axborot
        </Link>
        </div>
    )
}
