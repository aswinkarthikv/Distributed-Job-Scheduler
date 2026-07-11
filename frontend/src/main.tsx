import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import App from './App';
import './index.css';

// Intercept fetch calls to dynamically prepend custom VITE_API_URL in production (e.g. for GitHub Pages)
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  let url = typeof input === 'string' ? input : input.toString();
  const apiUrl = ((import.meta as any).env.VITE_API_URL as string) || '';
  if (apiUrl && url.startsWith('/api')) {
    const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    url = `${base}${url}`;
    return originalFetch(url, init);
  }
  return originalFetch(input, init);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
