'use client';

import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { store } from '@/store';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </ReduxProvider>
  );
}
