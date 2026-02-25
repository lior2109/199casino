'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, setToken, setRefreshToken } from '@/lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api<{ access_token: string; refresh_token: string }>('/auth/register', {
        method: 'POST',
        body: form,
      });
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      router.push('/casino');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
          <p className="text-text-muted">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-1.5">First Name</label>
              <input type="text" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="input-field" placeholder="First name" />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Last Name</label>
              <input type="text" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="input-field" placeholder="Last name" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Username</label>
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="input-field" placeholder="Choose username" required />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" placeholder="your@email.com" required />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field" placeholder="Min 6 characters" required />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent-danger text-sm bg-accent-danger/10 p-3 rounded-lg">{error}</motion.div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-text-muted text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-cyan hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
