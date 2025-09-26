'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'bg-gray-800 text-white border border-gray-700'
        }}
      />
    </TooltipProvider>
  );
}
