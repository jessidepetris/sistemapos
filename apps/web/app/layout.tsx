import './globals.css';
import { ReactNode } from 'react';
import Providers from './providers';
import { ErrorBoundary } from '@sentry/nextjs';

export const metadata = {
  icons: { icon: '/logo.png' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary fallback={<p>Something went wrong</p>}>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
