import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BetPro',
  description: 'Multi-tenant sports betting and casino platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="ltr">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
