'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { statsApi } from '@/lib/api';
import { ArrowRight, Bell, MessageCircleReply, Radar, Zap, TrendingUp, Users } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    (async () => {
      try { setLoading(true); setError('');
        const res = await statsApi.dashboard();
        setStats(res.data);
      } catch (err: any) { setError(err.response?.data?.message || 'Could not load dashboard'); }
      finally { setLoading(false); }
    })();
  }, [router]);

  const s = stats || { totalThreads: 0, totalMessages: 0, urgentCount: 0, importantCount: 0, routineCount: 0, fastPathHitRate: 0, openThreads: 0 };

  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-4">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />Dashboard
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your WhatsApp, run by <span className="italic font-[family-name:var(--font-display)]">AI agents</span>.</h1>

        {error && <div className="mt-4 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">{error}</div>}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">{[1,2,3,4].map(i => <div key={i} className="animate-pulse h-24 rounded-2xl bg-muted" />)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Threads', value: s.totalThreads, sub: `${s.openThreads || 0} open`, icon: Users },
              { label: 'Messages', value: s.totalMessages, sub: 'processed', icon: Zap },
              { label: 'Need Attention', value: s.urgentCount + s.importantCount, sub: `${s.urgentCount} urgent`, icon: Bell },
              { label: 'Fast-Path Rate', value: `${s.fastPathHitRate}%`, sub: 'auto-handled', icon: TrendingUp },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border bg-background p-6 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
                <div className="flex items-center gap-2 mb-2"><stat.icon className="h-4 w-4 text-primary" /><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span></div>
                <div className="text-2xl font-semibold">{stat.value}</div>
                <p className="text-sm text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Inbox', desc: 'View and reply to threads', href: '/inbox', icon: MessageCircleReply },
            { label: 'Templates', desc: 'Manage auto-reply templates', href: '/templates', icon: Zap },
            { label: 'Urgency Rules', desc: 'Configure keyword alerts', href: '/urgency-rules', icon: Bell },
            { label: 'Contacts', desc: 'Manage your contacts', href: '/contacts', icon: Users },
            { label: 'Analytics', desc: 'Performance & usage stats', href: '/analytics', icon: TrendingUp },
            { label: 'Settings', desc: 'Configure your instance', href: '/settings', icon: Radar },
          ].map((link) => (
            <a key={link.href} href={link.href}
              className="group rounded-2xl border border-border bg-background p-6 transition hover:border-primary/30 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
              <link.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{link.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{link.desc}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex h-1.5 rounded-full overflow-hidden bg-muted mb-3">
          {s.urgentCount > 0 && <div className="bg-destructive/70" style={{width: `${(s.urgentCount/Math.max(s.totalMessages||1,1))*100}%`}} />}
          {s.importantCount > 0 && <div className="bg-amber-500/70" style={{width: `${(s.importantCount/Math.max(s.totalMessages||1,1))*100}%`}} />}
          {s.routineCount > 0 && <div className="bg-primary/60" style={{width: `${(s.routineCount/Math.max(s.totalMessages||1,1))*100}%`}} />}
        </div>
        <div className="flex gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive/70 inline-block" />Urgent {s.urgentCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500/70 inline-block" />Important {s.importantCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/60 inline-block" />Routine {s.routineCount}</span>
        </div>
      </section>
    </div>
  );
}
