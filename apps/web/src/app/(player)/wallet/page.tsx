'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PlayerLayout from '@/components/layout/PlayerLayout';
import { api } from '@/lib/api';

interface WalletBalance {
  real_balance: string;
  bonus_balance: string;
  locked_balance: string;
  currency: string;
  total_balance: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  balance_after: string;
  status: string;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  deposit: 'text-accent-green',
  win: 'text-accent-green',
  voucher_redeem: 'text-accent-green',
  withdrawal: 'text-accent-danger',
  bet: 'text-accent-danger',
  bonus: 'text-accent-gold',
};

const TYPE_ICONS: Record<string, string> = {
  deposit: '↓',
  withdrawal: '↑',
  bet: '🎲',
  win: '🏆',
  bonus: '🎁',
  voucher_redeem: '🎫',
  rollback: '↩️',
};

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  useEffect(() => {
    api<WalletBalance>('/wallet/balance').then(setBalance).catch(() => {});
    api<{ transactions: Transaction[] }>('/wallet/transactions').then(d => setTransactions(d.transactions)).catch(() => {});
  }, []);

  return (
    <PlayerLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-4xl tracking-[4px] text-accent-green">WALLET</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div whileHover={{ y: -2 }} className="card">
            <p className="text-text-muted text-sm mb-1">Real Balance</p>
            <p className="font-mono text-3xl text-accent-green font-bold">
              {balance ? `${balance.currency} ${parseFloat(balance.real_balance).toFixed(2)}` : '---'}
            </p>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} className="card">
            <p className="text-text-muted text-sm mb-1">Bonus Balance</p>
            <p className="font-mono text-3xl text-accent-gold font-bold">
              {balance ? `${balance.currency} ${parseFloat(balance.bonus_balance).toFixed(2)}` : '---'}
            </p>
          </motion.div>
        </div>

        <div className="card">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'deposit' ? 'bg-accent-green text-black' : 'bg-bg text-text-muted'}`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'withdraw' ? 'bg-accent-danger text-white' : 'bg-bg text-text-muted'}`}
            >
              Withdraw
            </button>
          </div>
          <div className="text-center py-8 text-text-muted">
            <p>{activeTab === 'deposit' ? 'Payment provider integration pending' : 'Withdrawal integration pending'}</p>
            <p className="text-sm mt-2">Use the cashier voucher system to add funds</p>
          </div>
        </div>

        <div className="card">
          <h3 className="font-heading text-xl tracking-widest mb-4">TRANSACTION HISTORY</h3>
          {transactions.length === 0 ? (
            <p className="text-text-muted text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TYPE_ICONS[tx.type] || '💳'}</span>
                    <div>
                      <p className="text-sm text-text-primary capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-xs text-text-muted">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`font-mono font-semibold ${TYPE_COLORS[tx.type] || 'text-text-primary'}`}>
                    {['deposit', 'win', 'bonus', 'voucher_redeem'].includes(tx.type) ? '+' : '-'}
                    {tx.currency} {parseFloat(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PlayerLayout>
  );
}
