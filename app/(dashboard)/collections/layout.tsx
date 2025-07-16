'use client';

import { CollectionsProvider } from './context/collections-context';

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CollectionsProvider>
      {children}
    </CollectionsProvider>
  );
}
