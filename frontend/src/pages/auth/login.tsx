import { LoginForm } from "@/components/auth/LoginForm.tsx"
import { useNavigate, useLocation } from 'react-router-dom';
export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <LoginForm onSuccess={()=> {
            navigate('/', {
                state: { from: location.pathname },
                replace: true
            });
        }} />

    )
}
