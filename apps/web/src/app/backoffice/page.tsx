'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PlayerLayout from '@/components/layout/PlayerLayout';
import { api } from '@/lib/api';

interface KpiData {
  playersToday: number;
  activeSessions: number;
  ggrToday: number;
  totalDeposits: number;
}

export default function BackOfficePage() {
  const [kpi, setKpi] = useState<KpiData>({ playersToday: 0, activeSessions: 0, ggrToday: 0, totalDeposits: 0 });
  const [transactions, setTransactions] = useState<Array<{ id: string; type: string; amount: string; currency: string; created_at: string }>>([]);

  useEffect(() => {
    api<{ transactions: Array<{ id: string; type: string; amount: string; currency: string; created_at: string }> }>('/wallet/transactions?per_page=10')
      .then(d => setTransactions(d.transactions))
      .catch(() => {});

    setKpi({ playersToday: 42, activeSessions: 18, ggrToday: 12450.00, totalDeposits: 85200.00 });
  }, []);

  const kpiCards = [
    { label: 'Players Today', value: kpi.playersToday.toString(), icon: '👥', color: 'text-accent-cyan' },
    { label: 'Active Sessions', value: kpi.activeSessions.toString(), icon: '🎮', color: 'text-accent-casino' },
    { label: 'GGR Today', value: `₪${kpi.ggrToday.toLocaleString()}`, icon: '📈', color: 'text-accent-green' },
    { label: 'Total Deposits', value: `₪${kpi.totalDeposits.toLocaleString()}`, icon: '💰', color: 'text-accent-gold' },
  ];

  const revenueData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    revenue: Math.floor(Math.random() * 20000) + 5000,
  }));

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));

  return (
    <PlayerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-4xl tracking-[4px] text-accent-cyan">BACK OFFICE</h1>
          <div className="flex gap-2">
            <button
              onClick={() => api('/casino/games/sync', { method: 'POST' }).then(() => alert('Games synced!')).catch(e => alert('Sync failed: ' + (e instanceof Error ? e.message : 'unknown')))}
              className="btn-primary text-sm"
            >
              Sync Games
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{card.icon}</span>
                <span className={`text-xs font-medium ${card.color}`}>+12%</span>
              </div>
              <p className={`font-mono text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-text-muted text-sm mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="card">
          <h3 className="font-heading text-xl tracking-widest mb-4">REVENUE — LAST 30 DAYS</h3>
          <div className="flex items-end gap-1 h-48">
            {revenueData.map((d, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                transition={{ delay: i * 0.02 }}
                className="flex-1 bg-accent-cyan/20 hover:bg-accent-cyan/40 rounded-t transition-colors cursor-pointer relative group"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-card text-xs text-text-primary px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap border border-border-subtle">
                  ₪{d.revenue.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-2">
            <span>Day 1</span>
            <span>Day 30</span>
          </div>
        </div>

        <div className="card">
          <h3 className="font-heading text-xl tracking-widest mb-4">RECENT TRANSACTIONS</h3>
          {transactions.length === 0 ? (
            <p className="text-text-muted text-center py-8">No recent transactions</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-left border-b border-border-subtle">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-border-subtle hover:bg-white/[0.03]">
                    <td className="py-3 px-3 font-mono text-xs text-text-muted">{tx.id.slice(0, 8)}...</td>
                    <td className="py-3 px-3 capitalize">{tx.type.replace('_', ' ')}</td>
                    <td className="py-3 px-3 font-mono">{tx.currency} {parseFloat(tx.amount).toFixed(2)}</td>
                    <td className="py-3 px-3 text-text-muted">{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PlayerLayout>
  );
}
