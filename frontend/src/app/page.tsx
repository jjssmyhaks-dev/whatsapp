'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { statsApi } from '@/lib/api';

/* ── Build-styled dashboard ── */
export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    (async () => {
      try {
        setLoading(true);
        const res = await statsApi.dashboard();
        setStats(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Could not load dashboard');
      } finally { setLoading(false); }
    })();
  }, [router]);

  const s = stats || { totalThreads: 0, totalMessages: 0, urgentCount: 0, importantCount: 0, routineCount: 0, fastPathHitRate: 0 };

  return (
    <div className="min-h-screen">
      {/* Hero section — generous whitespace */}
      <section className="px-8 pt-16 pb-20 max-w-5xl mx-auto">
        <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">Dashboard</p>
        <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-4">
          WhatsApp<br />Copilot
        </h1>
        <p className="text-lg text-muted-foreground max-w-md font-light">
          Smart triage for every message. Urgent things surface instantly. Routine things answer themselves.
        </p>

        {error && (
          <div className="mt-6 p-4 border border-destructive/20 bg-destructive/5 rounded-lg text-sm text-destructive">
            {error}
            <button onClick={() => window.location.reload()} className="ml-3 underline text-xs">Retry</button>
          </div>
        )}
      </section>

      {/* Stats row — clean number-only cards */}
      <section className="px-8 pb-20 max-w-5xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-3 bg-muted rounded w-16" />
                <div className="h-10 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div>
              <p className="text-xs tracking-wider text-muted-foreground uppercase mb-2">Threads</p>
              <p className="text-4xl md:text-5xl font-light tabular-nums">{s.totalThreads}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.openThreads || 0} open</p>
            </div>
            <div>
              <p className="text-xs tracking-wider text-muted-foreground uppercase mb-2">Messages</p>
              <p className="text-4xl md:text-5xl font-light tabular-nums">{s.totalMessages}</p>
              <p className="text-sm text-muted-foreground mt-1">processed</p>
            </div>
            <div>
              <p className="text-xs tracking-wider text-muted-foreground uppercase mb-2">Urgent</p>
              <p className="text-4xl md:text-5xl font-light tabular-nums">{s.urgentCount + s.importantCount}</p>
              <p className="text-sm text-muted-foreground mt-1">need attention</p>
            </div>
            <div>
              <p className="text-xs tracking-wider text-muted-foreground uppercase mb-2">Efficiency</p>
              <p className="text-4xl md:text-5xl font-light tabular-nums">{s.fastPathHitRate}%</p>
              <p className="text-sm text-muted-foreground mt-1">fast-path rate</p>
            </div>
          </div>
        )}
      </section>

      {/* Quick links — minimal horizontal list */}
      <section className="px-8 pb-20 max-w-5xl mx-auto">
        <p className="text-xs tracking-wider text-muted-foreground uppercase mb-6">Navigate</p>
        <div className="flex flex-wrap gap-x-12 gap-y-3">
          {[
            { label: 'Inbox', href: '/inbox' },
            { label: 'Templates', href: '/templates' },
            { label: 'Urgency Rules', href: '/urgency-rules' },
            { label: 'Contacts', href: '/contacts' },
            { label: 'Analytics', href: '/analytics' },
            { label: 'Settings', href: '/settings' },
          ].map(link => (
            <a key={link.href} href={link.href}
              className="text-lg font-light text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-current pb-0.5">
              {link.label}
            </a>
          ))}
        </div>
      </section>

      {/* Classification bar — subtle visual */}
      <section className="px-8 pb-32 max-w-5xl mx-auto">
        <p className="text-xs tracking-wider text-muted-foreground uppercase mb-6">Message Breakdown</p>
        <div className="flex h-1 rounded-full overflow-hidden bg-muted">
          {s.urgentCount > 0 && <div className="bg-destructive/70" style={{width: `${(s.urgentCount/Math.max(s.totalMessages,1))*100}%`}} />}
          {s.importantCount > 0 && <div className="bg-amber-500/70" style={{width: `${(s.importantCount/Math.max(s.totalMessages,1))*100}%`}} />}
          {s.routineCount > 0 && <div className="bg-emerald-500/50" style={{width: `${(s.routineCount/Math.max(s.totalMessages,1))*100}%`}} />}
        </div>
        <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive/70 inline-block" />Urgent {s.urgentCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500/70 inline-block" />Important {s.importantCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500/50 inline-block" />Routine {s.routineCount}</span>
        </div>
      </section>
    </div>
  );
}
