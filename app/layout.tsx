import { MnemoProvider } from '@/components/mnemo-context/mnemo-context';
import './globals.scss';

import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Mnemo - Content & Data Manager',
  description:
    'Internal App for data and content management'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col overflow-y-auto">
        <MnemoProvider>{children}</MnemoProvider>
      </body>
      <Analytics />
    </html>
  );
}
