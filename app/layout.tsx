import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Antonio Logistics - AI Website Builder',
  description: 'Professional freight and transportation services',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
