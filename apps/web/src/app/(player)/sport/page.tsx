'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PlayerLayout from '@/components/layout/PlayerLayout';

interface SportEvent {
  id: string;
  league: string;
  home: string;
  away: string;
  date: string;
  isLive: boolean;
  odds: { home: number; draw: number; away: number };
}

const MOCK_EVENTS: SportEvent[] = [
  { id: '1', league: 'Premier League', home: 'Arsenal', away: 'Chelsea', date: '2024-03-15T20:00', isLive: true, odds: { home: 1.85, draw: 3.40, away: 4.20 } },
  { id: '2', league: 'La Liga', home: 'Barcelona', away: 'Real Madrid', date: '2024-03-16T21:00', isLive: false, odds: { home: 2.10, draw: 3.25, away: 3.50 } },
  { id: '3', league: 'Serie A', home: 'Juventus', away: 'AC Milan', date: '2024-03-16T18:00', isLive: false, odds: { home: 2.40, draw: 3.10, away: 3.00 } },
  { id: '4', league: 'Bundesliga', home: 'Bayern Munich', away: 'Dortmund', date: '2024-03-17T17:30', isLive: true, odds: { home: 1.55, draw: 4.00, away: 5.50 } },
];

const SPORTS = ['⚽ Football', '🏀 Basketball', '🎾 Tennis', '🏈 American Football', '⚾ Baseball'];

interface BetSlipItem {
  eventId: string;
  selection: string;
  odds: number;
  team: string;
}

export default function SportPage() {
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [stake, setStake] = useState('');

  const addToBetSlip = (event: SportEvent, selection: 'home' | 'draw' | 'away') => {
    const team = selection === 'home' ? event.home : selection === 'away' ? event.away : 'Draw';
    const exists = betSlip.find(b => b.eventId === event.id);
    if (exists) {
      setBetSlip(betSlip.filter(b => b.eventId !== event.id));
      return;
    }
    setBetSlip([...betSlip, { eventId: event.id, selection, odds: event.odds[selection], team }]);
  };

  const totalOdds = betSlip.reduce((acc, b) => acc * b.odds, 1);
  const potentialWin = parseFloat(stake || '0') * totalOdds;

  return (
    <PlayerLayout>
      <div className="flex gap-6">
        <div className="w-48 shrink-0 hidden lg:block">
          <div className="card space-y-1">
            <p className="text-text-muted text-xs uppercase tracking-widest mb-3">Sports</p>
            {SPORTS.map(sport => (
              <button key={sport} className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/[0.03] transition">
                {sport}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <h1 className="font-heading text-4xl tracking-[4px] text-accent-sport">SPORTSBOOK</h1>

          {MOCK_EVENTS.map(event => (
            <motion.div key={event.id} whileHover={{ y: -2 }} className="card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-text-muted">{event.league}</span>
                {event.isLive && (
                  <span className="badge bg-accent-green/20 text-accent-green flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-text-primary font-medium">{event.home} vs {event.away}</p>
                  <p className="text-xs text-text-muted mt-1">{new Date(event.date).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  {(['home', 'draw', 'away'] as const).map(sel => {
                    const isSelected = betSlip.some(b => b.eventId === event.id && b.selection === sel);
                    return (
                      <button
                        key={sel}
                        onClick={() => addToBetSlip(event, sel)}
                        className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                          isSelected
                            ? 'bg-accent-sport text-white'
                            : 'bg-bg border border-border-subtle text-text-primary hover:border-accent-sport'
                        }`}
                      >
                        <span className="text-xs text-text-muted block">{sel === 'home' ? '1' : sel === 'draw' ? 'X' : '2'}</span>
                        <span className="font-semibold">{event.odds[sel].toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="w-72 shrink-0 hidden lg:block">
          <div className="card sticky top-20">
            <h3 className="font-heading text-xl tracking-widest text-accent-sport mb-4">BET SLIP</h3>
            {betSlip.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">Select odds to add to bet slip</p>
            ) : (
              <div className="space-y-3">
                {betSlip.map(item => (
                  <div key={item.eventId} className="flex items-center justify-between p-2 bg-bg rounded-lg">
                    <div>
                      <p className="text-sm text-text-primary">{item.team}</p>
                      <p className="text-xs text-text-muted">{item.selection}</p>
                    </div>
                    <span className="font-mono text-accent-sport font-semibold">{item.odds.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-border-subtle pt-3 space-y-3">
                  <input
                    type="number"
                    value={stake}
                    onChange={e => setStake(e.target.value)}
                    placeholder="Stake amount"
                    className="input-field"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Total Odds</span>
                    <span className="font-mono text-text-primary">{totalOdds.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Potential Win</span>
                    <span className="font-mono text-accent-green font-semibold">{potentialWin.toFixed(2)}</span>
                  </div>
                  <button className="btn-primary w-full">Place Bet</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PlayerLayout>
  );
}
