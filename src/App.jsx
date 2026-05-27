import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '@/shared/components/ErrorBoundary';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { ToastProvider } from '@/shared/components/Toast';
import { HelmetProvider } from 'react-helmet-async';
import AppRouter from '@/app/router/AppRouter';
import AppInitializer from '@/app/providers/AppInitializer';

const App = () => (
  <HelmetProvider>
    <BrowserRouter>
      <ToastProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AppInitializer>
              <AppRouter />
            </AppInitializer>
          </ErrorBoundary>
        </ThemeProvider>
      </ToastProvider>
    </BrowserRouter>
  </HelmetProvider>
);

export default App;





