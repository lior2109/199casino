'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerLayout from '@/components/layout/PlayerLayout';
import { api } from '@/lib/api';

interface Game {
  id: number;
  title: string;
  producer: string;
  category: string;
  type: string;
  image_url: string | null;
  has_demo: boolean;
}

const CATEGORIES = ['All', 'Slots', 'Live', 'Table', 'Jackpot'];

export default function CasinoPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [producers, setProducers] = useState<string[]>([]);
  const [selectedProducer, setSelectedProducer] = useState('');

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'All') params.set('category', category.toLowerCase());
      if (selectedProducer) params.set('producer', selectedProducer);
      params.set('per_page', '24');

      const data = await api<{ games: Game[] }>(`/casino/games?${params}`);
      setGames(data.games);
    } catch {
      console.error('Failed to fetch games');
    } finally {
      setLoading(false);
    }
  }, [search, category, selectedProducer]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    api<{ producers: string[] }>('/casino/games/producers')
      .then(data => setProducers(data.producers))
      .catch(() => {});
  }, []);

  const startGame = async (gameId: number) => {
    try {
      const data = await api<{ iframe_url: string }>('/casino/sessions', {
        method: 'POST',
        body: { game_id: gameId },
      });
      setIframeUrl(data.iframe_url);
    } catch (err) {
      console.error('Failed to start game', err);
    }
  };

  return (
    <PlayerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-4xl tracking-[4px] text-accent-casino">CASINO</h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search games..."
            className="input-field max-w-xs"
          />

          <select
            value={selectedProducer}
            onChange={e => setSelectedProducer(e.target.value)}
            className="input-field max-w-[200px]"
          >
            <option value="">All Producers</option>
            {producers.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  category === cat
                    ? 'bg-accent-casino text-white'
                    : 'bg-bg-card text-text-muted hover:text-text-primary border border-border-subtle'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-48 rounded-card" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-text-muted text-lg">No games found</p>
            <p className="text-text-muted text-sm mt-2">Try syncing games from the back office or adjust your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {games.map(game => (
              <motion.div
                key={game.id}
                whileHover={{ y: -4 }}
                className="card p-0 overflow-hidden group cursor-pointer"
              >
                <div className="relative h-40 bg-gradient-to-br from-accent-casino/20 to-bg-card">
                  {game.image_url ? (
                    <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🎰</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
                    <button onClick={() => startGame(game.id)} className="btn-primary text-xs px-3 py-1.5">Play</button>
                    {game.has_demo && (
                      <button className="px-3 py-1.5 rounded-lg text-xs bg-white/10 text-white hover:bg-white/20 transition">Demo</button>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-text-primary truncate">{game.title}</p>
                  <p className="text-xs text-text-muted">{game.producer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {iframeUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          >
            <button
              onClick={() => setIframeUrl(null)}
              className="absolute top-4 right-4 text-white text-2xl bg-white/10 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/20 z-10"
            >
              ✕
            </button>
            <iframe src={iframeUrl} className="w-full h-full" allowFullScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </PlayerLayout>
  );
}
