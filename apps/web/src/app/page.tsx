'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    router.push(token ? '/casino' : '/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <h1 className="font-heading text-6xl text-accent-cyan tracking-[6px] mb-4">BETPRO</h1>
        <p className="text-text-muted">Loading...</p>
      </div>
    </div>
  );
}
