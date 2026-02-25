'use client';

import { useEffect, useState } from 'react';
import { api, clearTokens, getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface UserData {
  id: string;
  username: string;
  role: string;
  real_balance: string;
  bonus_balance: string;
  currency: string;
}

export default function Header() {
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    api<{ user: UserData }>('/auth/me')
      .then(data => setUser(data.user))
      .catch(() => {
        clearTokens();
        router.push('/login');
      });
  }, [router]);

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-bg-card/80 backdrop-blur-md border-b border-border-subtle flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-6">
        {user && (
          <>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-text-muted">Balance</p>
                <p className="font-mono text-accent-green font-semibold">
                  {user.currency} {parseFloat(user.real_balance || '0').toFixed(2)}
                </p>
              </div>
              {parseFloat(user.bonus_balance || '0') > 0 && (
                <div className="text-right">
                  <p className="text-xs text-text-muted">Bonus</p>
                  <p className="font-mono text-accent-gold font-semibold">
                    {user.currency} {parseFloat(user.bonus_balance).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-border-subtle" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan text-sm font-bold">
                {user.username[0].toUpperCase()}
              </div>
              <span className="text-sm text-text-primary">{user.username}</span>
              <button onClick={handleLogout} className="text-text-muted hover:text-accent-danger text-sm ml-2">
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
