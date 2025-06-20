
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const root = document.getElementById("root")!;
root.style.padding = '0';
root.style.margin = '0';

createRoot(root).render(<App />);
