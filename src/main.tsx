import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { GlobalJobProvider } from './context/GlobalJobContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <GlobalJobProvider>
        <App />
      </GlobalJobProvider>
    </ThemeProvider>
  </StrictMode>,
);
