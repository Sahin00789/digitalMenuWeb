'use client';

import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>DigitalMenu - Smart Restaurant Menu System</title>
        <meta name="description" content="QR-based digital menu system for restaurants" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: 'white',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: 'white',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
