import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './components/theme-provider';
import './index.css';
import { AuthProvider } from "@/contexts/auth-context";


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="edulms-ui-theme">
      <BrowserRouter>
          <AuthProvider>
                 <App />
          </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);