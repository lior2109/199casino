'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, setToken, setRefreshToken } from '@/lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api<{ access_token: string; refresh_token: string }>('/auth/login', {
        method: 'POST',
        body: { username, password },
      });
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      router.push('/casino');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-heading text-5xl text-accent-cyan tracking-[6px] mb-2">BETPRO</h1>
          <p className="text-text-muted">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input-field"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-accent-danger text-sm bg-accent-danger/10 p-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-text-muted text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-accent-cyan hover:underline">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
