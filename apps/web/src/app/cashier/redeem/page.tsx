'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerLayout from '@/components/layout/PlayerLayout';
import { api } from '@/lib/api';

export default function RedeemPage() {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ amount: string; currency: string; new_balance: string } | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);

    try {
      const data = await api<{ amount: string; currency: string; new_balance: string }>('/cashier/vouchers/redeem', {
        method: 'POST',
        body: { code: code.toUpperCase(), pin },
      });
      setSuccess(data);
      setCode('');
      setPin('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Redemption failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlayerLayout>
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="font-heading text-4xl tracking-[4px] text-accent-cashier text-center">REDEEM VOUCHER</h1>

        <div className="card">
          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Voucher Code</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="input-field font-mono text-lg text-center tracking-wider"
                placeholder="GOLD-1234-ABCD"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">PIN</label>
              <input
                type="text"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="input-field font-mono text-2xl text-center tracking-[8px]"
                placeholder="• • • •"
                maxLength={4}
                required
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-accent-danger text-sm bg-accent-danger/10 p-3 rounded-lg">
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent-green/10 border border-accent-green/30 p-6 rounded-xl text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-5xl mb-3">
                    ✅
                  </motion.div>
                  <p className="text-accent-green font-semibold text-lg mb-1">Voucher Redeemed!</p>
                  <p className="font-mono text-2xl text-accent-green font-bold">
                    +{success.currency} {parseFloat(success.amount).toFixed(2)}
                  </p>
                  <p className="text-text-muted text-sm mt-2">
                    New balance: <span className="font-mono text-text-primary">{success.currency} {parseFloat(success.new_balance).toFixed(2)}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? 'Redeeming...' : 'Redeem Voucher'}
            </button>
          </form>
        </div>
      </div>
    </PlayerLayout>
  );
}
