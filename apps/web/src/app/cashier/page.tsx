'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PlayerLayout from '@/components/layout/PlayerLayout';
import { api } from '@/lib/api';

interface Voucher {
  id: string;
  code: string;
  pin: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function CashierPage() {
  const [amount, setAmount] = useState('');
  const [currency] = useState('ILS');
  const [loading, setLoading] = useState(false);
  const [createdVoucher, setCreatedVoucher] = useState<Voucher | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ vouchers: Voucher[] }>('/cashier/vouchers')
      .then(d => setVouchers(d.vouchers))
      .catch(() => {});
  }, []);

  const createVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api<{ voucher: Voucher }>('/cashier/vouchers', {
        method: 'POST',
        body: { amount: parseFloat(amount), currency },
      });
      setCreatedVoucher(data.voucher);
      setVouchers(prev => [data.voucher, ...prev]);
      setAmount('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create voucher');
    } finally {
      setLoading(false);
    }
  };

  const statusColor: Record<string, string> = {
    active: 'bg-accent-green/20 text-accent-green',
    redeemed: 'bg-accent-cyan/20 text-accent-cyan',
    expired: 'bg-accent-danger/20 text-accent-danger',
  };

  return (
    <PlayerLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-4xl tracking-[4px] text-accent-cashier">CASHIER TERMINAL</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-heading text-xl tracking-widest mb-4">CREATE VOUCHER</h3>
            <form onSubmit={createVoucher} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1.5">Amount ({currency})</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              {error && (
                <div className="text-accent-danger text-sm bg-accent-danger/10 p-3 rounded-lg">{error}</div>
              )}
              <button type="submit" disabled={loading} className="btn-gold w-full">
                {loading ? 'Generating...' : 'Generate Voucher'}
              </button>
            </form>
          </div>

          {createdVoucher && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card border-accent-gold/30">
              <h3 className="font-heading text-xl tracking-widest text-accent-gold mb-4">VOUCHER CREATED</h3>
              <div className="text-center space-y-4">
                <div className="bg-bg rounded-xl p-6">
                  <p className="text-text-muted text-sm mb-2">Code</p>
                  <p className="font-mono text-3xl text-accent-gold font-bold tracking-wider">{createdVoucher.code}</p>
                </div>
                <div className="bg-bg rounded-xl p-4">
                  <p className="text-text-muted text-sm mb-2">PIN</p>
                  <p className="font-mono text-4xl text-text-primary font-bold tracking-[8px]">{createdVoucher.pin}</p>
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Amount: <span className="text-accent-green font-mono">{createdVoucher.currency} {parseFloat(createdVoucher.amount).toFixed(2)}</span></span>
                  <span>Expires: {new Date(createdVoucher.expires_at).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="card">
          <h3 className="font-heading text-xl tracking-widest mb-4">TODAY&apos;S VOUCHERS</h3>
          {vouchers.length === 0 ? (
            <p className="text-text-muted text-center py-8">No vouchers issued yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-muted text-left border-b border-border-subtle">
                    <th className="pb-3 px-3">Code</th>
                    <th className="pb-3 px-3">Amount</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map(v => (
                    <tr key={v.id} className="border-b border-border-subtle hover:bg-white/[0.03]">
                      <td className="py-3 px-3 font-mono text-accent-gold">{v.code}</td>
                      <td className="py-3 px-3 font-mono">{v.currency} {parseFloat(v.amount).toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className={`badge ${statusColor[v.status] || 'bg-white/10 text-text-muted'}`}>{v.status}</span>
                      </td>
                      <td className="py-3 px-3 text-text-muted">{new Date(v.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PlayerLayout>
  );
}
