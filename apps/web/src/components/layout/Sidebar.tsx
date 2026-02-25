'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/casino', label: 'Casino', icon: '🎰', color: 'var(--casino)' },
  { href: '/sport', label: 'Sport', icon: '⚽', color: 'var(--sport)' },
  { href: '/wallet', label: 'Wallet', icon: '💰', color: 'var(--green)' },
  { href: '/cashier/redeem', label: 'Redeem', icon: '🎫', color: 'var(--cashier)' },
];

const adminItems = [
  { href: '/backoffice', label: 'Dashboard', icon: '📊', color: 'var(--cyan)' },
  { href: '/cashier', label: 'Cashier', icon: '🏪', color: 'var(--cashier)' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        className="fixed left-0 top-0 h-screen bg-bg-card border-r border-border-subtle z-40 flex flex-col"
      >
        <div className="p-4 flex items-center justify-between border-b border-border-subtle">
          <AnimatePresence>
            {!collapsed && (
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-heading text-2xl tracking-[6px] text-accent-cyan"
              >
                BETPRO
              </motion.h1>
            )}
          </AnimatePresence>
          <button onClick={() => setCollapsed(!collapsed)} className="text-text-muted hover:text-text-primary p-1">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <p className="text-text-muted text-xs uppercase tracking-widest px-3 mb-2">
            {!collapsed && 'Player'}
          </p>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-white/5 text-text-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-white/[0.03]'
                  }`}
                  style={active ? { borderLeft: `3px solid ${item.color}` } : {}}
                >
                  <span className="text-lg">{item.icon}</span>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}

          <p className="text-text-muted text-xs uppercase tracking-widest px-3 mt-6 mb-2">
            {!collapsed && 'Admin'}
          </p>
          {adminItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-white/5 text-text-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-white/[0.03]'
                  }`}
                  style={active ? { borderLeft: `3px solid ${item.color}` } : {}}
                >
                  <span className="text-lg">{item.icon}</span>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
}
