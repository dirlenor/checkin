"use client";

import { AuthProvider } from '../auth/AuthContext';
import Navigation from '../components/Navigation';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
} 