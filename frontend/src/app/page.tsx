'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { statsApi } from '@/lib/api';
import { ArrowRight, Sparkles, Bell, MessageCircleReply, Radar } from 'lucide-react';

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

  const s = stats || { totalThreads: 0, totalMessages: 0, urgentCount: 0, importantCount: 0, routineCount: 0, fastPathHitRate: 0, openThreads: 0, waitingThreads: 0 };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(600px 300px at 20% 0%, oklch(0.92 0.11 135 / 0.5), transparent 60%)' }} />
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            WhatsApp Copilot
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            Your WhatsApp, run by{' '}
            <span className="italic font-[family-name:var(--font-display)]">AI agents</span>.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Smart triage for every message. Urgent things surface instantly. Routine things answer themselves.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/inbox" className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90">
              Open Inbox <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/templates" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition hover:bg-muted/60">
              Manage Templates
            </a>
          </div>

          {error && (
            <div className="mt-6 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive max-w-md">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-2xl border border-border bg-background p-6 animate-pulse space-y-2 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
                <div className="h-3 bg-muted rounded w-16" />
                <div className="h-8 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Threads', value: s.totalThreads, sub: `${s.openThreads || 0} open` },
              { label: 'Messages', value: s.totalMessages, sub: 'processed' },
              { label: 'Need Attention', value: s.urgentCount + s.importantCount, sub: `${s.urgentCount} urgent` },
              { label: 'Fast-Path Rate', value: `${s.fastPathHitRate}%`, sub: 'auto-handled' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border bg-background p-6 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                <div className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.sub}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-medium text-primary">Navigate</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Everything you need, one place.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Inbox', desc: 'View and reply to threads', href: '/inbox', icon: MessageCircleReply },
              { label: 'Templates', desc: 'Manage auto-reply templates', href: '/templates', icon: Sparkles },
              { label: 'Urgency Rules', desc: 'Control what gets flagged', href: '/urgency-rules', icon: Bell },
              { label: 'Contacts', desc: 'Manage your contacts', href: '/contacts', icon: Radar },
              { label: 'Analytics', desc: 'Performance & usage stats', href: '/analytics', icon: Radar },
              { label: 'Settings', desc: 'Configure your instance', href: '/settings', icon: Sparkles },
            ].map((link) => (
              <a key={link.href} href={link.href}
                className="group rounded-2xl border border-border bg-background p-6 transition hover:border-primary/30 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
                <link.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 text-base font-semibold text-foreground">{link.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{link.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Breakdown bar */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-medium text-primary mb-4">Message Breakdown</p>
        <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
          {s.urgentCount > 0 && <div className="bg-destructive/70" style={{width: `${(s.urgentCount/Math.max(s.totalMessages||1,1))*100}%`}} />}
          {s.importantCount > 0 && <div className="bg-amber-500/70" style={{width: `${(s.importantCount/Math.max(s.totalMessages||1,1))*100}%`}} />}
          {s.routineCount > 0 && <div className="bg-primary/60" style={{width: `${(s.routineCount/Math.max(s.totalMessages||1,1))*100}%`}} />}
        </div>
        <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive/70 inline-block" />Urgent {s.urgentCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500/70 inline-block" />Important {s.importantCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/60 inline-block" />Routine {s.routineCount}</span>
        </div>
      </section>
    </div>
  );
}
