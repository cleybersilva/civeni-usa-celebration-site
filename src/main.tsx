
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setSecurityHeaders } from '@/utils/securityValidation'

// Inicializar headers de segurança imediatamente
setSecurityHeaders();

const root = document.getElementById("root")!;
root.style.padding = '0';
root.style.margin = '0';

createRoot(root).render(<App />);
