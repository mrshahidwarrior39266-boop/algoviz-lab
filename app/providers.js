'use client';

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { useLearningStore } from '@/store/useLearningStore';

export default function Providers({ children }) {
  useEffect(() => {
    useLearningStore.persist.rehydrate();
  }, []);

  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>;
}
