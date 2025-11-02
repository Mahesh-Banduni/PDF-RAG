'use client';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Header from './components/Header';

export default function RootLayout({ children }) {
  const router = useRouter();
  return (
    <html lang="en">
      <body>
        <ClerkProvider navigate={(to) => router.push(to)}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
